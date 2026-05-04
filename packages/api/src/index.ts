import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';
import { tenantMiddleware } from './middleware/tenant.js';
import { rateLimit } from './middleware/rate-limit.js';
import { serveStatic } from '@hono/node-server/serve-static';
import contentRoutes from './routes/content.js';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenant.js';
import mediaRoutes from './routes/media.js';
import openRoutes from './routes/open.js';
import categoriesRoutes from './routes/categories.js';
import navigationRoutes from './routes/navigation.js';

const app = new Hono();

// ===== Global Middleware =====

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);

// Rate limiting
app.use('/api/v1/*', rateLimit({ maxRequests: 100, windowMs: 60_000 }));

// ===== Health Check =====

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ===== API v1 Routes =====

const v1 = new Hono();

// Tenant identification for all v1 routes
v1.use('*', tenantMiddleware);

// Mount route modules
// NOTE: more-specific paths must be mounted BEFORE the generic /content,
// otherwise Hono will dispatch nested URLs to contentRoutes' notFound handler.
v1.route('/content/media', mediaRoutes);
v1.route('/content/categories', categoriesRoutes);
v1.route('/content/navigation', navigationRoutes);
v1.route('/content', contentRoutes);
v1.route('/auth', authRoutes);
v1.route('/tenant', tenantRoutes);
v1.route('/open', openRoutes);

// Serve uploaded files
app.use('/uploads/*', serveStatic({ root: './' }));

app.route('/api/v1', v1);

// ===== Error Handler =====

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      { error: { code: err.status.toString(), message: err.message } },
      err.status
    );
  }

  console.error('Unhandled error:', err);
  return c.json(
    { error: { code: 'INTERNAL_ERROR', message: '伺服器內部錯誤' } },
    500
  );
});

app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: '找不到該路由' } }, 404);
});

// ===== Start Server =====

const PORT = Number(process.env.PORT ?? 4000);

console.log(`
╔══════════════════════════════════════════╗
║  臺北市政府多租戶網站平台 — API Server    ║
║  Port: ${PORT}                              ║
║  Env: ${process.env.NODE_ENV ?? 'development'}                       ║
╚══════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port: PORT,
});

export default app;
