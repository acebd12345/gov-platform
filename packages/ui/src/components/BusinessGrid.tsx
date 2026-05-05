import type { ReactNode } from 'react';

export interface BusinessItem {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

export type BusinessVariant = 'stripe' | 'minimal' | 'wide';

/**
 * 業務專區，三種視覺：
 *  - stripe（預設）：上方 brand 色彩條 + 圓底 icon + hover 上浮
 *  - minimal：極簡白卡，icon 上方無底色，文字小一些
 *  - wide：大尺寸卡，圖示左、文字右；3–4 卡 per row
 */
export function BusinessGrid({
  items,
  variant = 'stripe',
}: {
  items: BusinessItem[];
  variant?: BusinessVariant;
}) {
  if (variant === 'wide') return <WideVariant items={items} />;
  if (variant === 'minimal') return <MinimalVariant items={items} />;
  return <StripeVariant items={items} />;
}

// ===== Stripe（預設，現代化版本） =====

function StripeVariant({ items }: { items: BusinessItem[] }) {
  return (
    <div className="gov-business-grid">
      {items.map((b) => (
        <a
          key={b.title}
          href={b.href}
          className="gov-business-card"
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderTop: 'none',
            borderRadius: 'var(--radius)',
            padding: '28px 14px 20px',
            textDecoration: 'none',
            color: 'var(--color-text)',
            gap: 12,
            minHeight: 220,
            transition: 'transform 0.18s, box-shadow 0.18s',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <span
            aria-hidden
            className="gov-business-stripe"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 4,
              background: 'var(--color-brand-accent, var(--color-brand-primary))',
              transition: 'height 0.18s',
            }}
          />
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--color-brand-secondary)',
              color: 'var(--color-brand-accent, var(--color-brand-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden
          >
            {b.icon}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
            {b.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6, flex: 1, whiteSpace: 'pre-line' }}>
            {b.description}
          </div>
          <div style={{ color: 'var(--color-brand-accent, var(--color-brand-primary))', fontSize: 14, fontWeight: 600 }}>
            ›
          </div>
        </a>
      ))}
      <style>{`
        .gov-business-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
        .gov-business-card:hover .gov-business-stripe { height: 8px; }
      `}</style>
    </div>
  );
}

// ===== Minimal（極簡白卡） =====

function MinimalVariant({ items }: { items: BusinessItem[] }) {
  return (
    <div className="gov-business-grid">
      {items.map((b) => (
        <a
          key={b.title}
          href={b.href}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            background: 'transparent',
            border: 'none',
            padding: '20px 8px',
            textDecoration: 'none',
            color: 'var(--color-text)',
            gap: 10,
            minHeight: 160,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          <div
            style={{
              width: 40,
              height: 40,
              color: 'var(--color-brand-accent, var(--color-brand-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden
          >
            {b.icon}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-heading)' }}>{b.title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {b.description}
          </div>
        </a>
      ))}
    </div>
  );
}

// ===== Wide（大圖卡：圖左字右）=====

function WideVariant({ items }: { items: BusinessItem[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {items.map((b) => (
        <a
          key={b.title}
          href={b.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid var(--color-brand-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px',
            textDecoration: 'none',
            color: 'var(--color-text)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '';
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-brand-secondary)',
              color: 'var(--color-brand-accent, var(--color-brand-primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden
          >
            {b.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 4 }}>
              {b.title}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}
            >
              {b.description}
            </div>
          </div>
          <span style={{ color: 'var(--color-brand-primary)', fontSize: 18, flexShrink: 0 }}>›</span>
        </a>
      ))}
    </div>
  );
}
