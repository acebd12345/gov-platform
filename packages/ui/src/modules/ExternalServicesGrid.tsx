import { Container } from '../components/Container';
import { SectionHeader } from '../components/SectionHeader';

export interface ExternalService {
  title: string;
  description?: string;
  href: string;
  imageUrl?: string;
  /** 簡短標籤（如 "OPEN DATA"），顯示在右上角 */
  badge?: string;
}

export type ExternalServicesVariant = 'image-card' | 'logo-grid' | 'banner';

/** 對外服務，三種視覺：image-card（圖卡 + 漸層 + badge）/ logo-grid（簡潔 logo + 名稱）/ banner（橫幅列） */
export function ExternalServicesGrid({
  title = '對外服務',
  items,
  variant = 'image-card',
}: {
  title?: string;
  items: ExternalService[];
  variant?: ExternalServicesVariant;
}) {
  if (items.length === 0) return null;
  if (variant === 'logo-grid') return <LogoGrid title={title} items={items} />;
  if (variant === 'banner') return <BannerList title={title} items={items} />;
  // image-card (default)
  return (
    <section style={{ padding: '32px 0 48px' }}>
      <Container>
        <SectionHeader title={title} />
        <div className="gov-external-grid">
          {items.map((it) => (
            <a
              key={it.title}
              href={it.href}
              target={it.href.startsWith('http') ? '_blank' : undefined}
              rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                background: it.imageUrl
                  ? `linear-gradient(180deg, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.65) 100%), url(${it.imageUrl}) center/cover no-repeat`
                  : 'linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-accent, var(--color-brand-primary)) 100%)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                minHeight: 180,
                textDecoration: 'none',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              {it.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(255,255,255,0.18)',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '4px 10px',
                    borderRadius: 4,
                  }}
                >
                  {it.badge}
                </span>
              )}
              <div
                style={{
                  marginTop: 'auto',
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '0.04em',
                    marginBottom: it.description ? 6 : 0,
                  }}
                >
                  {it.title}
                </div>
                {it.description && (
                  <div style={{ fontSize: 12.5, lineHeight: 1.6, opacity: 0.9 }}>
                    {it.description}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ===== Logo grid（簡潔，無底色） =====
function LogoGrid({ title, items }: { title: string; items: ExternalService[] }) {
  return (
    <section style={{ padding: '32px 0' }}>
      <Container>
        <SectionHeader title={title} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          {items.map((it) => (
            <a
              key={it.title}
              href={it.href}
              target={it.href.startsWith('http') ? '_blank' : undefined}
              rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '20px 12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: 'var(--color-text)',
                minHeight: 110,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
              }}
            >
              {it.imageUrl ? (
                <img src={it.imageUrl} alt="" style={{ height: 36 }} />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'var(--color-brand-primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {it.title.slice(0, 1)}
                </div>
              )}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                  textAlign: 'center',
                }}
              >
                {it.title}
              </div>
              {it.description && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
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

// ===== Banner list（橫幅列） =====
function BannerList({ title, items }: { title: string; items: ExternalService[] }) {
  return (
    <section style={{ padding: '32px 0' }}>
      <Container>
        <SectionHeader title={title} />
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {items.map((it) => (
            <li key={it.title}>
              <a
                href={it.href}
                target={it.href.startsWith('http') ? '_blank' : undefined}
                rel={it.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  background: it.imageUrl
                    ? `linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 100%), url(${it.imageUrl}) center/cover no-repeat`
                    : 'linear-gradient(90deg, var(--color-brand-primary) 0%, var(--color-brand-accent, var(--color-brand-primary)) 100%)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                  minHeight: 80,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                }}
              >
                {it.badge && (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      flexShrink: 0,
                    }}
                  >
                    {it.badge}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {it.title}
                  </div>
                  {it.description && (
                    <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{it.description}</div>
                  )}
                </div>
                <span style={{ fontSize: 20, opacity: 0.7 }}>›</span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
