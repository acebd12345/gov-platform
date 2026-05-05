import { Container } from './Container.js';

export function SiteFooter({
  siteName,
  contactInfo,
}: {
  siteName: string;
  contactInfo?: { address?: string; phone?: string; email?: string };
}) {
  return (
    <footer
      style={{
        background: 'var(--color-bg-alt)',
        borderTop: '1px solid var(--color-border)',
        marginTop: 'auto',
        padding: '40px 0 24px',
        color: 'var(--color-text-muted)',
        fontSize: 13,
      }}
    >
      <Container>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
            {siteName}
          </div>
          {contactInfo?.address && <div>地址：{contactInfo.address}</div>}
          {contactInfo?.phone && <div>電話：{contactInfo.phone}</div>}
          {contactInfo?.email && (
            <div>
              聯絡信箱：<a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
            </div>
          )}
          <div style={{ marginTop: 16, fontSize: 12 }}>
            © {new Date().getFullYear()} {siteName}. 本站符合無障礙網站規範 (WCAG 2.1 AA)。
          </div>
        </div>
      </Container>
    </footer>
  );
}
