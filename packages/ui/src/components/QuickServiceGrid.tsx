import type { ReactNode } from 'react';

export interface QuickServiceItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export type QuickServiceVariant = 'grid' | 'chip' | 'compact';

/** 快速服務，三種視覺：grid（2x3 方格）/ chip（圓 chip 一排）/ compact（緊湊一排小圖） */
export function QuickServiceGrid({
  items,
  variant = 'grid',
}: {
  items: QuickServiceItem[];
  variant?: QuickServiceVariant;
}) {
  if (variant === 'chip') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((s) => (
          <a
            key={s.label}
            href={s.href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--color-brand-secondary)',
              color: 'var(--color-brand-accent, var(--color-brand-primary))',
              border: '1px solid transparent',
              borderRadius: 999,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-primary)';
              (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-brand-secondary)';
              (e.currentTarget as HTMLElement).style.color =
                'var(--color-brand-accent, var(--color-brand-primary))';
            }}
          >
            <span aria-hidden style={{ display: 'inline-flex', width: 18, height: 18 }}>
              {s.icon}
            </span>
            {s.label}
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 4,
        }}
      >
        {items.map((s) => (
          <li key={s.label}>
            <a
              href={s.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                color: 'var(--color-text)',
                textDecoration: 'none',
                fontSize: 13,
                borderRadius: 6,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-alt)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              <span aria-hidden style={{ color: 'var(--color-brand-primary)', display: 'inline-flex' }}>
                {s.icon}
              </span>
              <span>{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  // grid (default)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {items.map((s) => (
        <a
          key={s.label}
          href={s.href}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'var(--color-text)',
            transition: 'border-color 0.15s, transform 0.15s',
            minHeight: 100,
          }}
        >
          <div style={{ color: 'var(--color-brand-primary)' }} aria-hidden>
            {s.icon}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-heading)' }}>
            {s.label}
          </div>
        </a>
      ))}
    </div>
  );
}
