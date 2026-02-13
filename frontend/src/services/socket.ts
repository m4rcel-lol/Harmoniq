import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(window.location.origin, {
    path: '/ws',
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => console.log('WebSocket connected'));
  socket.on('disconnect', (reason) => console.log('WebSocket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('WebSocket error:', err.message));

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
