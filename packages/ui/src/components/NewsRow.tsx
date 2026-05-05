import Link from 'next/link';

export interface NewsRowItem {
  id: string;
  slug: string;
  title: string | null;
  publishAt?: string | null;
  tag?: string;
  summary?: string | null;
}

export type NewsRowVariant = 'date-badge' | 'plain' | 'card-grid';

/** 最新消息清單，三種視覺：date-badge（預設紅日期方塊）/ plain（純條列）/ card-grid（卡片網格） */
export function NewsRow({
  items,
  hrefPrefix,
  emptyText = '目前尚無消息。',
  variant = 'date-badge',
}: {
  items: NewsRowItem[];
  hrefPrefix: string;
  emptyText?: string;
  variant?: NewsRowVariant;
}) {
  if (items.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', padding: '24px 0' }}>{emptyText}</p>
    );
  }
  if (variant === 'plain') return <PlainList items={items} hrefPrefix={hrefPrefix} />;
  if (variant === 'card-grid') return <CardGrid items={items} hrefPrefix={hrefPrefix} />;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((it, idx) => (
        <li
          key={it.id}
          style={{
            borderTop: idx === 0 ? 'none' : '1px solid var(--color-border)',
          }}
        >
          <Link
            href={`${hrefPrefix.replace(/\/$/, '')}/${it.slug}`}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              padding: '14px 0',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <DateBlock iso={it.publishAt} />
            {it.tag && <Tag label={it.tag} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {it.title ?? '(未命名)'}
              </div>
              {it.summary && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--color-text-muted)',
                    marginTop: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {it.summary}
                </div>
              )}
            </div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 18, flexShrink: 0 }}>›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ===== Plain list（純條列，無紅方塊） =====
function PlainList({ items, hrefPrefix }: { items: NewsRowItem[]; hrefPrefix: string }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((it) => (
        <li key={it.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
          <a
            href={`${hrefPrefix.replace(/\/$/, '')}/${it.slug}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '14px 0',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono, var(--font-body))',
                flexShrink: 0,
                minWidth: 84,
              }}
            >
              {formatPlainDate(it.publishAt)}
            </span>
            {it.tag && (
              <span
                style={{
                  flexShrink: 0,
                  background: 'var(--color-brand-secondary)',
                  color: 'var(--color-brand-accent, var(--color-brand-primary))',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                {it.tag}
              </span>
            )}
            <span
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {it.title ?? '(未命名)'}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function formatPlainDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

// ===== Card grid（卡片網格） =====
function CardGrid({ items, hrefPrefix }: { items: NewsRowItem[]; hrefPrefix: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
      }}
    >
      {items.map((it) => (
        <a
          key={it.id}
          href={`${hrefPrefix.replace(/\/$/, '')}/${it.slug}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 16,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--color-brand-primary)',
            textDecoration: 'none',
            color: 'inherit',
            minHeight: 140,
          }}
        >
          {it.tag && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-brand-accent, var(--color-brand-primary))',
                letterSpacing: '0.04em',
              }}
            >
              {it.tag}
            </span>
          )}
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-heading)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {it.title ?? '(未命名)'}
          </div>
          {it.summary && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                flex: 1,
              }}
            >
              {it.summary}
            </div>
          )}
          <time
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              marginTop: 'auto',
            }}
          >
            {formatPlainDate(it.publishAt)}
          </time>
        </a>
      ))}
    </div>
  );
}

function DateBlock({ iso }: { iso?: string | null }) {
  if (!iso) {
    return (
      <div style={{ width: 44, flexShrink: 0 }} aria-hidden />
    );
  }
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return (
    <div
      style={{
        width: 44,
        flexShrink: 0,
        background: 'var(--color-date-badge, #A02C2C)',
        color: 'var(--color-date-badge-text, #FFFFFF)',
        textAlign: 'center',
        padding: '6px 0',
        borderRadius: 2,
        fontFamily: 'var(--font-heading)',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{mm}</div>
      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>{dd}</div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      style={{
        flexShrink: 0,
        background: 'var(--color-tag-bg, #B89968)',
        color: 'var(--color-tag-text, #FFFFFF)',
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 2,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
