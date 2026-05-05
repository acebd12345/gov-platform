import Link from 'next/link';
import { Container } from './Container';
import { A11yToolbar } from '../modules/A11yToolbar';
import { MegaMenu } from './MegaMenu';

export interface SiteNavItem {
  id: string;
  label: string;
  url: string | null;
  openNewTab?: boolean;
  children?: SiteNavItem[];
}

export interface SiteHeaderProps {
  siteName: string;
  enName?: string;
  enOrg?: string;
  logoUrl?: string;
  navItems?: SiteNavItem[];
  /** 是否顯示「會員專區」按鈕。預設 false（現行政府網站多數沒有登入機制） */
  showMemberButton?: boolean;
  memberButtonHref?: string;
  /**
   * 版面：
   *   - 'compact'（預設）：logo + nav + utility 同一排，nav 多時會擠（向下相容）
   *   - 'twoRow'：上排 logo + utility，下排滿版 nav
   *   - 'megaMenu'：上排 logo + utility，下排 5–6 大類；hover 滿版下拉面板（最現代）
   */
  layout?: 'compact' | 'twoRow' | 'megaMenu';
}

/**
 * 政府入口風格 header。預設 compact 版（一排），可切 twoRow（兩排）。
 *
 * twoRow 結構：
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │ [LOGO] 文化局                              字級 EN 搜尋        │ ← row 1
 *   │        DEPT. OF CULTURAL AFFAIRS                                 │
 *   ├─────────────────────────────────────────────────────────────────┤
 *   │  公告資訊  認識文化局  業務項目  …  影音專區                    │ ← row 2 滿版 nav
 *   └─────────────────────────────────────────────────────────────────┘
 */
export function SiteHeader(props: SiteHeaderProps) {
  if (props.layout === 'megaMenu') return <MegaMenuHeader {...props} />;
  if (props.layout === 'twoRow') return <TwoRowHeader {...props} />;
  return <CompactHeader {...props} />;
}

// ===== Mega Menu version（最現代化） =====

function MegaMenuHeader({
  siteName,
  enName,
  enOrg,
  logoUrl,
  navItems = [],
  showMemberButton = false,
  memberButtonHref = '#',
}: SiteHeaderProps) {
  return (
    <header
      className="gov-header gov-header-mega"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(8px)',
        WebkitBackdropFilter: 'saturate(180%) blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Row 1: Brand + utility */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Container>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              minHeight: 76,
              padding: '10px 0',
            }}
          >
            <BrandLink siteName={siteName} enName={enName} enOrg={enOrg} logoUrl={logoUrl} />
            <UtilityArea showMemberButton={showMemberButton} memberButtonHref={memberButtonHref} />
          </div>
        </Container>
      </div>

      {/* Row 2: Mega menu */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Container>
          <MegaMenu items={navItems} />
        </Container>
      </div>
    </header>
  );
}

// ===== Compact (原本的版本) =====

function CompactHeader({
  siteName,
  enName,
  enOrg,
  logoUrl,
  navItems = [],
  showMemberButton = false,
  memberButtonHref = '#',
}: SiteHeaderProps) {
  return (
    <header
      className="gov-header"
      style={{
        background: 'var(--color-bg, #FFFFFF)',
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
            minHeight: 88,
            padding: '12px 0',
          }}
        >
          <BrandLink siteName={siteName} enName={enName} enOrg={enOrg} logoUrl={logoUrl} />

          <nav aria-label="主選單" className="gov-header-nav" style={{ flex: 1 }}>
            <ul
              style={{
                display: 'flex',
                gap: 0,
                listStyle: 'none',
                margin: 0,
                padding: 0,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {navItems.map((item) => (
                <NavItemWithChildren key={item.id} item={item} />
              ))}
            </ul>
          </nav>

          <UtilityArea showMemberButton={showMemberButton} memberButtonHref={memberButtonHref} />
        </div>
      </Container>
    </header>
  );
}

// ===== Two-row（logo+utility 上排、nav 滿版下排） =====

function TwoRowHeader({
  siteName,
  enName,
  enOrg,
  logoUrl,
  navItems = [],
  showMemberButton = false,
  memberButtonHref = '#',
}: SiteHeaderProps) {
  return (
    <header
      className="gov-header gov-header-two-row"
      style={{
        background: 'var(--color-bg, #FFFFFF)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Row 1: Logo + utility */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Container>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              minHeight: 80,
              padding: '12px 0',
            }}
          >
            <BrandLink siteName={siteName} enName={enName} enOrg={enOrg} logoUrl={logoUrl} />
            <UtilityArea showMemberButton={showMemberButton} memberButtonHref={memberButtonHref} />
          </div>
        </Container>
      </div>

      {/* Row 2: Full-width nav */}
      <div style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Container>
          <nav aria-label="主選單" className="gov-header-nav">
            <ul
              style={{
                display: 'flex',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                justifyContent: 'space-around',
                gap: 0,
              }}
            >
              {navItems.map((item) => (
                <NavItemWithChildren key={item.id} item={item} fullWidth />
              ))}
            </ul>
          </nav>
        </Container>
      </div>
    </header>
  );
}

// ===== 共用片段 =====

function BrandLink({
  siteName,
  enName,
  enOrg,
  logoUrl,
}: {
  siteName: string;
  enName?: string;
  enOrg?: string;
  logoUrl?: string;
}) {
  return (
    <Link
      href="/"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textDecoration: 'none',
        color: 'var(--color-text)',
        flexShrink: 0,
      }}
    >
      {logoUrl ? <img src={logoUrl} alt="" style={{ height: 56 }} /> : <BrandMark siteName={siteName} />}
      <div style={{ lineHeight: 1.15 }}>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-brand-accent, var(--color-brand-primary))',
            letterSpacing: '0.02em',
          }}
        >
          {siteName}
        </div>
        {enName && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.12em',
              marginTop: 2,
            }}
          >
            {enName}
          </div>
        )}
        {enOrg && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.12em',
            }}
          >
            {enOrg}
          </div>
        )}
      </div>
    </Link>
  );
}

function UtilityArea({
  showMemberButton,
  memberButtonHref,
}: {
  showMemberButton?: boolean;
  memberButtonHref?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      <A11yToolbar />
      {showMemberButton && (
        <a
          href={memberButtonHref}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: 'var(--color-brand-primary)',
            color: 'var(--color-text-on-brand)',
            border: 'none',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            fontFamily: 'inherit',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          會員專區
        </a>
      )}
    </div>
  );
}

/** 主選單單一項：有 children 時 hover 顯示下拉。純 CSS 控制（:focus-within / :hover），不用 JS。 */
function NavItemWithChildren({ item, fullWidth = false }: { item: SiteNavItem; fullWidth?: boolean }) {
  const hasChildren = !!item.children && item.children.length > 0;

  return (
    <li
      className="gov-nav-item"
      style={{
        position: 'relative',
        flex: fullWidth ? '1 1 0' : undefined,
        display: fullWidth ? 'flex' : undefined,
        justifyContent: 'center',
      }}
    >
      <Link
        href={item.url ?? '#'}
        target={item.openNewTab ? '_blank' : undefined}
        rel={item.openNewTab ? 'noopener noreferrer' : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: fullWidth ? '14px 8px' : '10px 12px',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--color-text)',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          width: fullWidth ? '100%' : undefined,
        }}
        aria-haspopup={hasChildren || undefined}
      >
        {item.label}
        {hasChildren && <span aria-hidden style={{ fontSize: 9, opacity: 0.6 }}>▾</span>}
      </Link>

      {hasChildren && (
        <ul
          className="gov-nav-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 180,
            listStyle: 'none',
            margin: 0,
            padding: '6px 0',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {item.children!.map((c) => (
            <li key={c.id}>
              <Link
                href={c.url ?? '#'}
                target={c.openNewTab ? '_blank' : undefined}
                rel={c.openNewTab ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'block',
                  padding: '8px 16px',
                  fontSize: 13,
                  color: 'var(--color-text)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function BrandMark({ siteName }: { siteName: string }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 4,
        background: 'var(--color-brand-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-on-brand)',
        fontSize: 24,
        fontWeight: 700,
        fontFamily: 'var(--font-heading)',
        flexShrink: 0,
      }}
    >
      {siteName.slice(0, 1)}
    </div>
  );
}
