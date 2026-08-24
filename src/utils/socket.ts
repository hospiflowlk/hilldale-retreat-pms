/// <reference types="vite/client" />
import { io } from 'socket.io-client';

// In production: connect to same origin (relative), backend serves both frontend and socket.io
// In development: connect to the Fastify dev server on port 3001
const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : import.meta.env.PROD
    ? window.location.origin
    : 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
