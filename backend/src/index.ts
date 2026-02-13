import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { config } from './config';
import { setupWebSocket } from './websocket/handler';
import { rateLimiter } from './middleware/rateLimiter';
import { sanitizeMiddleware } from './middleware/sanitize';
import authRoutes from './routes/auth';
import serverRoutes from './routes/servers';
import channelRoutes from './routes/channels';
import mediaRoutes from './routes/media';
import botRoutes from './routes/bots';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(rateLimiter(200, 60000));
app.use(sanitizeMiddleware);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/servers', serverRoutes);
app.use('/api/v1/channels', channelRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/bots', botRoutes);

// WebSocket
setupWebSocket(server);

// Start server
server.listen(config.port, '0.0.0.0', () => {
  console.log(`Harmoniq backend running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export { app, server };
