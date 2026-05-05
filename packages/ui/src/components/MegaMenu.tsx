'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

export interface MegaMenuItem {
  id: string;
  label: string;
  url: string | null;
  openNewTab?: boolean;
  children?: MegaMenuItem[];
}

/**
 * Mega Menu — hover top-level 顯示滿版下拉面板，現代化政府站慣例。
 * Hover 進入有 100ms 延遲開啟、80ms 延遲關閉，避免滑鼠快速經過誤觸發。
 */
export function MegaMenu({ items }: { items: MegaMenuItem[] }) {
  const [active, setActive] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setActive(id), 100);
  };
  const handleLeave = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 120);
  };

  return (
    <nav
      aria-label="主選單"
      className="gov-mega-menu"
      style={{ position: 'relative' }}
      onMouseLeave={handleLeave}
    >
      <ul
        style={{
          display: 'flex',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          justifyContent: 'space-around',
          gap: 0,
        }}
      >
        {items.map((item) => {
          const open = active === item.id;
          const hasChildren = !!item.children && item.children.length > 0;

          return (
            <li
              key={item.id}
              style={{ flex: '1 1 0', display: 'flex', justifyContent: 'center' }}
              onMouseEnter={() => hasChildren && handleEnter(item.id)}
            >
              <Link
                href={item.url ?? '#'}
                target={item.openNewTab ? '_blank' : undefined}
                rel={item.openNewTab ? 'noopener noreferrer' : undefined}
                aria-haspopup={hasChildren || undefined}
                aria-expanded={open || undefined}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '18px 16px',
                  fontSize: 15,
                  fontWeight: open ? 700 : 500,
                  color: open ? 'var(--color-brand-primary)' : 'var(--color-text)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.02em',
                  transition: 'color 0.15s',
                }}
              >
                {item.label}
                {hasChildren && (
                  <span aria-hidden style={{ fontSize: 10, opacity: 0.5, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▾
                  </span>
                )}
                {/* 底部高亮 underline */}
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 0,
                    width: open ? 'calc(100% - 32px)' : 0,
                    height: 3,
                    background: 'var(--color-brand-primary)',
                    transform: 'translateX(-50%)',
                    transition: 'width 0.25s ease-out',
                    borderRadius: 3,
                  }}
                />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* 滿版面板 */}
      {items.map((item) => {
        const open = active === item.id;
        const hasChildren = !!item.children && item.children.length > 0;
        if (!hasChildren) return null;
        return (
          <MegaPanel
            key={item.id}
            item={item}
            open={open}
            onMouseEnter={() => handleEnter(item.id)}
            onMouseLeave={handleLeave}
          />
        );
      })}
    </nav>
  );
}

function MegaPanel({
  item,
  open,
  onMouseEnter,
  onMouseLeave,
}: {
  item: MegaMenuItem;
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-hidden={!open}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'saturate(180%) blur(12px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: open ? '0 12px 28px rgba(0,0,0,0.08)' : 'none',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0)' : 'translateY(-8px)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.2s, transform 0.2s',
        zIndex: 1,
      }}
    >
      <div
        style={{
          maxWidth: 'min(1200px, 100%)',
          margin: '0 auto',
          padding: '32px 16px 36px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 220px) 1fr',
          gap: 40,
        }}
      >
        {/* 左：類別介紹 */}
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-brand-accent, var(--color-brand-primary))',
              marginBottom: 8,
              letterSpacing: '0.02em',
            }}
          >
            {item.label}
          </div>
          <Link
            href={item.url ?? '#'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              color: 'var(--color-brand-primary)',
              textDecoration: 'none',
            }}
          >
            查看全部 →
          </Link>
        </div>

        {/* 右：子項 grid */}
        <ul
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '4px 24px',
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {item.children!.map((c) => (
            <li key={c.id}>
              <Link
                href={c.url ?? '#'}
                target={c.openNewTab ? '_blank' : undefined}
                rel={c.openNewTab ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'block',
                  padding: '10px 0',
                  fontSize: 14,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  borderBottom: '1px solid transparent',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    'var(--color-brand-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text)';
                }}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
