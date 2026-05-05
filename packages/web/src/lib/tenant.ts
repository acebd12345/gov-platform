import { headers } from 'next/headers';

/**
 * 在 server component 內取得當前請求的 tenant slug。
 * 由 middleware.ts 寫入 request header。
 */
export async function getTenantSlug(): Promise<string> {
  const h = await headers();
  return h.get('x-tenant-slug') ?? 'portal';
}
