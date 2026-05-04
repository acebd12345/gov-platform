import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

/**
 * Simple in-memory rate limiter.
 * In production, use Redis-backed rate limiting.
 */
const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(opts: { maxRequests: number; windowMs: number }) {
  return createMiddleware(async (c, next) => {
    const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      store.set(key, entry);
    }

    entry.count++;

    c.header('X-RateLimit-Limit', String(opts.maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, opts.maxRequests - entry.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > opts.maxRequests) {
      throw new HTTPException(429, { message: 'Too many requests' });
    }

    await next();
  });
}

// Periodically clean up expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);
