import { Router, Response } from 'express';
import { query } from '../models/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/v1/channels - Create channel
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId, type, name, topic } = req.body;
    if (!serverId || !name) {
      res.status(400).json({ error: 'Server ID and channel name are required' });
      return;
    }

    // Check ownership
    const server = await query('SELECT * FROM servers WHERE id = $1 AND owner_id = $2', [serverId, req.userId]);
    if (server.rows.length === 0) {
      res.status(403).json({ error: 'Only the server owner can create channels' });
      return;
    }

    const result = await query(
      'INSERT INTO channels (server_id, type, name, topic) VALUES ($1, $2, $3, $4) RETURNING *',
      [serverId, type || 'text', name, topic || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/channels/:id/messages
router.get('/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const before = req.query.before as string;

    let queryStr = `
      SELECT m.*, u.username as author_username, u.display_name as author_display_name, u.avatar_url as author_avatar
      FROM messages m
      INNER JOIN users u ON m.author_id = u.id
      WHERE m.channel_id = $1 AND m.deleted_at IS NULL
    `;
    const params: any[] = [req.params.id];

    if (before) {
      queryStr += ' AND m.created_at < $2';
      params.push(before);
    }

    queryStr += ' ORDER BY m.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await query(queryStr, params);
    const messages = result.rows;

    if (messages.length > 0) {
      const messageIds = messages.map((m: any) => m.id);

      // Batch fetch attachments for all messages
      const attachments = await query(
        'SELECT * FROM attachments WHERE message_id = ANY($1)',
        [messageIds]
      );
      const attachmentsByMsg = new Map<string, any[]>();
      for (const att of attachments.rows) {
        const list = attachmentsByMsg.get(att.message_id) || [];
        list.push(att);
        attachmentsByMsg.set(att.message_id, list);
      }

      // Batch fetch reactions for all messages
      const reactions = await query(
        `SELECT message_id, emoji, array_agg(user_id) as user_ids, COUNT(*) as count
         FROM reactions WHERE message_id = ANY($1) GROUP BY message_id, emoji`,
        [messageIds]
      );
      const reactionsByMsg = new Map<string, any[]>();
      for (const r of reactions.rows) {
        const list = reactionsByMsg.get(r.message_id) || [];
        list.push({ emoji: r.emoji, user_ids: r.user_ids, count: r.count });
        reactionsByMsg.set(r.message_id, list);
      }

      for (const msg of messages) {
        msg.attachments = attachmentsByMsg.get(msg.id) || [];
        msg.reactions = reactionsByMsg.get(msg.id) || [];
      }
    }

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/channels/:id/messages
router.post('/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content, replyToId } = req.body;
    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const result = await query(
      'INSERT INTO messages (channel_id, author_id, content, reply_to_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, req.userId, content, replyToId || null]
    );

    const message = result.rows[0];

    // Get author info
    const author = await query('SELECT username, display_name, avatar_url FROM users WHERE id = $1', [req.userId]);
    message.author_username = author.rows[0].username;
    message.author_display_name = author.rows[0].display_name;
    message.author_avatar = author.rows[0].avatar_url;
    message.attachments = [];
    message.reactions = [];

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/channels/:channelId/messages/:messageId
router.put('/:channelId/messages/:messageId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { content } = req.body;
    const result = await query(
      'UPDATE messages SET content = $1, edited_at = NOW() WHERE id = $2 AND author_id = $3 AND deleted_at IS NULL RETURNING *',
      [content, req.params.messageId, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Message not found or unauthorized' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/channels/:channelId/messages/:messageId
router.delete('/:channelId/messages/:messageId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'UPDATE messages SET deleted_at = NOW() WHERE id = $1 AND author_id = $2 AND deleted_at IS NULL RETURNING *',
      [req.params.messageId, req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Message not found or unauthorized' });
      return;
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/channels/:channelId/messages/:messageId/pin
router.post('/:channelId/messages/:messageId/pin', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'UPDATE messages SET is_pinned = NOT is_pinned WHERE id = $1 AND channel_id = $2 RETURNING *',
      [req.params.messageId, req.params.channelId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/channels/:channelId/messages/:messageId/reactions
router.post('/:channelId/messages/:messageId/reactions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' });
      return;
    }

    await query(
      'INSERT INTO reactions (message_id, emoji, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [req.params.messageId, emoji, req.userId]
    );

    res.json({ message: 'Reaction added' });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/channels/:channelId/messages/:messageId/reactions/:emoji
router.delete('/:channelId/messages/:messageId/reactions/:emoji', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await query(
      'DELETE FROM reactions WHERE message_id = $1 AND emoji = $2 AND user_id = $3',
      [req.params.messageId, req.params.emoji, req.userId]
    );

    res.json({ message: 'Reaction removed' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/channels/:id/search
router.get('/:id/search', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const searchQuery = req.query.q as string;
    if (!searchQuery) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const result = await query(
      `SELECT m.*, u.username as author_username, u.display_name as author_display_name
       FROM messages m
       INNER JOIN users u ON m.author_id = u.id
       WHERE m.channel_id = $1 AND m.deleted_at IS NULL
       AND to_tsvector('english', coalesce(m.content, '')) @@ plainto_tsquery('english', $2)
       ORDER BY m.created_at DESC LIMIT 50`,
      [req.params.id, searchQuery]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
