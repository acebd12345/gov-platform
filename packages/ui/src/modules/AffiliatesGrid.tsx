import { Container } from '../components/Container';
import { SectionHeader } from '../components/SectionHeader';

export interface Affiliate {
  name: string;
  href: string;
  abbr?: string;
  logoUrl?: string;
}

export type AffiliatesVariant = 'chip' | 'card' | 'list';

/**
 * 附屬機關，三種視覺：
 *  - chip（預設）：圓角藥丸 row，緊湊
 *  - card：小卡 grid（縮圖/abbr + 名稱）
 *  - list：直式列表（適合 sidebar 或長列表）
 */
export function AffiliatesGrid({
  title = '附屬機關',
  items,
  variant = 'chip',
}: {
  title?: string;
  items: Affiliate[];
  variant?: AffiliatesVariant;
}) {
  if (items.length === 0) return null;
  return (
    <section style={{ padding: '32px 0' }}>
      <Container>
        <SectionHeader title={title} />
        {variant === 'card' && <CardVariant items={items} />}
        {variant === 'list' && <ListVariant items={items} />}
        {variant !== 'card' && variant !== 'list' && <ChipVariant items={items} />}
      </Container>
    </section>
  );
}

function ChipVariant({ items }: { items: Affiliate[] }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      {items.map((it) => (
        <li key={it.name}>
          <a
            href={it.href}
            target={it.href.startsWith('http') ? '_blank' : undefined}
            rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="gov-affiliate-chip"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 999,
              color: 'var(--color-text)',
              textDecoration: 'none',
              fontSize: 14,
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              transition: 'border-color 0.15s, color 0.15s, background 0.15s',
            }}
          >
            {it.logoUrl ? (
              <img src={it.logoUrl} alt="" style={{ height: 20, width: 'auto' }} />
            ) : (
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--color-brand-secondary)',
                  color: 'var(--color-brand-accent, var(--color-brand-primary))',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {it.abbr ?? it.name.slice(0, 1)}
              </span>
            )}
            <span>{it.name}</span>
            <span aria-hidden style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 2 }}>
              ↗
            </span>
          </a>
        </li>
      ))}

      <style>{`
        .gov-affiliate-chip:hover {
          border-color: var(--color-brand-primary);
          color: var(--color-brand-primary);
          background: var(--color-brand-secondary);
        }
      `}</style>
    </ul>
  );
}

function CardVariant({ items }: { items: Affiliate[] }) {
  return (
    <div className="gov-affiliate-grid">
      {items.map((it) => (
        <a
          key={it.name}
          href={it.href}
          target={it.href.startsWith('http') ? '_blank' : undefined}
          rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '20px 12px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            color: 'var(--color-text)',
            minHeight: 120,
            transition: 'border-color 0.15s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
          }}
        >
          {it.logoUrl ? (
            <img src={it.logoUrl} alt="" style={{ height: 40 }} />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--color-brand-secondary)',
                color: 'var(--color-brand-accent, var(--color-brand-primary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
              }}
            >
              {it.abbr ?? it.name.slice(0, 1)}
            </div>
          )}
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              textAlign: 'center',
              fontFamily: 'var(--font-heading)',
              lineHeight: 1.4,
            }}
          >
            {it.name}
          </div>
        </a>
      ))}
    </div>
  );
}

function ListVariant({ items }: { items: Affiliate[] }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 0,
      }}
    >
      {items.map((it, idx) => (
        <li key={it.name} style={{ borderBottom: idx === items.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
          <a
            href={it.href}
            target={it.href.startsWith('http') ? '_blank' : undefined}
            rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 12px',
              textDecoration: 'none',
              color: 'var(--color-text)',
              fontSize: 14,
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--color-brand-secondary)',
                color: 'var(--color-brand-accent, var(--color-brand-primary))',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {it.abbr ?? it.name.slice(0, 1)}
            </span>
            <span style={{ flex: 1 }}>{it.name}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>›</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
