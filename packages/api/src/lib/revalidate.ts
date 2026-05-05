import { createHmac } from 'node:crypto';

/**
 * 在 CMS 發布 / 下線頁面時，通知前台 Next.js 刷新對應的 ISR 路徑。
 *
 * 環境變數：
 *   - WEB_REVALIDATE_URL：例 http://web:3002/api/revalidate（compose 內網）
 *   - REVALIDATE_SECRET：跟前台共用的 HMAC secret
 *
 * 失敗只 log，不丟例外 — 不能讓 webhook 失敗連帶把 publish 也擋掉。
 */
export async function notifyRevalidate(payload: {
  tenantSlug: string;
  type?: string;
  slug?: string;
  paths?: string[];
  tags?: string[];
}): Promise<void> {
  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!url || !secret) {
    // 沒設定就跳過（測試環境下前台可能還沒起）
    return;
  }

  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', secret).update(body).digest('hex');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body,
      // 不要讓前台慢回應卡死 publish flow
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      console.warn(`[revalidate] web returned ${res.status}: ${await res.text().catch(() => '')}`);
    }
  } catch (err) {
    console.warn('[revalidate] failed to notify web:', err);
  }
}
