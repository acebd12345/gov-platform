'use client';

import { useState } from 'react';
import { NewsRow, type NewsRowItem } from '../components/NewsRow';

export interface NewsTab {
  /** Tab 顯示名稱（例：新聞稿） */
  label: string;
  /** 對應的 page type / category；前台用這個過濾 items */
  filterType?: string;
  filterCategory?: string;
  /** 「查看更多」連結 */
  moreHref?: string;
}

export interface NewsTabsProps {
  tabs: NewsTab[];
  /** 全部公告（已含 type 欄位）。前台會在 client side 依 tab 過濾。 */
  items: Array<NewsRowItem & { type?: string }>;
  hrefPrefix?: string;
}

/**
 * 多 tab 公告區。對應現行政府站常見的「新聞稿 / 本府消息 / 影音 / 活動」分頁切換。
 * 切換為 client 行為（CSS class 顯示/隱藏），不重新打 API，效能最佳。
 */
export function NewsTabs({ tabs, items, hrefPrefix = '/news' }: NewsTabsProps) {
  const [active, setActive] = useState(0);
  if (tabs.length === 0) return null;

  const tab = tabs[active] ?? tabs[0];
  const filtered = items.filter((it) => {
    if (tab.filterType && it.type !== tab.filterType) return false;
    return true;
  });

  return (
    <div>
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid var(--color-border)',
          marginBottom: 16,
        }}
      >
        {tabs.map((t, i) => {
          const selected = i === active;
          return (
            <button
              key={t.label}
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(i)}
              style={{
                padding: '10px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: selected
                  ? '2px solid var(--color-brand-primary)'
                  : '2px solid transparent',
                marginBottom: -2,
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: 15,
                fontWeight: selected ? 700 : 500,
                color: selected ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </button>
          );
        })}

        {tab.moreHref && (
          <a
            href={tab.moreHref}
            style={{
              marginLeft: 'auto',
              alignSelf: 'center',
              fontSize: 13,
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              padding: '0 4px',
            }}
          >
            查看更多 ›
          </a>
        )}
      </div>

      <NewsRow items={filtered.slice(0, 5)} hrefPrefix={hrefPrefix} />
    </div>
  );
}
