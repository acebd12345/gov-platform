import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { withTenantSchema, db, publicSchema, tenantSchema } from '@gov/db';
import { eq, and, desc, sql, asc, count } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { TenantContext } from '../middleware/tenant.js';
import type { AuthContext } from '../middleware/auth.js';

type Env = { Variables: { tenant: TenantContext; auth: AuthContext } };

const app = new Hono<Env>();

// ===== Public endpoints (no auth required) =====

const listQuerySchema = z.object({
  type: z.enum(['news', 'service', 'about', 'custom']).optional(),
  status: z.string().optional(),
  locale: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  all: z.coerce.boolean().optional(), // when true, return all statuses (requires auth header)
});

/**
 * GET /api/v1/content/pages
 * Page listing. Public callers only see published; with auth + all=true, see all statuses.
 */
app.get('/pages', zValidator('query', listQuerySchema), async (c) => {
  const { type, status, locale, page, limit, all } = c.req.valid('query');
  const tenant = c.get('tenant');
  const offset = (page - 1) * limit;

  // Check if caller has a valid auth token (optional)
  let isAuthenticated = false;
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    isAuthenticated = true;
  }

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const conditions: any[] = [];

    // If all=true and authenticated, show all statuses; otherwise only published
    if (all && isAuthenticated) {
      if (status) conditions.push(eq(tenantSchema.pages.status, status));
    } else {
      conditions.push(eq(tenantSchema.pages.status, 'published'));
    }

    if (type) conditions.push(eq(tenantSchema.pages.type, type));
    if (locale) conditions.push(eq(tenantSchema.pages.locale, locale));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      tx
        .select()
        .from(tenantSchema.pages)
        .leftJoin(
          tenantSchema.pageVersions,
          and(
            eq(tenantSchema.pageVersions.pageId, tenantSchema.pages.id),
            sql`${tenantSchema.pageVersions.versionNumber} = (
              SELECT MAX(version_number) FROM page_versions pv
              WHERE pv.page_id = ${tenantSchema.pages.id}
            )`
          )
        )
        .where(where)
        .orderBy(desc(tenantSchema.pages.updatedAt))
        .limit(limit)
        .offset(offset),
      tx
        .select({ count: count() })
        .from(tenantSchema.pages)
        .where(where),
    ]);

    return {
      items: rows.map((r) => ({
        ...r.pages,
        title: r.page_versions?.title ?? '',
        seoTitle: r.page_versions?.seoTitle,
        seoDescription: r.page_versions?.seoDescription,
      })),
      total: totalResult[0]?.count ?? 0,
    };
  });

  return c.json({
    data: result.items,
    meta: {
      tenant: tenant.tenantSlug,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    },
  });
});

/**
 * GET /api/v1/content/pages/:idOrSlug
 * Get a single page by ID (UUID format) or slug.
 */
app.get('/pages/:idOrSlug', async (c) => {
  const idOrSlug = c.req.param('idOrSlug');
  const tenant = c.get('tenant');

  // Detect if it's a UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const whereClause = isUuid
      ? eq(tenantSchema.pages.id, idOrSlug)
      : eq(tenantSchema.pages.slug, idOrSlug);

    const rows = await tx
      .select()
      .from(tenantSchema.pages)
      .leftJoin(
        tenantSchema.pageVersions,
        and(
          eq(tenantSchema.pageVersions.pageId, tenantSchema.pages.id),
          sql`${tenantSchema.pageVersions.versionNumber} = (
            SELECT MAX(version_number) FROM page_versions pv
            WHERE pv.page_id = ${tenantSchema.pages.id}
          )`
        )
      )
      .where(whereClause)
      .limit(1);

    return rows[0] ?? null;
  });

  if (!result) {
    return c.json({ error: { code: 'NOT_FOUND', message: '找不到該頁面' } }, 404);
  }

  return c.json({
    data: {
      ...result.pages,
      currentVersion: result.page_versions,
    },
    meta: { tenant: tenant.tenantSlug },
  });
});

/**
 * GET /api/v1/content/navigation
 * Get tenant navigation tree.
 */
app.get('/navigation', async (c) => {
  const tenant = c.get('tenant');

  const items = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    return tx
      .select()
      .from(tenantSchema.navigationItems)
      .where(eq(tenantSchema.navigationItems.isVisible, true))
      .orderBy(asc(tenantSchema.navigationItems.sortOrder));
  });

  const tree = buildTree(items);

  return c.json({
    data: tree,
    meta: { tenant: tenant.tenantSlug },
  });
});

// ===== Authenticated endpoints =====

const createPageSchema = z.object({
  slug: z.string().min(1).max(512),
  type: z.enum(['news', 'service', 'about', 'custom']),
  locale: z.string().default('zh-TW'),
  title: z.string().min(1).max(512),
  bodyJson: z.record(z.unknown()).default({}),
  seoTitle: z.string().max(512).optional(),
  seoDescription: z.string().max(512).optional(),
});

/**
 * POST /api/v1/content/pages
 * Create a new draft page (requires editor+).
 */
app.post('/pages', authMiddleware, requireRole('editor'), zValidator('json', createPageSchema), async (c) => {
  const body = c.req.valid('json');
  const tenant = c.get('tenant');
  const auth = c.get('auth');

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const [page] = await tx
      .insert(tenantSchema.pages)
      .values({
        slug: body.slug,
        type: body.type,
        status: 'draft',
        locale: body.locale,
        authorId: auth.userId,
      })
      .returning();

    const [version] = await tx
      .insert(tenantSchema.pageVersions)
      .values({
        pageId: page.id,
        versionNumber: 1,
        title: body.title,
        bodyJson: body.bodyJson,
        seoTitle: body.seoTitle ?? null,
        seoDescription: body.seoDescription ?? null,
        changeSummary: '初始建立',
        createdBy: auth.userId,
      })
      .returning();

    return { page, version };
  });

  await db.insert(publicSchema.auditLogs).values({
    tenantId: tenant.tenantId,
    actorId: auth.userId,
    action: 'create',
    resourceType: 'page',
    resourceId: result.page.id,
    afterSnapshot: result.page,
  });

  return c.json({ data: { ...result.page, currentVersion: result.version } }, 201);
});

const updatePageSchema = z.object({
  title: z.string().min(1).max(512).optional(),
  bodyJson: z.record(z.unknown()).optional(),
  seoTitle: z.string().max(512).optional(),
  seoDescription: z.string().max(512).optional(),
  changeSummary: z.string().max(255).optional(),
});

/**
 * PATCH /api/v1/content/pages/:id
 * Update a draft page (editor can only edit own drafts).
 */
app.patch('/pages/:id', authMiddleware, requireRole('editor'), zValidator('json', updatePageSchema), async (c) => {
  const pageId = c.req.param('id');
  const body = c.req.valid('json');
  const tenant = c.get('tenant');
  const auth = c.get('auth');

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const [page] = await tx
      .select()
      .from(tenantSchema.pages)
      .where(eq(tenantSchema.pages.id, pageId))
      .limit(1);

    if (!page) return { error: 'NOT_FOUND' as const };

    if (auth.role === 'editor' && page.authorId !== auth.userId) {
      return { error: 'FORBIDDEN' as const };
    }

    if (page.status !== 'draft') {
      return { error: 'NOT_DRAFT' as const };
    }

    const [latestVersion] = await tx
      .select({ maxVersion: sql<number>`COALESCE(MAX(version_number), 0)` })
      .from(tenantSchema.pageVersions)
      .where(eq(tenantSchema.pageVersions.pageId, pageId));

    const newVersionNumber = (latestVersion?.maxVersion ?? 0) + 1;

    const [currentVersion] = await tx
      .select()
      .from(tenantSchema.pageVersions)
      .where(eq(tenantSchema.pageVersions.pageId, pageId))
      .orderBy(desc(tenantSchema.pageVersions.versionNumber))
      .limit(1);

    const [version] = await tx
      .insert(tenantSchema.pageVersions)
      .values({
        pageId,
        versionNumber: newVersionNumber,
        title: body.title ?? currentVersion?.title ?? '',
        bodyJson: body.bodyJson ?? currentVersion?.bodyJson ?? {},
        seoTitle: body.seoTitle ?? currentVersion?.seoTitle ?? null,
        seoDescription: body.seoDescription ?? currentVersion?.seoDescription ?? null,
        changeSummary: body.changeSummary ?? null,
        createdBy: auth.userId,
      })
      .returning();

    await tx
      .update(tenantSchema.pages)
      .set({ updatedAt: new Date() })
      .where(eq(tenantSchema.pages.id, pageId));

    return { page, version };
  });

  if ('error' in result && result.error) {
    const errKey = result.error;
    const statusMap = { NOT_FOUND: 404, FORBIDDEN: 403, NOT_DRAFT: 400 } as const;
    const messageMap = {
      NOT_FOUND: '找不到該頁面',
      FORBIDDEN: '您只能編輯自己建立的草稿',
      NOT_DRAFT: '只能編輯草稿狀態的頁面',
    } as const;
    return c.json(
      { error: { code: errKey, message: messageMap[errKey] } },
      statusMap[errKey]
    );
  }

  return c.json({ data: { ...result.page, currentVersion: result.version } });
});

app.put('/pages/:id/submit', authMiddleware, requireRole('editor'), async (c) => {
  return await changePageStatus(c, 'draft', 'pending', '送審');
});

app.put('/pages/:id/approve', authMiddleware, requireRole('editor_in_chief'), async (c) => {
  return await changePageStatus(c, 'pending', 'approved', '核准');
});

app.put('/pages/:id/publish', authMiddleware, requireRole('editor_in_chief'), async (c) => {
  return await changePageStatus(c, 'approved', 'published', '發布');
});

app.put('/pages/:id/unpublish', authMiddleware, requireRole('editor_in_chief'), async (c) => {
  return await changePageStatus(c, 'published', 'archived', '下線');
});

app.delete('/pages/:id', authMiddleware, requireRole('editor_in_chief'), async (c) => {
  const pageId = c.req.param('id');
  const tenant = c.get('tenant');
  const auth = c.get('auth');

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const [page] = await tx
      .select()
      .from(tenantSchema.pages)
      .where(eq(tenantSchema.pages.id, pageId))
      .limit(1);

    if (!page) return { error: 'NOT_FOUND' };
    if (page.status !== 'draft') return { error: 'NOT_DRAFT' };

    await tx.delete(tenantSchema.pages).where(eq(tenantSchema.pages.id, pageId));
    return { page };
  });

  if ('error' in result) {
    if (result.error === 'NOT_FOUND')
      return c.json({ error: { code: 'NOT_FOUND', message: '找不到該頁面' } }, 404);
    return c.json({ error: { code: 'BAD_REQUEST', message: '只能刪除草稿狀態的頁面' } }, 400);
  }

  await db.insert(publicSchema.auditLogs).values({
    tenantId: tenant.tenantId,
    actorId: auth.userId,
    action: 'delete',
    resourceType: 'page',
    resourceId: pageId,
    beforeSnapshot: result.page,
  });

  return c.json({ data: { message: '已刪除' } });
});

app.get('/pages/:id/versions', authMiddleware, requireRole('editor'), async (c) => {
  const pageId = c.req.param('id');
  const tenant = c.get('tenant');

  const versions = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    return tx
      .select()
      .from(tenantSchema.pageVersions)
      .where(eq(tenantSchema.pageVersions.pageId, pageId))
      .orderBy(desc(tenantSchema.pageVersions.versionNumber));
  });

  return c.json({ data: versions, meta: { tenant: tenant.tenantSlug } });
});

/**
 * POST /api/v1/content/pages/:id/revert/:versionId
 * Revert a page back to a previous version's content.
 * Creates a NEW version that is a copy of the chosen old version, so history is preserved.
 * Page must currently be in draft status (revert before publishing).
 */
app.post(
  '/pages/:id/revert/:versionId',
  authMiddleware,
  requireRole('editor_in_chief'),
  async (c) => {
    const pageId = c.req.param('id');
    const versionId = c.req.param('versionId');
    const tenant = c.get('tenant');
    const auth = c.get('auth');

    const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
      const [page] = await tx
        .select()
        .from(tenantSchema.pages)
        .where(eq(tenantSchema.pages.id, pageId))
        .limit(1);
      if (!page) return { error: 'PAGE_NOT_FOUND' as const };

      const [oldVersion] = await tx
        .select()
        .from(tenantSchema.pageVersions)
        .where(
          and(
            eq(tenantSchema.pageVersions.id, versionId),
            eq(tenantSchema.pageVersions.pageId, pageId)
          )
        )
        .limit(1);
      if (!oldVersion) return { error: 'VERSION_NOT_FOUND' as const };

      const [latest] = await tx
        .select({ maxVersion: sql<number>`COALESCE(MAX(version_number), 0)` })
        .from(tenantSchema.pageVersions)
        .where(eq(tenantSchema.pageVersions.pageId, pageId));

      const newVersionNumber = (latest?.maxVersion ?? 0) + 1;

      const [newVersion] = await tx
        .insert(tenantSchema.pageVersions)
        .values({
          pageId,
          versionNumber: newVersionNumber,
          title: oldVersion.title,
          bodyJson: oldVersion.bodyJson,
          seoTitle: oldVersion.seoTitle,
          seoDescription: oldVersion.seoDescription,
          ogImageKey: oldVersion.ogImageKey,
          changeSummary: `回溯自版本 ${oldVersion.versionNumber}`,
          createdBy: auth.userId,
        })
        .returning();

      // Also flip page back to draft so reviewer must re-publish — safer default.
      await tx
        .update(tenantSchema.pages)
        .set({ status: 'draft', updatedAt: new Date() })
        .where(eq(tenantSchema.pages.id, pageId));

      return { page, oldVersion, newVersion };
    });

    if ('error' in result && result.error) {
      switch (result.error) {
        case 'PAGE_NOT_FOUND':
          return c.json({ error: { code: 'NOT_FOUND', message: '找不到該頁面' } }, 404);
        case 'VERSION_NOT_FOUND':
          return c.json({ error: { code: 'NOT_FOUND', message: '找不到該版本' } }, 404);
      }
    }

    await db.insert(publicSchema.auditLogs).values({
      tenantId: tenant.tenantId,
      actorId: auth.userId,
      action: 'update',
      resourceType: 'page',
      resourceId: pageId,
      beforeSnapshot: { versionNumber: result.newVersion.versionNumber - 1 },
      afterSnapshot: {
        revertedTo: result.oldVersion.versionNumber,
        newVersion: result.newVersion.versionNumber,
      },
    });

    return c.json({
      data: {
        page: { ...result.page, status: 'draft' },
        currentVersion: result.newVersion,
      },
    });
  }
);

// ===== Helper Functions =====

async function changePageStatus(c: any, fromStatus: string, toStatus: string, actionLabel: string) {
  const pageId = c.req.param('id');
  const tenant = c.get('tenant') as TenantContext;
  const auth = c.get('auth') as AuthContext;

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const [page] = await tx
      .select()
      .from(tenantSchema.pages)
      .where(eq(tenantSchema.pages.id, pageId))
      .limit(1);

    if (!page) return { error: 'NOT_FOUND' };
    if (page.status !== fromStatus)
      return { error: 'INVALID_STATUS', currentStatus: page.status };

    const updates: Record<string, unknown> = {
      status: toStatus,
      updatedAt: new Date(),
    };

    if (toStatus === 'published') {
      updates.publishAt = new Date();
      updates.reviewerId = auth.userId;
    }

    await tx
      .update(tenantSchema.pages)
      .set(updates)
      .where(eq(tenantSchema.pages.id, pageId));

    return { page: { ...page, status: toStatus } };
  });

  if ('error' in result) {
    if (result.error === 'NOT_FOUND')
      return c.json({ error: { code: 'NOT_FOUND', message: '找不到該頁面' } }, 404);
    return c.json(
      {
        error: {
          code: 'INVALID_STATUS',
          message: `無法${actionLabel}：目前狀態為 ${result.currentStatus}，需要 ${fromStatus}`,
        },
      },
      400
    );
  }

  await db.insert(publicSchema.auditLogs).values({
    tenantId: tenant.tenantId,
    actorId: auth.userId,
    action: toStatus === 'published' ? 'publish' : 'update',
    resourceType: 'page',
    resourceId: pageId,
    afterSnapshot: result.page,
  });

  return c.json({ data: result.page });
}

function buildTree(items: any[]): any[] {
  const map = new Map();
  const roots: any[] = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of items) {
    const node = map.get(item.id);
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export default app;
