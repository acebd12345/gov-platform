import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * ISR Revalidation Webhook
 *
 * 由 API（CMS）發布頁面時呼叫，用 HMAC-SHA256 驗章。
 *
 * Request:
 *   POST /api/revalidate
 *   Header: X-Signature: <hex hmac of body>
 *   Body:   { tenantSlug: string, type?: string, slug?: string, paths?: string[], tags?: string[] }
 *
 * 環境變數：REVALIDATE_SECRET（必須跟 API 端共用）
 */

export const runtime = 'nodejs';

interface RevalidatePayload {
  tenantSlug?: string;
  type?: string;
  slug?: string;
  paths?: string[];
  tags?: string[];
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured' },
      { status: 500 }
    );
  }

  const raw = await req.text();
  const sigHeader = req.headers.get('x-signature') ?? '';

  if (!verifySignature(raw, sigHeader, secret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let body: RevalidatePayload;
  try {
    body = JSON.parse(raw) as RevalidatePayload;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const revalidated = { paths: [] as string[], tags: [] as string[] };

  // 推導要刷的 paths
  const pathsToRevalidate = new Set<string>(body.paths ?? []);
  if (body.type === 'news' && body.slug) {
    pathsToRevalidate.add(`/news/${body.slug}`);
    pathsToRevalidate.add('/news');
    pathsToRevalidate.add('/');
  } else if (body.type === 'service' && body.slug) {
    pathsToRevalidate.add(`/services/${body.slug}`);
    pathsToRevalidate.add('/services');
  }

  for (const p of pathsToRevalidate) {
    revalidatePath(p);
    revalidated.paths.push(p);
  }

  // 推導要刷的 fetch tags（API client 用 tag 過的）
  const tagsToRevalidate = new Set<string>(body.tags ?? []);
  if (body.tenantSlug) {
    tagsToRevalidate.add(`pages:${body.tenantSlug}`);
    if (body.slug) tagsToRevalidate.add(`page:${body.tenantSlug}:${body.slug}`);
  }
  for (const t of tagsToRevalidate) {
    revalidateTag(t);
    revalidated.tags.push(t);
  }

  return NextResponse.json({ ok: true, revalidated, at: Date.now() });
}

function verifySignature(body: string, signatureHex: string, secret: string): boolean {
  if (!signatureHex) return false;
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(expected, 'hex');
  let b: Buffer;
  try {
    b = Buffer.from(signatureHex, 'hex');
  } catch {
    return false;
  }
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
