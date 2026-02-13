import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../models/db';
import { config } from '../config';
import { authenticate, AuthRequest } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

function generateTokens(userId: string, username: string) {
  const accessToken = jwt.sign({ userId, username }, config.jwt.secret, { expiresIn: config.jwt.accessExpiry as jwt.SignOptions['expiresIn'] });
  const refreshToken = jwt.sign({ userId, tokenId: uuidv4() }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'] });
  return { accessToken, refreshToken };
}

// POST /api/v1/auth/register
router.post('/register', rateLimiter(10, 60000), async (req: Request, res: Response) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check existing user
    const existing = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Username or email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (username, display_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, username, display_name, email, avatar_url, created_at',
      [username, displayName || username, email, passwordHash]
    );

    const user = result.rows[0];
    const tokens = generateTokens(user.id, user.username);

    // Store refresh token hash
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [user.id, refreshHash, expiresAt]);

    res.status(201).json({ user, ...tokens });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/login
router.post('/login', rateLimiter(20, 60000), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await query('SELECT id, username, display_name, email, password_hash, avatar_url FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const tokens = generateTokens(user.id, user.username);

    // Store refresh token hash
    const refreshHash = await bcrypt.hash(tokens.refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query('INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)', [user.id, refreshHash, expiresAt]);

    // Update last seen
    await query('UPDATE users SET last_seen = NOW(), status = $1 WHERE id = $2', ['online', user.id]);

    const { password_hash: _, ...safeUser } = user;
    res.json({ user: safeUser, ...tokens });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string };
    const user = await query('SELECT id, username FROM users WHERE id = $1', [payload.userId]);
    if (user.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokens = generateTokens(user.rows[0].id, user.rows[0].username);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, username, display_name, email, avatar_url, status, last_seen, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
