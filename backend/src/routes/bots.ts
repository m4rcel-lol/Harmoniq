import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { query } from '../models/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/v1/bots - Create bot
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, webhookUrl } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Bot name is required' });
      return;
    }

    const token = `hbot_${uuidv4().replace(/-/g, '')}`;
    const tokenHash = await bcrypt.hash(token, 10);

    const result = await query(
      'INSERT INTO bots (owner_id, name, description, token_hash, webhook_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, description, webhook_url, created_at',
      [req.userId, name, description || '', tokenHash, webhookUrl || null]
    );

    res.status(201).json({ ...result.rows[0], token });
  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/bots
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, description, webhook_url, created_at FROM bots WHERE owner_id = $1',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List bots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/webhooks/:channelId
router.post('/webhooks/:channelId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const token = `whk_${uuidv4().replace(/-/g, '')}`;
    const tokenHash = await bcrypt.hash(token, 10);

    const result = await query(
      'INSERT INTO webhooks (channel_id, name, token_hash) VALUES ($1, $2, $3) RETURNING id, name, created_at',
      [req.params.channelId, name || 'Webhook', tokenHash]
    );

    res.status(201).json({ ...result.rows[0], token, url: `/api/v1/webhooks/${result.rows[0].id}/execute` });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
