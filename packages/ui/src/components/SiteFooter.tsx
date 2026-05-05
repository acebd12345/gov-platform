import { Container } from './Container';

export interface FooterLinkGroup {
  title?: string;
  items: Array<{ label: string; href: string }>;
}

export interface FooterOpenData {
  title?: string;
  items?: Array<{ label: string; href: string }>;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface SiteFooterProps {
  siteName: string;
  enName?: string;
  contactInfo?: {
    address?: string;
    phone?: string;
    serviceHours?: string;
    email?: string;
  };
  /** 連結組（每組可有自己的標題）。未提供 → 隱藏該組。 */
  linkGroups?: FooterLinkGroup[];
  /** 「開放資料」block；未提供則隱藏。 */
  openData?: FooterOpenData;
}

const DEFAULT_GROUPS: FooterLinkGroup[] = [
  {
    items: [
      { label: '網站導覽', href: '#' },
      { label: '隱私權宣告', href: '#' },
      { label: '資訊安全政策', href: '#' },
      { label: '政府網站資料開放宣告', href: '#' },
    ],
  },
  {
    items: [
      { label: '無障礙服務專區', href: '#' },
      { label: '意見信箱', href: '#' },
      { label: '雙語詞彙', href: '#' },
      { label: '相關連結', href: '#' },
    ],
  },
];

const DEFAULT_OPEN_DATA: FooterOpenData = {
  title: '開放資料',
  items: [
    { label: 'API 介接說明 (JSON)', href: '#' },
    { label: '資料集下載', href: '#' },
  ],
  ctaLabel: '了解更多',
  ctaHref: '#',
};

export function SiteFooter({
  siteName,
  enName,
  contactInfo,
  linkGroups = DEFAULT_GROUPS,
  openData = DEFAULT_OPEN_DATA,
}: SiteFooterProps) {
  return (
    <footer
      style={{
        background: 'var(--color-footer-bg, #1F2A26)',
        color: 'var(--color-footer-text, #D6CFC2)',
        marginTop: 'auto',
        padding: '48px 0 24px',
        fontSize: 13,
        lineHeight: 1.8,
      }}
    >
      <Container>
        <div className="gov-footer-grid">
          {/* Brand block */}
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 4,
                  background: 'var(--color-brand-accent, var(--color-brand-primary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: 24,
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  flexShrink: 0,
                }}
              >
                {siteName.slice(0, 1)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--color-footer-heading, #FFFFFF)',
                    fontFamily: 'var(--font-heading)',
                    marginBottom: 8,
                  }}
                >
                  {siteName}
                </div>
                {contactInfo?.address && <div>{contactInfo.address}</div>}
                {contactInfo?.phone && <div>服務電話：{contactInfo.phone}</div>}
                {contactInfo?.serviceHours && <div>服務時間：{contactInfo.serviceHours}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
              <SocialIcon label="Facebook" path="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              <SocialIcon label="Instagram" path="M16 2H8a6 6 0 0 0-6 6v8a6 6 0 0 0 6 6h8a6 6 0 0 0 6-6V8a6 6 0 0 0-6-6zm-4 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm5.5-1a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
              <SocialIcon label="YouTube" path="M22 8s-.2-1.4-.8-2c-.7-.8-1.6-.8-2-.9C16.3 5 12 5 12 5s-4.3 0-7.2.1c-.4.1-1.3.1-2 .9C2.2 6.6 2 8 2 8S1.8 9.6 1.8 11.3v1.4c0 1.7.2 3.3.2 3.3s.2 1.4.8 2c.7.8 1.7.8 2.1.9 1.5.1 6.4.1 6.4.1s4.3 0 7.2-.1c.4-.1 1.3-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.4C22.2 9.6 22 8 22 8z M10 14V9l5 2.5-5 2.5z" />
              <SocialIcon label="Threads" path="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm3 11.5a3.5 3.5 0 1 1-7 0c0-1.5 1-3 3-3 .5 0 1 .1 1.5.3" />
            </div>
          </div>

          {linkGroups.map((g, i) => (
            <FooterCol key={i} group={g} />
          ))}

          {openData && (
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--color-footer-heading, #FFFFFF)',
                  marginBottom: 12,
                }}
              >
                {openData.title ?? '開放資料'}
              </div>
              {(openData.items ?? []).map((it, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <a href={it.href} style={footerLink}>
                    {it.label}
                  </a>
                </div>
              ))}
              {openData.ctaLabel && (
                <a
                  href={openData.ctaHref ?? '#'}
                  style={{
                    display: 'inline-block',
                    marginTop: 10,
                    padding: '8px 24px',
                    border:
                      '1px solid var(--color-brand-accent, var(--color-brand-primary))',
                    color: 'var(--color-brand-accent, var(--color-brand-primary))',
                    borderRadius: 999,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {openData.ctaLabel}
                </a>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            marginTop: 32,
            paddingTop: 16,
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          © {new Date().getFullYear()} {siteName}. {enName ? `${enName}. ` : ''}本站符合無障礙網站規範
          (WCAG 2.1 AA)。
        </div>
      </Container>
    </footer>
  );
}

const footerLink: React.CSSProperties = {
  color: 'var(--color-footer-text, #D6CFC2)',
  textDecoration: 'none',
  fontSize: 13,
};

function FooterCol({ group }: { group: FooterLinkGroup }) {
  return (
    <div>
      {group.title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-footer-heading, #FFFFFF)',
            marginBottom: 12,
          }}
        >
          {group.title}
        </div>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {group.items.map((it) => (
          <li key={it.label} style={{ marginBottom: 6 }}>
            <a href={it.href} style={footerLink}>
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ label, path }: { label: string; path: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-footer-text, #D6CFC2)',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={path} />
      </svg>
    </a>
  );
}
