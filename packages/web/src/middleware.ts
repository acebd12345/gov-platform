import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge middleware：在請求進入頁面前先把「目前是哪個 tenant」算出來，
 * 以 request header 形式往下傳給 server components / route handlers。
 *
 * 識別優先序：
 *   1. ?tenant=doit  query string（dev/IP-only 測試用）
 *   2. host 子網域（doit.gov.taipei → doit；www → portal；空 → portal）
 *
 * 注意：不打 DB；只負責 host → slug 的 string 解析。實際 tenant 是否存在
 * 由下游 server component 打 API 時驗證。
 */
export function middleware(request: NextRequest) {
  const url = new URL(request.url);

  let slug = url.searchParams.get('tenant')?.trim();

  if (!slug) {
    const host = request.headers.get('host') ?? '';
    slug = resolveSlugFromHost(host);
  }

  if (!/^[a-z0-9_]+$/.test(slug)) {
    slug = 'portal';
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', slug);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function resolveSlugFromHost(host: string): string {
  const bare = host.toLowerCase().split(':')[0];

  // localhost / 127.0.0.1 / *.nip.io → fallback
  if (bare === 'localhost' || /^[\d.]+$/.test(bare) || bare.endsWith('.nip.io')) {
    return 'portal';
  }

  const m = bare.match(/^([a-z0-9_]+)\.(?:gov\.)?taipei$/);
  if (!m) return 'portal';
  return m[1] === 'www' ? 'portal' : m[1];
}

export const config = {
  // 排除 _next、靜態檔、favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
