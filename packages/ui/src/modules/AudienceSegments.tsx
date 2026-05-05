import { Container } from '../components/Container';
import { SectionHeader } from '../components/SectionHeader';
import { renderIcon } from '../components/iconRegistry';

export interface AudienceSegment {
  label: string;
  description?: string;
  href: string;
  icon?: string;
  abbr?: string;
}

export type AudienceVariant = 'numbered' | 'icon' | 'image';

/** 分眾導覽，三種視覺：numbered（編號前綴）/ icon（圓 icon 簡單）/ image（圖片背景） */
export function AudienceSegments({
  title = '我是…',
  items,
  variant = 'numbered',
}: {
  title?: string;
  items: AudienceSegment[];
  variant?: AudienceVariant;
}) {
  if (items.length === 0) return null;
  if (variant === 'icon') return <IconVariant title={title} items={items} />;
  if (variant === 'image') return <ImageVariant title={title} items={items} />;
  // numbered (default)
  return (
    <section style={{ padding: '40px 0 56px' }}>
      <Container>
        <SectionHeader title={title} />
        <div className="gov-audience-grid">
          {items.map((it, idx) => (
            <a
              key={it.label}
              href={it.href}
              className="gov-audience-card"
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '28px 24px 64px',
                textDecoration: 'none',
                color: 'var(--color-text)',
                minHeight: 220,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* 編號 */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 24,
                  fontSize: 56,
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-brand-secondary)',
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-brand-accent, var(--color-brand-primary))',
                  marginBottom: 16,
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {it.icon ? renderIcon(it.icon) : (it.abbr ?? it.label.slice(0, 1))}
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.02em',
                  marginBottom: 8,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {it.label}
              </div>

              {it.description && (
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  {it.description}
                </div>
              )}

              {/* 底部 hover 線 */}
              <span
                aria-hidden
                className="gov-audience-arrow"
                style={{
                  position: 'absolute',
                  left: 24,
                  bottom: 24,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-brand-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                進入
                <span style={{ transition: 'transform 0.2s' }}>→</span>
              </span>
              <span
                aria-hidden
                className="gov-audience-underline"
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: 0,
                  height: 3,
                  background: 'var(--color-brand-primary)',
                  transition: 'width 0.25s ease-out',
                }}
              />
            </a>
          ))}
        </div>

        <style>{`
          .gov-audience-card:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-md);
            border-color: var(--color-brand-primary);
          }
          .gov-audience-card:hover .gov-audience-underline { width: 100%; }
          .gov-audience-card:hover .gov-audience-arrow span { transform: translateX(4px); }
        `}</style>
      </Container>
    </section>
  );
}

// ===== Icon variant：簡單圓 icon =====
function IconVariant({ title, items }: { title: string; items: AudienceSegment[] }) {
  return (
    <section style={{ padding: '32px 0 48px' }}>
      <Container>
        <SectionHeader title={title} />
        <div className="gov-audience-grid">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                padding: '24px 16px',
                gap: 10,
                textDecoration: 'none',
                color: 'var(--color-text)',
                minHeight: 160,
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
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--color-brand-secondary)',
                  color: 'var(--color-brand-accent, var(--color-brand-primary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {it.icon ? renderIcon(it.icon) : (it.abbr ?? it.label.slice(0, 1))}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                {it.label}
              </div>
              {it.description && (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {it.description}
                </div>
              )}
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ===== Image variant：圖片背景 + 名稱 overlay =====
function ImageVariant({ title, items }: { title: string; items: AudienceSegment[] }) {
  return (
    <section style={{ padding: '40px 0 56px' }}>
      <Container>
        <SectionHeader title={title} />
        <div className="gov-audience-grid">
          {items.map((it, idx) => (
            <a
              key={it.label}
              href={it.href}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7) 100%),
                  linear-gradient(135deg, hsl(${(idx * 67) % 360},45%,55%), hsl(${(idx * 67 + 30) % 360},55%,40%))`,
                color: '#FFFFFF',
                padding: 20,
                minHeight: 200,
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.04em',
                }}
              >
                {it.label}
              </div>
              {it.description && (
                <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 6, lineHeight: 1.5 }}>
                  {it.description}
                </div>
              )}
              <span
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                進入 →
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
