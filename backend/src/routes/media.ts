import { Router, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { query } from '../models/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

// Use memory storage for upload, then pipe to MinIO
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|ogg|mp3|wav|pdf|zip|txt|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// POST /api/v1/media - Upload file
router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const { messageId } = req.body;
    const fileId = uuidv4();
    const ext = path.extname(req.file.originalname);
    const key = `uploads/${fileId}${ext}`;

    // In production, upload to MinIO here
    // For now, we generate a URL pattern
    const fileUrl = `/api/v1/media/files/${fileId}${ext}`;

    if (messageId) {
      await query(
        'INSERT INTO attachments (message_id, url, filename, mime_type, size_bytes) VALUES ($1, $2, $3, $4, $5)',
        [messageId, fileUrl, req.file.originalname, req.file.mimetype, req.file.size]
      );
    }

    res.status(201).json({
      id: fileId,
      url: fileUrl,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
