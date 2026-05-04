import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, publicSchema } from '@gov/db';
import { eq, and } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
const { compare, hash } = bcryptjs;
import { signToken, signRefreshToken } from '../middleware/auth.js';
import type { TenantContext } from '../middleware/tenant.js';
import type { Role } from '@gov/shared';

const app = new Hono<{ Variables: { tenant: TenantContext } }>();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * POST /api/v1/auth/admin/login
 * Backend admin login with email + password.
 */
app.post('/admin/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const tenant = c.get('tenant');

  // Find user
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (!user || !user.hashedPassword) {
    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' } }, 401);
  }

  // Verify password
  const isValid = await compare(password, user.hashedPassword);
  if (!isValid) {
    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: '帳號或密碼錯誤' } }, 401);
  }

  // Check membership in this tenant (unless super admin)
  let role: Role = 'viewer';
  if (user.isSuperAdmin) {
    role = 'admin';
  } else {
    const membership = await db.query.tenantMembers.findFirst({
      where: (tm, { eq, and }) =>
        and(eq(tm.tenantId, tenant.tenantId), eq(tm.userId, user.id)),
    });

    if (!membership) {
      return c.json(
        { error: { code: 'NOT_A_MEMBER', message: '您不是此局處的成員' } },
        403
      );
    }
    role = membership.role as Role;
  }

  // Update last login
  await db
    .update(publicSchema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(publicSchema.users.id, user.id));

  // Issue tokens
  const accessToken = await signToken({
    sub: user.id,
    tenant_id: tenant.tenantSlug,
    role,
    is_super_admin: user.isSuperAdmin ?? false,
  });
  const refreshToken = await signRefreshToken(user.id);

  // Audit log
  await db.insert(publicSchema.auditLogs).values({
    tenantId: tenant.tenantId,
    actorId: user.id,
    action: 'login',
    resourceType: 'user',
    resourceId: user.id,
    ipAddress: c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? null,
  });

  return c.json({
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role,
        isSuperAdmin: user.isSuperAdmin,
      },
    },
  });
});

/**
 * GET /api/v1/auth/me/tenants
 * List all tenants the current user belongs to.
 * Super admins see all tenants.
 */
app.get('/me/tenants', async (c) => {
  // Inline auth check (no tenant middleware dependency)
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: '需要登入' } }, 401);
  }
  const token = authHeader.slice(7);

  let payload: { sub: string; is_super_admin?: boolean };
  try {
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-in-production');
    const { payload: p } = await jwtVerify(token, secret);
    payload = p as any;
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Token 無效' } }, 401);
  }

  if (payload.is_super_admin) {
    // Super admin: return ALL tenants
    const allTenants = await db
      .select({
        id: publicSchema.tenants.id,
        slug: publicSchema.tenants.slug,
        name: publicSchema.tenants.name,
        domain: publicSchema.tenants.domain,
      })
      .from(publicSchema.tenants)
      .orderBy(publicSchema.tenants.name);

    return c.json({ data: allTenants });
  }

  // Regular user: return tenants they are a member of
  const myTenants = await db
    .select({
      id: publicSchema.tenants.id,
      slug: publicSchema.tenants.slug,
      name: publicSchema.tenants.name,
      domain: publicSchema.tenants.domain,
      role: publicSchema.tenantMembers.role,
    })
    .from(publicSchema.tenantMembers)
    .innerJoin(publicSchema.tenants, eq(publicSchema.tenants.id, publicSchema.tenantMembers.tenantId))
    .where(eq(publicSchema.tenantMembers.userId, payload.sub))
    .orderBy(publicSchema.tenants.name);

  return c.json({ data: myTenants });
});

/**
 * POST /api/v1/auth/admin/refresh
 * Refresh access token using refresh token.
 */
app.post('/admin/refresh', async (c) => {
  const body = await c.req.json<{ refreshToken: string }>();
  // In production: verify refresh token, check revocation list, etc.
  // Simplified for Phase 1.
  return c.json({
    error: { code: 'NOT_IMPLEMENTED', message: 'Refresh token endpoint – coming soon' },
  }, 501);
});

/**
 * POST /api/v1/auth/admin/logout
 * Revoke refresh token.
 */
app.post('/admin/logout', async (c) => {
  // In production: add refresh token to revocation list in Redis.
  return c.json({ data: { message: '已登出' } });
});

export default app;
