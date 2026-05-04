import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { withTenantSchema, db, publicSchema, tenantSchema } from '@gov/db';
import { eq, asc } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { TenantContext } from '../middleware/tenant.js';
import type { AuthContext } from '../middleware/auth.js';

type Env = { Variables: { tenant: TenantContext; auth: AuthContext } };

const app = new Hono<Env>();

const slugRegex = /^[a-z0-9][a-z0-9-]*$/;

const createSchema = z.object({
  slug: z.string().min(1).max(255).regex(slugRegex, 'Slug 只能包含小寫字母、數字、連字號'),
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

const updateSchema = createSchema.partial();

/**
 * GET /api/v1/content/categories
 * Authenticated list (admin UI). Public read goes through /api/v1/open/categories.
 */
app.get('/', authMiddleware, requireRole('viewer'), async (c) => {
  const tenant = c.get('tenant');

  const items = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    return tx
      .select()
      .from(tenantSchema.categories)
      .orderBy(asc(tenantSchema.categories.sortOrder), asc(tenantSchema.categories.name));
  });

  return c.json({ data: items, meta: { tenant: tenant.tenantSlug } });
});

/**
 * POST /api/v1/content/categories
 */
app.post(
  '/',
  authMiddleware,
  requireRole('editor_in_chief'),
  zValidator('json', createSchema),
  async (c) => {
    const body = c.req.valid('json');
    const tenant = c.get('tenant');
    const auth = c.get('auth');

    const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
      const [created] = await tx
        .insert(tenantSchema.categories)
        .values({
          slug: body.slug,
          name: body.name,
          parentId: body.parentId ?? null,
          sortOrder: body.sortOrder ?? 0,
        })
        .returning();
      return created;
    });

    await db.insert(publicSchema.auditLogs).values({
      tenantId: tenant.tenantId,
      actorId: auth.userId,
      action: 'create',
      resourceType: 'page',
      resourceId: result.id,
      afterSnapshot: result,
    });

    return c.json({ data: result }, 201);
  }
);

/**
 * PATCH /api/v1/content/categories/:id
 */
app.patch(
  '/:id',
  authMiddleware,
  requireRole('editor_in_chief'),
  zValidator('json', updateSchema),
  async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const tenant = c.get('tenant');
    const auth = c.get('auth');

    const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
      const [before] = await tx
        .select()
        .from(tenantSchema.categories)
        .where(eq(tenantSchema.categories.id, id))
        .limit(1);
      if (!before) return { error: 'NOT_FOUND' as const };

      const updates: Record<string, unknown> = {};
      if (body.slug !== undefined) updates.slug = body.slug;
      if (body.name !== undefined) updates.name = body.name;
      if (body.parentId !== undefined) updates.parentId = body.parentId;
      if (body.sortOrder !== undefined) updates.sortOrder = body.sortOrder;

      // Prevent self-parenting
      if (updates.parentId === id) return { error: 'INVALID_PARENT' as const };

      const [updated] = await tx
        .update(tenantSchema.categories)
        .set(updates)
        .where(eq(tenantSchema.categories.id, id))
        .returning();

      return { before, updated };
    });

    if ('error' in result) {
      if (result.error === 'NOT_FOUND')
        return c.json({ error: { code: 'NOT_FOUND', message: '找不到該分類' } }, 404);
      return c.json(
        { error: { code: 'BAD_REQUEST', message: '分類不能將自己設為父分類' } },
        400
      );
    }

    await db.insert(publicSchema.auditLogs).values({
      tenantId: tenant.tenantId,
      actorId: auth.userId,
      action: 'update',
      resourceType: 'page',
      resourceId: id,
      beforeSnapshot: result.before,
      afterSnapshot: result.updated,
    });

    return c.json({ data: result.updated });
  }
);

/**
 * DELETE /api/v1/content/categories/:id
 * Only deletes the category itself; page_categories rows cascade automatically.
 * Returns 409 if it has children.
 */
app.delete('/:id', authMiddleware, requireRole('editor_in_chief'), async (c) => {
  const id = c.req.param('id');
  const tenant = c.get('tenant');
  const auth = c.get('auth');

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const [before] = await tx
      .select()
      .from(tenantSchema.categories)
      .where(eq(tenantSchema.categories.id, id))
      .limit(1);
    if (!before) return { error: 'NOT_FOUND' as const };

    const children = await tx
      .select({ id: tenantSchema.categories.id })
      .from(tenantSchema.categories)
      .where(eq(tenantSchema.categories.parentId, id))
      .limit(1);
    if (children.length > 0) return { error: 'HAS_CHILDREN' as const };

    await tx.delete(tenantSchema.categories).where(eq(tenantSchema.categories.id, id));
    return { before };
  });

  if ('error' in result) {
    if (result.error === 'NOT_FOUND')
      return c.json({ error: { code: 'NOT_FOUND', message: '找不到該分類' } }, 404);
    return c.json(
      { error: { code: 'CONFLICT', message: '請先移除子分類' } },
      409
    );
  }

  await db.insert(publicSchema.auditLogs).values({
    tenantId: tenant.tenantId,
    actorId: auth.userId,
    action: 'delete',
    resourceType: 'page',
    resourceId: id,
    beforeSnapshot: result.before,
  });

  return c.json({ data: { message: '已刪除' } });
});

export default app;
