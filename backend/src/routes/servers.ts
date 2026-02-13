import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../models/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

function generateInviteCode(): string {
  return uuidv4().replace(/-/g, '').substring(0, 8);
}

// POST /api/v1/servers - Create server
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Server name is required' });
      return;
    }

    const inviteCode = generateInviteCode();
    const result = await query(
      'INSERT INTO servers (owner_id, name, description, invite_code) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, name, description || '', inviteCode]
    );

    const server = result.rows[0];

    // Add owner as member
    await query('INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)', [server.id, req.userId]);

    // Create default channels
    await query(
      "INSERT INTO channels (server_id, type, name, topic, position) VALUES ($1, 'text', 'general', 'General discussion', 0), ($1, 'voice', 'Voice Chat', 'Voice channel', 1)",
      [server.id]
    );

    // Create default role
    await query(
      "INSERT INTO roles (server_id, name, color, permissions, position) VALUES ($1, 'Member', '#3B82F6', $2, 0)",
      [server.id, JSON.stringify({ sendMessages: true, readMessages: true, connect: true })]
    );

    res.status(201).json(server);
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/servers - List user's servers
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT s.* FROM servers s
       INNER JOIN server_members sm ON s.id = sm.server_id
       WHERE sm.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List servers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/servers/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM servers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Server not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/servers/:id/channels
router.get('/:id/channels', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM channels WHERE server_id = $1 ORDER BY position ASC, created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List channels error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/servers/:id/members
router.get('/:id/members', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.status, u.last_seen, sm.nickname, sm.joined_at, sm.role_ids
       FROM server_members sm
       INNER JOIN users u ON sm.user_id = u.id
       WHERE sm.server_id = $1
       ORDER BY sm.joined_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/servers/:id/join
router.post('/:id/join', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const server = await query('SELECT * FROM servers WHERE id = $1 AND invite_code = $2', [req.params.id, inviteCode]);
    if (server.rows.length === 0) {
      res.status(404).json({ error: 'Invalid server or invite code' });
      return;
    }

    // Check if already a member
    const existing = await query('SELECT * FROM server_members WHERE server_id = $1 AND user_id = $2', [req.params.id, req.userId]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Already a member' });
      return;
    }

    await query('INSERT INTO server_members (server_id, user_id) VALUES ($1, $2)', [req.params.id, req.userId]);
    res.json({ message: 'Joined server successfully' });
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/servers/:id/kick
router.post('/:id/kick', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    const server = await query('SELECT * FROM servers WHERE id = $1 AND owner_id = $2', [req.params.id, req.userId]);
    if (server.rows.length === 0) {
      res.status(403).json({ error: 'Only the server owner can kick members' });
      return;
    }

    await query('DELETE FROM server_members WHERE server_id = $1 AND user_id = $2', [req.params.id, userId]);

    // Audit log
    await query(
      "INSERT INTO audit_logs (server_id, actor_id, action, target_type, target_id) VALUES ($1, $2, 'kick', 'user', $3)",
      [req.params.id, req.userId, userId]
    );

    res.json({ message: 'Member kicked' });
  } catch (error) {
    console.error('Kick error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/servers/:id/ban
router.post('/:id/ban', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, reason } = req.body;
    const server = await query('SELECT * FROM servers WHERE id = $1 AND owner_id = $2', [req.params.id, req.userId]);
    if (server.rows.length === 0) {
      res.status(403).json({ error: 'Only the server owner can ban members' });
      return;
    }

    await query('DELETE FROM server_members WHERE server_id = $1 AND user_id = $2', [req.params.id, userId]);

    // Audit log
    await query(
      "INSERT INTO audit_logs (server_id, actor_id, action, target_type, target_id, metadata) VALUES ($1, $2, 'ban', 'user', $3, $4)",
      [req.params.id, req.userId, userId, JSON.stringify({ reason: reason || '' })]
    );

    res.json({ message: 'Member banned' });
  } catch (error) {
    console.error('Ban error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
