import { Container } from '../components/Container';

export interface TopUtilityItem {
  label: string;
  href: string;
  openNewTab?: boolean;
  /** 是否做為強調樣式（如「台北通」用 brand 色）。 */
  emphasized?: boolean;
}

/**
 * 政府網站慣例的最上方細條 utility bar：
 * 放「網站導覽 / English / 陳情系統 / 常見問答 / 台北通」這類常駐連結。
 *
 * 不同於 A11yToolbar（字級／搜尋），這條是「外部入口」性質。
 */
export function TopUtilityBar({ items }: { items: TopUtilityItem[] }) {
  if (items.length === 0) return null;
  return (
    <div
      style={{
        background: 'var(--color-bg-alt, #F8FAFB)',
        borderBottom: '1px solid var(--color-border)',
        fontSize: 12.5,
        color: 'var(--color-text-muted)',
      }}
    >
      <Container>
        <ul
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 0,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            minHeight: 32,
          }}
        >
          {items.map((it, idx) => (
            <li key={idx} style={{ display: 'flex', alignItems: 'center' }}>
              {idx > 0 && (
                <span
                  aria-hidden
                  style={{
                    width: 1,
                    height: 12,
                    background: 'var(--color-border)',
                    margin: '0 4px',
                  }}
                />
              )}
              <a
                href={it.href}
                target={it.openNewTab ? '_blank' : undefined}
                rel={it.openNewTab ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'inline-block',
                  padding: '6px 10px',
                  color: it.emphasized ? 'var(--color-brand-primary)' : 'inherit',
                  fontWeight: it.emphasized ? 600 : 400,
                  textDecoration: 'none',
                }}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
