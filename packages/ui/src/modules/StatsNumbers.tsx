import { Container } from '../components/Container';

export interface StatItem {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  href?: string;
}

/**
 * 統計數字 / KPI — **超大數字 + brand 色背景條 + 米色 section**。
 * 跟業務區、附屬機關等「卡片」模組視覺對比。
 */
export function StatsNumbers({
  title = '本局數據',
  items,
  variant = 'card',
}: {
  title?: string;
  items: StatItem[];
  variant?: 'card' | 'bare';
}) {
  if (items.length === 0) return null;
  const isCard = variant === 'card';
  return (
    <section
      className={isCard ? 'gov-section-tint' : ''}
      style={{
        padding: isCard ? '56px 0 60px' : '32px 0',
      }}
    >
      <Container>
        {title && (
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.5rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              margin: '0 0 28px',
              color: 'var(--color-text)',
              textAlign: isCard ? 'center' : 'left',
            }}
          >
            {title}
          </h2>
        )}

        <div className="gov-stats-grid">
          {items.map((it, idx) => {
            const inner = (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 4,
                    color: 'var(--color-brand-accent, var(--color-brand-primary))',
                    fontFamily: 'var(--font-heading)',
                    lineHeight: 1,
                    justifyContent: isCard ? 'center' : 'flex-start',
                  }}
                >
                  {it.prefix && <span style={{ fontSize: 22, fontWeight: 600 }}>{it.prefix}</span>}
                  <span
                    style={{
                      fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {it.value}
                  </span>
                  {it.suffix && (
                    <span style={{ fontSize: 22, fontWeight: 600 }}>{it.suffix}</span>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    textAlign: isCard ? 'center' : 'left',
                  }}
                >
                  {it.label}
                </div>
                {it.description && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12.5,
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.5,
                      textAlign: isCard ? 'center' : 'left',
                    }}
                  >
                    {it.description}
                  </div>
                )}
              </>
            );
            const wrapStyle: React.CSSProperties = isCard
              ? {
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }
              : {
                  padding: '4px 0 4px 16px',
                  borderLeft: '3px solid var(--color-brand-primary)',
                };
            return it.href ? (
              <a
                key={idx}
                href={it.href}
                style={{ ...wrapStyle, textDecoration: 'none', color: 'inherit' }}
              >
                {inner}
              </a>
            ) : (
              <div key={idx} style={wrapStyle}>
                {inner}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
