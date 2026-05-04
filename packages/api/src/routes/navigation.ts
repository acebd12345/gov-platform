import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { withTenantSchema, db, publicSchema, tenantSchema } from '@gov/db';
import { eq, asc, sql } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { TenantContext } from '../middleware/tenant.js';
import type { AuthContext } from '../middleware/auth.js';

type Env = { Variables: { tenant: TenantContext; auth: AuthContext } };

const app = new Hono<Env>();

const baseSchema = z.object({
  label: z.string().min(1).max(255),
  url: z.string().max(1024).nullable().optional(),
  pageId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
  openNewTab: z.boolean().optional(),
  isVisible: z.boolean().optional(),
});

const createSchema = baseSchema.refine((d) => d.url || d.pageId, {
  message: '必須提供 url 或 pageId 其中之一',
});

const updateSchema = baseSchema.partial();

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      parentId: z.string().uuid().nullable(),
      sortOrder: z.number().int(),
    })
  ),
});

/**
 * GET /api/v1/content/navigation/admin
 * Authenticated full list (includes hidden items). Public read uses /api/v1/open/navigation.
 */
app.get('/admin', authMiddleware, requireRole('viewer'), async (c) => {
  const tenant = c.get('tenant');

  const items = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    return tx
      .select()
      .from(tenantSchema.navigationItems)
      .orderBy(asc(tenantSchema.navigationItems.sortOrder));
  });

  return c.json({ data: items, meta: { tenant: tenant.tenantSlug } });
});

/**
 * POST /api/v1/content/navigation
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
        .insert(tenantSchema.navigationItems)
        .values({
          label: body.label,
          url: body.url ?? null,
          pageId: body.pageId ?? null,
          parentId: body.parentId ?? null,
          sortOrder: body.sortOrder ?? 0,
          openNewTab: body.openNewTab ?? false,
          isVisible: body.isVisible ?? true,
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
 * PATCH /api/v1/content/navigation/:id
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
        .from(tenantSchema.navigationItems)
        .where(eq(tenantSchema.navigationItems.id, id))
        .limit(1);
      if (!before) return { error: 'NOT_FOUND' as const };

      if (body.parentId === id) return { error: 'INVALID_PARENT' as const };

      const updates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined) updates[k] = v;
      }

      const [updated] = await tx
        .update(tenantSchema.navigationItems)
        .set(updates)
        .where(eq(tenantSchema.navigationItems.id, id))
        .returning();

      return { before, updated };
    });

    if ('error' in result) {
      if (result.error === 'NOT_FOUND')
        return c.json({ error: { code: 'NOT_FOUND', message: '找不到該導覽項目' } }, 404);
      return c.json(
        { error: { code: 'BAD_REQUEST', message: '導覽項目不能將自己設為父項' } },
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
 * DELETE /api/v1/content/navigation/:id
 * Children get their parentId set to NULL (not cascade-deleted) so editors don't lose work.
 */
app.delete('/:id', authMiddleware, requireRole('editor_in_chief'), async (c) => {
  const id = c.req.param('id');
  const tenant = c.get('tenant');
  const auth = c.get('auth');

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const [before] = await tx
      .select()
      .from(tenantSchema.navigationItems)
      .where(eq(tenantSchema.navigationItems.id, id))
      .limit(1);
    if (!before) return { error: 'NOT_FOUND' as const };

    // Detach children
    await tx
      .update(tenantSchema.navigationItems)
      .set({ parentId: null })
      .where(eq(tenantSchema.navigationItems.parentId, id));

    await tx
      .delete(tenantSchema.navigationItems)
      .where(eq(tenantSchema.navigationItems.id, id));
    return { before };
  });

  if ('error' in result) {
    return c.json({ error: { code: 'NOT_FOUND', message: '找不到該導覽項目' } }, 404);
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

/**
 * PUT /api/v1/content/navigation/reorder
 * Bulk reorder — used by drag-and-drop UI.
 */
app.put(
  '/reorder',
  authMiddleware,
  requireRole('editor_in_chief'),
  zValidator('json', reorderSchema),
  async (c) => {
    const { items } = c.req.valid('json');
    const tenant = c.get('tenant');
    const auth = c.get('auth');

    await withTenantSchema(tenant.tenantSlug, async (tx) => {
      for (const item of items) {
        // Skip self-parent
        if (item.parentId === item.id) continue;
        await tx
          .update(tenantSchema.navigationItems)
          .set({ parentId: item.parentId, sortOrder: item.sortOrder })
          .where(eq(tenantSchema.navigationItems.id, item.id));
      }
    });

    await db.insert(publicSchema.auditLogs).values({
      tenantId: tenant.tenantId,
      actorId: auth.userId,
      action: 'update',
      resourceType: 'page',
      resourceId: null,
      afterSnapshot: { reorderedCount: items.length },
    });

    return c.json({ data: { message: '排序已更新', count: items.length } });
  }
);

export default app;
