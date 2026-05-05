import { Container } from '../components/Container';

export interface LiveMetric {
  label: string;
  value: string;
  unit?: string;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
  updatedAt?: string;
  sourceHref?: string;
  icon?: string;
}

const STATUS_COLOR: Record<string, string> = {
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  neutral: '#9CA3AF',
};

export type LiveDataVariant = 'dark' | 'light';

/**
 * 即時數據面板。兩種視覺：
 *  - dark（預設）：深色 dashboard 風 + 燈號脈動 + 漸層光暈
 *  - light：淺色卡片 + 燈號 + 細邊框，融入頁面風格
 */
export function LiveDataPanel({
  title = '即時資訊',
  metrics,
  variant = 'dark',
}: {
  title?: string;
  metrics: LiveMetric[];
  variant?: LiveDataVariant;
}) {
  if (metrics.length === 0) return null;
  if (variant === 'light') return <LightVariant title={title} metrics={metrics} />;
  return <DarkVariant title={title} metrics={metrics} />;
}

// ===== 深色 dashboard =====

function DarkVariant({ title, metrics }: { title: string; metrics: LiveMetric[] }) {
  return (
    <section
      className="gov-section-dark"
      style={{ padding: '40px 0 44px', position: 'relative', overflow: 'hidden' }}
    >
      {/* 裝飾性背景圓圈 */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: -120,
          top: -120,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(184,153,104,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container>
        <header
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontSize: 11,
              color: '#9CA3AF',
              letterSpacing: '0.2em',
              fontWeight: 600,
            }}
          >
            LIVE
          </span>
          <span
            className="gov-status-pulse"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 0 4px rgba(16,185,129,0.25)',
            }}
            aria-hidden
          />
        </header>

        <div className="gov-live-grid">
          {metrics.map((m, idx) => {
            const color = STATUS_COLOR[m.status ?? 'neutral'];
            return (
              <article
                key={idx}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius)',
                  padding: '20px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  minHeight: 140,
                  position: 'relative',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                {m.status && (
                  <span
                    aria-label={`狀態：${m.status}`}
                    style={{
                      position: 'absolute',
                      top: 18,
                      right: 20,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 0 6px ${color}25`,
                    }}
                    className="gov-status-pulse"
                  />
                )}

                <div
                  style={{
                    fontSize: 12,
                    color: '#9CA3AF',
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                  }}
                >
                  {m.label}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 4,
                    fontFamily: 'var(--font-heading)',
                    color: '#FFFFFF',
                  }}
                >
                  <span style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {m.value}
                  </span>
                  {m.unit && (
                    <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>{m.unit}</span>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11,
                    color: '#9CA3AF',
                    paddingTop: 8,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {m.updatedAt && <time dateTime={m.updatedAt}>{formatTime(m.updatedAt)}</time>}
                  {m.sourceHref && (
                    <a
                      href={m.sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#FFFFFF', textDecoration: 'none', opacity: 0.8 }}
                    >
                      來源 ↗
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

// ===== 淺色版（融入頁面） =====

function LightVariant({ title, metrics }: { title: string; metrics: LiveMetric[] }) {
  return (
    <section style={{ padding: '32px 0 36px' }}>
      <Container>
        <header style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            {title}
          </h2>
          <span
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.2em',
              fontWeight: 600,
            }}
          >
            LIVE
          </span>
          <span
            className="gov-status-pulse"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 0 4px rgba(16,185,129,0.25)',
            }}
            aria-hidden
          />
        </header>

        <div className="gov-live-grid">
          {metrics.map((m, idx) => {
            const color = STATUS_COLOR[m.status ?? 'neutral'];
            return (
              <article
                key={idx}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  minHeight: 130,
                  position: 'relative',
                }}
              >
                {m.status && (
                  <span
                    aria-label={`狀態：${m.status}`}
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 0 4px ${color}22`,
                    }}
                    className="gov-status-pulse"
                  />
                )}
                <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  {m.label}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 4,
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-text)',
                  }}
                >
                  <span style={{ fontSize: 30, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {m.value}
                  </span>
                  {m.unit && (
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{m.unit}</span>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {m.updatedAt && <time dateTime={m.updatedAt}>{formatTime(m.updatedAt)}</time>}
                  {m.sourceHref && (
                    <a
                      href={m.sourceHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: 'var(--color-brand-primary)', textDecoration: 'none' }}
                    >
                      來源 ↗
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `更新 ${m}/${day} ${h}:${min}`;
  } catch {
    return iso;
  }
}
