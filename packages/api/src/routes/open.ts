import { Hono } from 'hono';
import { db, withTenantSchema, tenantSchema } from '@gov/db';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import type { TenantContext } from '../middleware/tenant.js';

type Env = { Variables: { tenant: TenantContext } };

const app = new Hono<Env>();

// ============================================================
// 公開 API — Content Delivery Endpoints
// 無需認證，僅回傳「該租戶」已發布的內容。
// 各局處用自己的 tenant slug 串接，建立自己的前台。
// 不暴露平台架構、租戶清單、或其他局處的資料。
// ============================================================

/**
 * GET /api/v1/open/site
 * 該局處的前台站台資訊（名稱、品牌色、功能旗標）。
 */
app.get('/site', async (c) => {
  const tenant = c.get('tenant');

  const data = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, tenant.tenantSlug),
  });

  if (!data) {
    return c.json({ error: { code: 'NOT_FOUND', message: '找不到站台' } }, 404);
  }

  return c.json({
    data: {
      name: data.name,
      domain: data.domain,
      brandTokens: data.brandTokens,
      featureFlags: data.featureFlags,
    },
    meta: { api: 'open/v1' },
  });
});

/**
 * GET /api/v1/open/pages
 * 列出已發布的頁面（分頁）。
 *
 * Query params:
 *   - page (int, default 1)
 *   - limit (int, default 20, max 100)
 *   - category (string, optional) — 依分類 slug 篩選
 *   - sort (string, default "publish_at:desc") — 排序
 */
app.get('/pages', async (c) => {
  const tenant = c.get('tenant');
  const pageNum = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (pageNum - 1) * limit;
  const categorySlug = c.req.query('category');

  // Latest version subquery
  const latestVersionSql = sql`${tenantSchema.pageVersions.versionNumber} = (
    SELECT MAX(version_number) FROM page_versions pv
    WHERE pv.page_id = ${tenantSchema.pages.id}
  )`;

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const baseConditions = [eq(tenantSchema.pages.status, 'published')];

    if (categorySlug) {
      const [cat] = await tx
        .select({ id: tenantSchema.categories.id })
        .from(tenantSchema.categories)
        .where(eq(tenantSchema.categories.slug, categorySlug))
        .limit(1);

      if (!cat) return { pages: [], total: 0 };

      const conditions = and(...baseConditions, eq(tenantSchema.pageCategories.categoryId, cat.id));

      const [countResult] = await tx
        .select({ count: count() })
        .from(tenantSchema.pages)
        .innerJoin(tenantSchema.pageCategories, eq(tenantSchema.pageCategories.pageId, tenantSchema.pages.id))
        .where(conditions);

      const pages = await tx
        .select({
          id: tenantSchema.pages.id,
          slug: tenantSchema.pages.slug,
          type: tenantSchema.pages.type,
          locale: tenantSchema.pages.locale,
          publishAt: tenantSchema.pages.publishAt,
          updatedAt: tenantSchema.pages.updatedAt,
          title: tenantSchema.pageVersions.title,
          seoDescription: tenantSchema.pageVersions.seoDescription,
        })
        .from(tenantSchema.pages)
        .innerJoin(tenantSchema.pageCategories, eq(tenantSchema.pageCategories.pageId, tenantSchema.pages.id))
        .leftJoin(
          tenantSchema.pageVersions,
          and(eq(tenantSchema.pageVersions.pageId, tenantSchema.pages.id), latestVersionSql)
        )
        .where(conditions)
        .orderBy(desc(tenantSchema.pages.publishAt))
        .limit(limit)
        .offset(offset);

      return { pages, total: Number(countResult?.count ?? 0) };
    }

    // Without category filter
    const where = and(...baseConditions);

    const [countResult] = await tx
      .select({ count: count() })
      .from(tenantSchema.pages)
      .where(where);

    const pages = await tx
      .select({
        id: tenantSchema.pages.id,
        slug: tenantSchema.pages.slug,
        type: tenantSchema.pages.type,
        locale: tenantSchema.pages.locale,
        publishAt: tenantSchema.pages.publishAt,
        updatedAt: tenantSchema.pages.updatedAt,
        title: tenantSchema.pageVersions.title,
        seoDescription: tenantSchema.pageVersions.seoDescription,
      })
      .from(tenantSchema.pages)
      .leftJoin(
        tenantSchema.pageVersions,
        and(eq(tenantSchema.pageVersions.pageId, tenantSchema.pages.id), latestVersionSql)
      )
      .where(where)
      .orderBy(desc(tenantSchema.pages.publishAt))
      .limit(limit)
      .offset(offset);

    return { pages, total: Number(countResult?.count ?? 0) };
  });

  return c.json({
    data: result.pages,
    meta: {
      page: pageNum,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      api: 'open/v1',
    },
  });
});

/**
 * GET /api/v1/open/pages/:slug
 * 取得單一已發布頁面的完整內容（含 body）。
 */
app.get('/pages/:slug', async (c) => {
  const tenant = c.get('tenant');
  const slugParam = c.req.param('slug');

  const latestVersionSql = sql`${tenantSchema.pageVersions.versionNumber} = (
    SELECT MAX(version_number) FROM page_versions pv
    WHERE pv.page_id = ${tenantSchema.pages.id}
  )`;

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugParam);

    const [row] = await tx
      .select({
        id: tenantSchema.pages.id,
        slug: tenantSchema.pages.slug,
        type: tenantSchema.pages.type,
        status: tenantSchema.pages.status,
        locale: tenantSchema.pages.locale,
        authorId: tenantSchema.pages.authorId,
        publishAt: tenantSchema.pages.publishAt,
        createdAt: tenantSchema.pages.createdAt,
        updatedAt: tenantSchema.pages.updatedAt,
        title: tenantSchema.pageVersions.title,
        bodyJson: tenantSchema.pageVersions.bodyJson,
        seoTitle: tenantSchema.pageVersions.seoTitle,
        seoDescription: tenantSchema.pageVersions.seoDescription,
        ogImageKey: tenantSchema.pageVersions.ogImageKey,
      })
      .from(tenantSchema.pages)
      .leftJoin(
        tenantSchema.pageVersions,
        and(eq(tenantSchema.pageVersions.pageId, tenantSchema.pages.id), latestVersionSql)
      )
      .where(
        and(
          eq(tenantSchema.pages.status, 'published'),
          isUuid
            ? eq(tenantSchema.pages.id, slugParam)
            : eq(tenantSchema.pages.slug, slugParam)
        )
      )
      .limit(1);

    if (!row) return null;

    // Get categories for this page
    const categories = await tx
      .select({
        id: tenantSchema.categories.id,
        name: tenantSchema.categories.name,
        slug: tenantSchema.categories.slug,
      })
      .from(tenantSchema.pageCategories)
      .innerJoin(
        tenantSchema.categories,
        eq(tenantSchema.categories.id, tenantSchema.pageCategories.categoryId)
      )
      .where(eq(tenantSchema.pageCategories.pageId, row.id));

    return { ...row, categories };
  });

  if (!result) {
    return c.json({ error: { code: 'NOT_FOUND', message: '頁面不存在或尚未發布' } }, 404);
  }

  return c.json({
    data: result,
    meta: { api: 'open/v1' },
  });
});

/**
 * GET /api/v1/open/categories
 * 列出所有分類（樹狀結構）。
 */
app.get('/categories', async (c) => {
  const tenant = c.get('tenant');

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    return tx
      .select()
      .from(tenantSchema.categories)
      .orderBy(tenantSchema.categories.sortOrder);
  });

  const buildTree = (parentId: string | null): any[] =>
    result
      .filter((cat) => cat.parentId === parentId)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        children: buildTree(cat.id),
      }));

  return c.json({
    data: buildTree(null),
    meta: { total: result.length, api: 'open/v1' },
  });
});

/**
 * GET /api/v1/open/navigation
 * 取得導覽列（僅顯示可見項目）。
 */
app.get('/navigation', async (c) => {
  const tenant = c.get('tenant');

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    return tx
      .select({
        id: tenantSchema.navigationItems.id,
        label: tenantSchema.navigationItems.label,
        url: tenantSchema.navigationItems.url,
        parentId: tenantSchema.navigationItems.parentId,
        sortOrder: tenantSchema.navigationItems.sortOrder,
        openNewTab: tenantSchema.navigationItems.openNewTab,
      })
      .from(tenantSchema.navigationItems)
      .where(eq(tenantSchema.navigationItems.isVisible, true))
      .orderBy(tenantSchema.navigationItems.sortOrder);
  });

  const buildTree = (parentId: string | null): any[] =>
    result
      .filter((n) => n.parentId === parentId)
      .map((n) => ({
        ...n,
        children: buildTree(n.id),
      }));

  return c.json({
    data: buildTree(null),
    meta: { api: 'open/v1' },
  });
});

/**
 * GET /api/v1/open/media
 * 列出公開媒體檔案（圖片等）。
 */
app.get('/media', async (c) => {
  const tenant = c.get('tenant');
  const pageNum = Math.max(1, parseInt(c.req.query('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20')));
  const offset = (pageNum - 1) * limit;

  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const [countResult] = await tx
      .select({ count: count() })
      .from(tenantSchema.media);

    const items = await tx
      .select({
        id: tenantSchema.media.id,
        filename: tenantSchema.media.filename,
        mimeType: tenantSchema.media.mimeType,
        fileSizeBytes: tenantSchema.media.fileSizeBytes,
        cdnUrl: tenantSchema.media.cdnUrl,
        altText: tenantSchema.media.altText,
        width: tenantSchema.media.width,
        height: tenantSchema.media.height,
        createdAt: tenantSchema.media.createdAt,
      })
      .from(tenantSchema.media)
      .orderBy(desc(tenantSchema.media.createdAt))
      .limit(limit)
      .offset(offset);

    return { items, total: Number(countResult?.count ?? 0) };
  });

  return c.json({
    data: result.items,
    meta: {
      page: pageNum,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      api: 'open/v1',
    },
  });
});

export default app;
