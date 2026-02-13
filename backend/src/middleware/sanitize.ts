import sanitizeHtml from 'sanitize-html';
import { Request, Response, NextFunction } from 'express';

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'br', 'p', 'span'],
  allowedAttributes: {
    'a': ['href', 'title', 'target', 'rel'],
    'span': ['class'],
    'code': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, sanitizeOptions);
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  next();
}
