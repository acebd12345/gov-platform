import Link from 'next/link';

export interface PageListItem {
  id: string;
  slug: string;
  title: string | null;
  seoDescription?: string | null;
  publishAt?: string | null;
  updatedAt?: string | null;
}

export function PageList({
  items,
  hrefPrefix,
  emptyText = '目前沒有資料。',
}: {
  items: PageListItem[];
  hrefPrefix: string;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', padding: '32px 0' }}>{emptyText}</p>
    );
  }

  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {items.map((item) => (
        <li
          key={item.id}
          style={{
            borderBottom: '1px solid var(--color-border)',
            padding: '20px 0',
          }}
        >
          <Link
            href={`${hrefPrefix.replace(/\/$/, '')}/${item.slug}`}
            style={{
              display: 'block',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <article>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-text)',
                  margin: '0 0 6px',
                }}
              >
                {item.title ?? '(未命名)'}
              </h3>
              {item.publishAt && (
                <time
                  dateTime={item.publishAt}
                  style={{ fontSize: 13, color: 'var(--color-text-muted)' }}
                >
                  {formatDate(item.publishAt)}
                </time>
              )}
              {item.seoDescription && (
                <p
                  style={{
                    margin: '8px 0 0',
                    color: 'var(--color-text-muted)',
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {item.seoDescription}
                </p>
              )}
            </article>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}
