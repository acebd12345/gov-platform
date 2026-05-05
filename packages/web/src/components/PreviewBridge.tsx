'use client';

import { useEffect } from 'react';

/**
 * 預覽橋接器：當 URL 帶 ?preview=1 時掛載，
 * 監聽 admin 透過 postMessage 推來的 draft（brandTokens / homepageConfig）。
 *
 * - brandTokens 直接寫進 :root CSS variables（即時換色）
 * - homepageConfig 因為大部份是 SSR 渲染的內容（卡片清單、文字…），
 *   無法純 client 重組；目前實作為「發 reload 訊號」由 admin 側按存檔重整
 *   （或之後改為 client component 化）
 *
 * 為何這樣設計：保持 SSR/ISR 為主的架構（LCP 友善），即時預覽只覆蓋
 * 「視覺 token」這層 — 其他結構性變更要存檔才會見效。
 */
export function PreviewBridge() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!new URLSearchParams(window.location.search).has('preview')) return;

    function onMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || data.type !== 'gov-preview-draft') return;
      const draft = data.draft as { brandTokens?: Record<string, string> };

      // 即時套用 brand tokens
      if (draft.brandTokens) {
        const root = document.documentElement;
        for (const [k, v] of Object.entries(draft.brandTokens)) {
          if (k.startsWith('--')) {
            root.style.setProperty(k, sanitizeValue(String(v)));
          }
        }
      }
    }

    window.addEventListener('message', onMessage);
    // 通知 parent 我準備好了，請推一次最新 draft 過來
    window.parent?.postMessage({ type: 'gov-preview-ready' }, '*');

    return () => window.removeEventListener('message', onMessage);
  }, []);

  return null;
}

function sanitizeValue(v: string): string {
  return v.replace(/[<>{};]/g, '');
}
