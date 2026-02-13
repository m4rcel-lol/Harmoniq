import { Server as SocketServer, Socket } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../models/db';

interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

export function setupWebSocket(server: Server) {
  const io = new SocketServer(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/ws',
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret) as { userId: string; username: string };
      (socket as AuthenticatedSocket).userId = payload.userId;
      (socket as AuthenticatedSocket).username = payload.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = (socket as AuthenticatedSocket).userId;
    const username = (socket as AuthenticatedSocket).username;
    console.log(`User connected: ${username} (${userId})`);

    // Update presence
    await query("UPDATE users SET status = 'online', last_seen = NOW() WHERE id = $1", [userId]);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join server rooms
    const servers = await query('SELECT server_id FROM server_members WHERE user_id = $1', [userId]);
    for (const row of servers.rows) {
      socket.join(`server:${row.server_id}`);
    }

    // Broadcast presence
    io.emit('presence.update', { userId, status: 'online', lastActive: new Date().toISOString() });

    // Handle channel join
    socket.on('channel.join', (channelId: string) => {
      socket.join(`channel:${channelId}`);
    });

    // Handle channel leave
    socket.on('channel.leave', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    // Handle new message
    socket.on('message.create', async (data: { channelId: string; content: string; replyToId?: string }) => {
      try {
        const result = await query(
          'INSERT INTO messages (channel_id, author_id, content, reply_to_id) VALUES ($1, $2, $3, $4) RETURNING *',
          [data.channelId, userId, data.content, data.replyToId || null]
        );

        const message = result.rows[0];
        const author = await query('SELECT username, display_name, avatar_url FROM users WHERE id = $1', [userId]);
        message.author_username = author.rows[0].username;
        message.author_display_name = author.rows[0].display_name;
        message.author_avatar = author.rows[0].avatar_url;
        message.attachments = [];
        message.reactions = [];

        io.to(`channel:${data.channelId}`).emit('message.create', message);
      } catch (error) {
        console.error('WS message.create error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message edit
    socket.on('message.update', async (data: { id: string; channelId: string; content: string }) => {
      try {
        const result = await query(
          'UPDATE messages SET content = $1, edited_at = NOW() WHERE id = $2 AND author_id = $3 RETURNING *',
          [data.content, data.id, userId]
        );

        if (result.rows.length > 0) {
          io.to(`channel:${data.channelId}`).emit('message.update', {
            id: data.id,
            content: data.content,
            editedAt: result.rows[0].edited_at,
          });
        }
      } catch (error) {
        console.error('WS message.update error:', error);
      }
    });

    // Handle message delete
    socket.on('message.delete', async (data: { id: string; channelId: string }) => {
      try {
        await query('UPDATE messages SET deleted_at = NOW() WHERE id = $1 AND author_id = $2', [data.id, userId]);
        io.to(`channel:${data.channelId}`).emit('message.delete', {
          id: data.id,
          channelId: data.channelId,
          deletedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('WS message.delete error:', error);
      }
    });

    // Typing indicators
    socket.on('typing.start', (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('typing.start', { channelId: data.channelId, userId, username });
    });

    socket.on('typing.stop', (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('typing.stop', { channelId: data.channelId, userId });
    });

    // Reactions
    socket.on('reaction.add', async (data: { messageId: string; channelId: string; emoji: string }) => {
      try {
        await query(
          'INSERT INTO reactions (message_id, emoji, user_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [data.messageId, data.emoji, userId]
        );
        io.to(`channel:${data.channelId}`).emit('reaction.add', { messageId: data.messageId, emoji: data.emoji, userId });
      } catch (error) {
        console.error('WS reaction.add error:', error);
      }
    });

    socket.on('reaction.remove', async (data: { messageId: string; channelId: string; emoji: string }) => {
      try {
        await query('DELETE FROM reactions WHERE message_id = $1 AND emoji = $2 AND user_id = $3', [data.messageId, data.emoji, userId]);
        io.to(`channel:${data.channelId}`).emit('reaction.remove', { messageId: data.messageId, emoji: data.emoji, userId });
      } catch (error) {
        console.error('WS reaction.remove error:', error);
      }
    });

    // WebRTC signaling
    socket.on('voice.join', (data: { roomId: string }) => {
      socket.join(`voice:${data.roomId}`);
      socket.to(`voice:${data.roomId}`).emit('voice.join', { roomId: data.roomId, userId, username });
    });

    socket.on('voice.leave', (data: { roomId: string }) => {
      socket.leave(`voice:${data.roomId}`);
      socket.to(`voice:${data.roomId}`).emit('voice.leave', { roomId: data.roomId, userId });
    });

    socket.on('voice.signal', (data: { roomId: string; targetUserId: string; signal: any }) => {
      io.to(`user:${data.targetUserId}`).emit('voice.signal', {
        roomId: data.roomId,
        userId,
        signal: data.signal,
      });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${username}`);
      await query("UPDATE users SET status = 'offline', last_seen = NOW() WHERE id = $1", [userId]);
      io.emit('presence.update', { userId, status: 'offline', lastActive: new Date().toISOString() });
    });
  });

  return io;
}
