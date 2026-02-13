import { config } from '../config';

describe('Auth Config', () => {
  it('should have default values', () => {
    expect(config.port).toBe(4000);
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.accessExpiry).toBe('15m');
    expect(config.jwt.refreshExpiry).toBe('7d');
  });

  it('should have database config', () => {
    expect(config.db.host).toBeDefined();
    expect(config.db.port).toBe(5432);
    expect(config.db.database).toBe('harmoniq');
  });
});

describe('Rate Limiter', () => {
  it('should be importable', () => {
    const { rateLimiter } = require('../middleware/rateLimiter');
    expect(typeof rateLimiter).toBe('function');
    expect(typeof rateLimiter()).toBe('function');
  });
});

describe('Sanitize', () => {
  it('should sanitize HTML', () => {
    const { sanitizeInput } = require('../middleware/sanitize');
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('');
    expect(sanitizeInput('<b>bold</b>')).toBe('<b>bold</b>');
    expect(sanitizeInput('<a href="https://example.com">link</a>')).toContain('href');
  });
});
