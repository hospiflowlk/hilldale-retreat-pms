import { Server as SocketIOServer } from 'socket.io';
import type { FastifyInstance } from 'fastify';

let io: SocketIOServer;

export function initSocket(server: any) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allow all for local dev
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected via Socket.io: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}
