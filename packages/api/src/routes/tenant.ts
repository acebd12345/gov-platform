import { Hono } from 'hono';
import bcryptjs from 'bcryptjs';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db, publicSchema, createTenantSchema } from '@gov/db';
import { eq, desc, and } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { TenantContext } from '../middleware/tenant.js';
import type { AuthContext } from '../middleware/auth.js';
import type { Role } from '@gov/shared';

type Env = { Variables: { tenant: TenantContext; auth: AuthContext } };

const app = new Hono<Env>();

/**
 * GET /api/v1/tenant/config
 * Public tenant configuration (brand tokens, logo, etc.)
 */
app.get('/config', async (c) => {
  const tenant = c.get('tenant');

  const tenantData = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, tenant.tenantSlug),
  });

  if (!tenantData) {
    return c.json({ error: { code: 'NOT_FOUND', message: '租戶不存在' } }, 404);
  }

  return c.json({
    data: {
      slug: tenantData.slug,
      name: tenantData.name,
      domain: tenantData.domain,
      brandTokens: tenantData.brandTokens,
      featureFlags: tenantData.featureFlags,
      homepageConfig: tenantData.homepageConfig ?? {},
      reviewRequired: tenantData.reviewRequired,
    },
    meta: { tenant: tenant.tenantSlug },
  });
});

/**
 * PUT /api/v1/tenant/config
 * Update tenant config (admin+).
 */
app.put(
  '/config',
  authMiddleware,
  requireRole('admin'),
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).max(255).optional(),
      brandTokens: z.record(z.string()).optional(),
      featureFlags: z.record(z.boolean()).optional(),
      // 首頁模組設定 — 結構彈性，不在 zod 內逐一驗
      homepageConfig: z.record(z.unknown()).optional(),
      reviewRequired: z.boolean().optional(),
    })
  ),
  async (c) => {
    const body = c.req.valid('json');
    const tenant = c.get('tenant');
    const auth = c.get('auth');

    const [before] = await db
      .select()
      .from(publicSchema.tenants)
      .where(eq(publicSchema.tenants.id, tenant.tenantId))
      .limit(1);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name) updates.name = body.name;
    if (body.brandTokens) updates.brandTokens = body.brandTokens;
    if (body.featureFlags) updates.featureFlags = body.featureFlags;
    if (body.homepageConfig) updates.homepageConfig = body.homepageConfig;
    if (body.reviewRequired !== undefined) updates.reviewRequired = body.reviewRequired;

    await db
      .update(publicSchema.tenants)
      .set(updates)
      .where(eq(publicSchema.tenants.id, tenant.tenantId));

    await db.insert(publicSchema.auditLogs).values({
      tenantId: tenant.tenantId,
      actorId: auth.userId,
      action: 'update',
      resourceType: 'tenant_config',
      resourceId: tenant.tenantId,
      beforeSnapshot: before,
      afterSnapshot: { ...before, ...updates },
    });

    return c.json({ data: { message: '設定已更新' } });
  }
);

/**
 * GET /api/v1/tenant/members
 * List tenant members (admin+).
 */
app.get('/members', authMiddleware, requireRole('admin'), async (c) => {
  const tenant = c.get('tenant');

  const members = await db
    .select({
      id: publicSchema.tenantMembers.id,
      userId: publicSchema.tenantMembers.userId,
      role: publicSchema.tenantMembers.role,
      createdAt: publicSchema.tenantMembers.createdAt,
      email: publicSchema.users.email,
      isSuperAdmin: publicSchema.users.isSuperAdmin,
      lastLoginAt: publicSchema.users.lastLoginAt,
    })
    .from(publicSchema.tenantMembers)
    .innerJoin(publicSchema.users, eq(publicSchema.users.id, publicSchema.tenantMembers.userId))
    .where(eq(publicSchema.tenantMembers.tenantId, tenant.tenantId));

  return c.json({ data: members, meta: { tenant: tenant.tenantSlug } });
});

/**
 * POST /api/v1/tenant/members
 * Add a member to tenant (admin+).
 */
app.post(
  '/members',
  authMiddleware,
  requireRole('admin'),
  zValidator(
    'json',
    z.object({
      email: z.string().email().optional(),
      userId: z.string().uuid().optional(),
      role: z.enum(['admin', 'editor_in_chief', 'editor', 'viewer']),
    })
  ),
  async (c) => {
    const body = c.req.valid('json');
    const tenant = c.get('tenant');

    let resolvedUserId = body.userId;

    // If email is provided instead of userId, look up the user
    if (!resolvedUserId && body.email) {
      let user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, body.email!),
      });

      // NEW: If user not found, create them with a default password "Welcome123"
      if (!user) {
        const hashedPassword = await bcryptjs.hash('Welcome123', 10);
        const [newUser] = await db
          .insert(publicSchema.users)
          .values({
            email: body.email!,
            hashedPassword,
            isSuperAdmin: false,
          })
          .returning();
        user = newUser;
      }
      resolvedUserId = user.id;
    }

    if (!resolvedUserId) {
      return c.json({ error: { code: 'BAD_REQUEST', message: '請提供 email 或 userId' } }, 400);
    }

    const [member] = await db
      .insert(publicSchema.tenantMembers)
      .values({
        tenantId: tenant.tenantId,
        userId: resolvedUserId,
        role: body.role,
      })
      .onConflictDoNothing()
      .returning();

    if (!member) {
      return c.json({ error: { code: 'CONFLICT', message: '該用戶已是成員' } }, 409);
    }

    return c.json({ data: member }, 201);
  }
);

/**
 * PATCH /api/v1/tenant/members/:userId/role
 * Change member role (admin+).
 */
app.patch(
  '/members/:userId/role',
  authMiddleware,
  requireRole('admin'),
  zValidator('json', z.object({ role: z.enum(['admin', 'editor_in_chief', 'editor', 'viewer']) })),
  async (c) => {
    const userId = c.req.param('userId');
    const { role } = c.req.valid('json');
    const tenant = c.get('tenant');
    const auth = c.get('auth');

    const [before] = await db
      .select()
      .from(publicSchema.tenantMembers)
      .where(
        and(
          eq(publicSchema.tenantMembers.tenantId, tenant.tenantId),
          eq(publicSchema.tenantMembers.userId, userId)
        )
      )
      .limit(1);

    await db
      .update(publicSchema.tenantMembers)
      .set({ role })
      .where(
        and(
          eq(publicSchema.tenantMembers.tenantId, tenant.tenantId),
          eq(publicSchema.tenantMembers.userId, userId)
        )
      );

    await db.insert(publicSchema.auditLogs).values({
      tenantId: tenant.tenantId,
      actorId: auth.userId,
      action: 'update',
      resourceType: 'user',
      resourceId: userId,
      beforeSnapshot: before,
      afterSnapshot: { ...before, role },
    });

    return c.json({ data: { message: '角色已更新' } });
  }
);

/**
 * DELETE /api/v1/tenant/members/:userId
 * Remove member from tenant (admin+).
 */
app.delete('/members/:userId', authMiddleware, requireRole('admin'), async (c) => {
  const userId = c.req.param('userId');
  const tenant = c.get('tenant');

  await db
    .delete(publicSchema.tenantMembers)
    .where(
      and(
        eq(publicSchema.tenantMembers.tenantId, tenant.tenantId),
        eq(publicSchema.tenantMembers.userId, userId)
      )
    );

  return c.json({ data: { message: '成員已移除' } });
});

/**
 * GET /api/v1/tenant/audit
 * List audit logs for this tenant (admin+).
 */
app.get('/audit', authMiddleware, requireRole('admin'), async (c) => {
  const tenant = c.get('tenant');

  const logs = await db
    .select({
      id: publicSchema.auditLogs.id,
      actorId: publicSchema.auditLogs.actorId,
      actorEmail: publicSchema.users.email,
      action: publicSchema.auditLogs.action,
      resourceType: publicSchema.auditLogs.resourceType,
      resourceId: publicSchema.auditLogs.resourceId,
      ipAddress: publicSchema.auditLogs.ipAddress,
      createdAt: publicSchema.auditLogs.createdAt,
    })
    .from(publicSchema.auditLogs)
    .leftJoin(publicSchema.users, eq(publicSchema.users.id, publicSchema.auditLogs.actorId))
    .where(eq(publicSchema.auditLogs.tenantId, tenant.tenantId))
    .orderBy(desc(publicSchema.auditLogs.createdAt))
    .limit(100);

  return c.json({ data: logs, meta: { tenant: tenant.tenantSlug } });
});

// ===== Super Admin: Tenant Management =====

/**
 * GET /api/v1/tenant/all
 * List all tenants with member counts (super admin only).
 */
app.get(
  '/all',
  authMiddleware,
  async (c, next) => {
    const auth = c.get('auth') as AuthContext;
    if (!auth.isSuperAdmin) {
      return c.json({ error: { code: 'FORBIDDEN', message: '需要超級管理員權限' } }, 403);
    }
    await next();
  },
  async (c) => {
    const allTenants = await db
      .select()
      .from(publicSchema.tenants)
      .orderBy(publicSchema.tenants.name);

    // Get member counts per tenant
    const tenantsWithCounts = await Promise.all(
      allTenants.map(async (t) => {
        const members = await db
          .select({ id: publicSchema.tenantMembers.id })
          .from(publicSchema.tenantMembers)
          .where(eq(publicSchema.tenantMembers.tenantId, t.id));
        return { ...t, memberCount: members.length };
      })
    );

    return c.json({ data: tenantsWithCounts });
  }
);

/**
 * PATCH /api/v1/tenant/:slug
 * Update tenant info (super admin only).
 */
app.patch(
  '/:slug',
  authMiddleware,
  async (c, next) => {
    const auth = c.get('auth') as AuthContext;
    if (!auth.isSuperAdmin) {
      return c.json({ error: { code: 'FORBIDDEN', message: '需要超級管理員權限' } }, 403);
    }
    await next();
  },
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).max(255).optional(),
      domain: z.string().max(255).optional(),
    })
  ),
  async (c) => {
    const slug = c.req.param('slug');
    const body = c.req.valid('json');

    const [updated] = await db
      .update(publicSchema.tenants)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(publicSchema.tenants.slug, slug))
      .returning();

    if (!updated) {
      return c.json({ error: { code: 'NOT_FOUND', message: '租戶不存在' } }, 404);
    }

    return c.json({ data: updated });
  }
);

const createTenantSchemaValidator = z.object({
  slug: z.string().regex(/^[a-z0-9_]+$/, 'Slug 只能包含小寫字母、數字和底線'),
  name: z.string().min(1).max(255),
  domain: z.string().max(255).optional(),
});

/**
 * POST /api/v1/tenants
 * Create a new tenant (super admin only).
 */
app.post(
  '/',
  authMiddleware,
  async (c, next) => {
    const auth = c.get('auth') as AuthContext;
    if (!auth.isSuperAdmin) {
      return c.json({ error: { code: 'FORBIDDEN', message: '需要超級管理員權限' } }, 403);
    }
    await next();
  },
  zValidator('json', createTenantSchemaValidator),
  async (c) => {
    const body = c.req.valid('json');
    const auth = c.get('auth');

    // Create tenant record
    const [tenant] = await db
      .insert(publicSchema.tenants)
      .values({
        slug: body.slug,
        name: body.name,
        domain: body.domain ?? null,
      })
      .returning();

    // Create tenant schema with all tables
    await createTenantSchema(body.slug);

    // Add creator as admin
    await db.insert(publicSchema.tenantMembers).values({
      tenantId: tenant.id,
      userId: auth.userId,
      role: 'admin',
    });

    return c.json({ data: tenant }, 201);
  }
);

export default app;
