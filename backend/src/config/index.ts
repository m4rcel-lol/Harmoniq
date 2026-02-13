import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'harmoniq',
    password: process.env.DB_PASSWORD || 'harmoniq_secret',
    database: process.env.DB_NAME || 'harmoniq',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'harmoniq',
    secretKey: process.env.MINIO_SECRET_KEY || 'harmoniq_secret',
    bucket: process.env.MINIO_BUCKET || 'harmoniq-uploads',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'harmoniq-jwt-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'harmoniq-refresh-secret-change-me',
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },
  coturn: {
    host: process.env.COTURN_HOST || 'localhost',
    port: parseInt(process.env.COTURN_PORT || '3478', 10),
    secret: process.env.COTURN_SECRET || 'harmoniq-turn-secret',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
