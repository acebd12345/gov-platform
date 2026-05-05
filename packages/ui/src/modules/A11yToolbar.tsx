'use client';

import { useEffect, useState } from 'react';

type FontSize = 'sm' | 'md' | 'lg';
const STORAGE_KEY = 'gov-fs';

/**
 * 字級調整 + 易讀 + 語系切換 — 跟政府網站慣例一致放在 header 最上層或右上角。
 * 客戶端模組（要操作 document/localStorage）；放在 SSR header 內也 OK，hydrate 後生效。
 */
export function A11yToolbar({
  showLang = true,
  showSearch = true,
  easyReadHref = '#',
}: {
  showLang?: boolean;
  showSearch?: boolean;
  easyReadHref?: string;
}) {
  const [fs, setFs] = useState<FontSize>('md');

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as FontSize | null) ?? 'md';
    setFs(saved);
    document.documentElement.dataset.fs = saved;
  }, []);

  const setSize = (size: FontSize) => {
    setFs(size);
    document.documentElement.dataset.fs = size;
    try { localStorage.setItem(STORAGE_KEY, size); } catch {}
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
      }}
      role="toolbar"
      aria-label="輔助功能"
    >
      <span style={{ color: 'var(--color-text-muted)', marginRight: 4 }}>字級</span>
      {(['sm', 'md', 'lg'] as FontSize[]).map((s) => (
        <button
          key={s}
          onClick={() => setSize(s)}
          aria-pressed={fs === s}
          aria-label={s === 'sm' ? '小字' : s === 'md' ? '中字' : '大字'}
          style={{
            width: 26,
            height: 26,
            border: '1px solid var(--color-border)',
            background: fs === s ? 'var(--color-brand-primary)' : 'transparent',
            color: fs === s ? '#FFFFFF' : 'var(--color-text)',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: s === 'sm' ? 11 : s === 'md' ? 13 : 15,
            fontWeight: 600,
            fontFamily: 'inherit',
            lineHeight: 1,
          }}
        >
          A
        </button>
      ))}

      <span style={{ width: 1, height: 16, background: 'var(--color-border)', margin: '0 6px' }} />

      <a
        href={easyReadHref}
        style={{
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          fontSize: 12,
          padding: '4px 6px',
        }}
      >
        易讀專區
      </a>

      {showLang && (
        <button
          aria-label="切換英文"
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: 'var(--color-text)',
            marginLeft: 6,
          }}
        >
          EN
        </button>
      )}

      {showSearch && (
        <button
          aria-label="搜尋"
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--color-text)',
            marginLeft: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      )}
    </div>
  );
}
