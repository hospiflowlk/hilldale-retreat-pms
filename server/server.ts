import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { initSocket } from './lib/socket';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

// Import modules
import { authRoutes } from './modules/auth';
import { mastersRoutes } from './modules/masters';
import { roomsRoutes } from './modules/rooms';
import { posRoutes } from './modules/pos';
import { expensesRoutes, accountsRoutes } from './modules/expenses';
import payrollModule from './modules/payroll';
import menuModule from './modules/menu';
import usersModule from './modules/users';
import settingsModule from './modules/settings';
import cartsModule from './modules/carts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3001', 10);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const fastify = Fastify({
  logger: IS_PRODUCTION ? { level: 'warn' } : true,
});

// Setup CORS — in production the frontend is served by the same origin
fastify.register(cors, {
  origin: IS_PRODUCTION ? false : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
});

// Setup JWT
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
});

// JWT auth decorator
fastify.decorate('authenticate', async function (request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Register API routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(mastersRoutes, { prefix: '/api/masters' });
fastify.register(roomsRoutes, { prefix: '/api/rooms' });
fastify.register(posRoutes, { prefix: '/api/pos' });
fastify.register(expensesRoutes, { prefix: '/api/expenses' });
fastify.register(accountsRoutes, { prefix: '/api/accounts' });
fastify.register(payrollModule, { prefix: '/api/payroll' });
fastify.register(menuModule, { prefix: '/api/menu' });
fastify.register(usersModule, { prefix: '/api/users' });
fastify.register(settingsModule, { prefix: '/api/settings' });
fastify.register(cartsModule, { prefix: '/api/carts' });

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// In production: serve the React build (dist/) from the same server
if (IS_PRODUCTION) {
  const distPath = path.join(__dirname, '..', 'dist');

  // Serve static assets (JS, CSS, images)
  fastify.register(import('@fastify/static'), {
    root: distPath,
    prefix: '/',
    // Don't intercept /api/* routes
    decorateReply: false,
  });

  // Catch-all: serve index.html for client-side routing (React Router)
  fastify.setNotFoundHandler(async (request, reply) => {
    if (!request.url.startsWith('/api')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf-8');
        reply.type('text/html').send(html);
        return;
      }
    }
    reply.code(404).send({ error: 'Not Found' });
  });
}

const start = async () => {
  try {
    await fastify.ready();
    // Initialize Socket.io on the raw Node HTTP server from Fastify
    initSocket(fastify.server);

    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🏨 Hilldale Retreat PMS running on http://0.0.0.0:${PORT} [${IS_PRODUCTION ? 'PRODUCTION' : 'development'}]`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
