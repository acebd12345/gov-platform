import Link from 'next/link';
import { Container } from './Container.js';

export interface SiteHeaderProps {
  siteName: string;
  logoUrl?: string;
  navItems?: Array<{
    id: string;
    label: string;
    url: string | null;
    openNewTab?: boolean;
    children?: SiteHeaderProps['navItems'];
  }>;
}

export function SiteHeader({ siteName, logoUrl, navItems = [] }: SiteHeaderProps) {
  return (
    <header
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <Container>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            minHeight: 64,
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textDecoration: 'none',
              color: 'var(--color-text)',
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="" style={{ height: 36 }} />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-on-brand)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                }}
              >
                {siteName.slice(0, 1)}
              </div>
            )}
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              {siteName}
            </span>
          </Link>

          <nav aria-label="主選單">
            <ul
              style={{
                display: 'flex',
                gap: 8,
                listStyle: 'none',
                margin: 0,
                padding: 0,
              }}
            >
              {navItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.url ?? '#'}
                    target={item.openNewTab ? '_blank' : undefined}
                    rel={item.openNewTab ? 'noopener noreferrer' : undefined}
                    style={{
                      display: 'inline-block',
                      padding: '8px 14px',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      textDecoration: 'none',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </header>
  );
}
