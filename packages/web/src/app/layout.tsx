import type { Metadata } from 'next';
import { BrandTokens, SiteHeader, SiteFooter } from '@gov/ui';
import { getTenantSlug } from '@/lib/tenant';
import { fetchSite, fetchNavigation, type NavItem } from '@/lib/api';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const slug = await getTenantSlug();
  const site = await fetchSite(slug);
  return {
    title: {
      default: site?.name ?? '臺北市政府',
      template: `%s | ${site?.name ?? '臺北市政府'}`,
    },
    description: site?.name ?? '臺北市政府網站',
    icons: site?.brandTokens?.favicon_url
      ? [{ url: site.brandTokens.favicon_url }]
      : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const slug = await getTenantSlug();
  const [site, nav] = await Promise.all([fetchSite(slug), fetchNavigation(slug)]);

  const siteName = site?.name ?? '臺北市政府';
  const tokens = site?.brandTokens ?? {};
  const logoUrl = tokens.logo_url;
  const gaId = tokens.ga_id;

  return (
    <html lang="zh-TW">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <BrandTokens tokens={tokens} />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </head>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <a href="#main" className="gov-skip-link">
          跳至主要內容
        </a>
        <SiteHeader siteName={siteName} logoUrl={logoUrl} navItems={flattenNav(nav)} />
        <main id="main" style={{ flex: 1, padding: '32px 0' }}>
          {children}
        </main>
        <SiteFooter
          siteName={siteName}
          contactInfo={{
            address: tokens.address,
            phone: tokens.phone,
            email: tokens.email,
          }}
        />
      </body>
    </html>
  );
}

/** Header 目前只渲染最上層；children 在 spec 後續若要做 mega-menu 再擴。 */
function flattenNav(items: NavItem[]) {
  return items.map((n) => ({
    id: n.id,
    label: n.label,
    url: n.url,
    openNewTab: n.openNewTab,
  }));
}

function GoogleAnalytics({ gaId }: { gaId: string }) {
  const safeId = gaId.replace(/[^A-Za-z0-9_-]/g, '');
  if (!safeId) return null;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${safeId}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${safeId}');`,
        }}
      />
    </>
  );
}
