/**
 * 前台用的 server-side API client。所有呼叫都透過 Next.js fetch cache，
 * 搭配 ISR 達成「靜態頁 + 定時更新」。
 *
 * 強制帶 X-Tenant-ID header（從 server component 拿 tenantSlug 後傳入）。
 */

const API_BASE =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1';

const DEFAULT_REVALIDATE = 300; // 5 分鐘，spec 第 9 章預設值

export interface SiteInfo {
  name: string;
  domain: string | null;
  brandTokens: Record<string, string>;
  featureFlags: Record<string, boolean>;
}

export interface PageSummary {
  id: string;
  slug: string;
  type: string;
  locale: string;
  publishAt: string | null;
  updatedAt: string | null;
  title: string | null;
  seoDescription: string | null;
}

export interface PageDetail extends PageSummary {
  status: string;
  authorId: string;
  createdAt: string;
  bodyJson: unknown;
  seoTitle: string | null;
  ogImageKey: string | null;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export interface NavItem {
  id: string;
  label: string;
  url: string | null;
  parentId: string | null;
  sortOrder: number;
  openNewTab: boolean;
  children?: NavItem[];
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children: CategoryNode[];
}

interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

async function apiGet<T>(
  path: string,
  tenantSlug: string,
  opts: { revalidate?: number; tag?: string } = {}
): Promise<{ data: T; meta?: ListMeta }> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'X-Tenant-ID': tenantSlug },
    next: {
      revalidate: opts.revalidate ?? DEFAULT_REVALIDATE,
      tags: opts.tag ? [opts.tag] : undefined,
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return { data: null as T };
    }
    throw new Error(`API ${res.status} for ${path}`);
  }

  return res.json();
}

export async function fetchSite(tenantSlug: string): Promise<SiteInfo | null> {
  const out = await apiGet<SiteInfo>('/open/site', tenantSlug, {
    tag: `site:${tenantSlug}`,
  });
  return out.data ?? null;
}

export async function fetchNavigation(tenantSlug: string): Promise<NavItem[]> {
  const out = await apiGet<NavItem[]>('/open/navigation', tenantSlug, {
    tag: `nav:${tenantSlug}`,
  });
  return out.data ?? [];
}

export async function fetchCategories(tenantSlug: string): Promise<CategoryNode[]> {
  const out = await apiGet<CategoryNode[]>('/open/categories', tenantSlug, {
    tag: `cat:${tenantSlug}`,
  });
  return out.data ?? [];
}

export async function fetchPages(
  tenantSlug: string,
  params: { type?: string; category?: string; page?: number; limit?: number } = {}
): Promise<{ items: PageSummary[]; meta: ListMeta | undefined }> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const path = `/open/pages${qs.toString() ? `?${qs.toString()}` : ''}`;

  const out = await apiGet<PageSummary[]>(path, tenantSlug, {
    tag: `pages:${tenantSlug}`,
  });
  let items = out.data ?? [];
  // API 沒有 type 過濾，所以 client side filter（測試環境足夠用）
  if (params.type) items = items.filter((p) => p.type === params.type);
  return { items, meta: out.meta };
}

export async function fetchPage(
  tenantSlug: string,
  slug: string
): Promise<PageDetail | null> {
  const out = await apiGet<PageDetail>(
    `/open/pages/${encodeURIComponent(slug)}`,
    tenantSlug,
    { tag: `page:${tenantSlug}:${slug}` }
  );
  return out.data ?? null;
}
