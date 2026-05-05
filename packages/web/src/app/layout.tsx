import type { Metadata } from 'next';
import { BrandTokens, SiteHeader, SiteFooter, BackToTop, TopUtilityBar } from '@gov/ui';
import { PreviewBridge } from '@/components/PreviewBridge';
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
  const flags = site?.featureFlags ?? {};

  return (
    <html lang="zh-TW">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;600;700&family=Noto+Serif+TC:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <BrandTokens tokens={tokens} />
        {tokens.ga_id && <GoogleAnalytics gaId={tokens.ga_id} />}
      </head>
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'var(--color-bg)',
        }}
      >
        <a href="#main" className="gov-skip-link">
          跳至主要內容
        </a>
        {site?.homepageConfig?.sections?.topUtility !== false && (
          <TopUtilityBar
            items={
              site?.homepageConfig?.topUtility?.items ?? DEFAULT_TOP_UTILITY
            }
          />
        )}
        {/* layout 選項：
              - "megaMenu"（目前）：5 大類 + hover 滿版下拉面板，最現代
              - "twoRow"：logo 上排、滿版 nav 下排（11 項都顯示）
              - "compact"：logo + nav + utility 一排（向下相容） */}
        <SiteHeader
          siteName={siteName}
          enName={tokens.en_name}
          enOrg={tokens.en_org}
          logoUrl={tokens.logo_url}
          navItems={toNavTree(nav)}
          showMemberButton={flags.member_login === true}
          layout="megaMenu"
        />
        <main id="main" style={{ flex: 1 }}>
          {children}
        </main>
        <SiteFooter
          siteName={siteName}
          enName={tokens.en_name}
          contactInfo={{
            address: tokens.address,
            phone: tokens.phone,
            serviceHours: tokens.service_hours,
            email: tokens.email,
          }}
          linkGroups={site?.homepageConfig?.footer?.groups}
          openData={site?.homepageConfig?.footer?.openData}
        />
        <BackToTop />
        <PreviewBridge />
      </body>
    </html>
  );
}

/** 預設 utility bar 項目（依 31 個臺北市政府網站審查結果，95% 站都有此 5 項） */
const DEFAULT_TOP_UTILITY = [
  { label: '網站導覽', href: '#' },
  { label: 'English', href: '#' },
  { label: '陳情系統', href: 'https://hello.gov.taipei', openNewTab: true },
  { label: '常見問答', href: '#' },
  { label: '台北通', href: 'https://id.gov.taipei', openNewTab: true, emphasized: true },
];

/**
 * API 回的 nav 是樹（已在 server 端組好 children），這裡轉成 SiteHeader 期望的型別。
 * 只取 root 節點（parentId = null），children 用遞迴。
 */
function toNavTree(items: NavItem[]) {
  type Node = { id: string; label: string; url: string | null; openNewTab?: boolean; children?: Node[] };
  const conv = (n: NavItem): Node => ({
    id: n.id,
    label: n.label,
    url: n.url,
    openNewTab: n.openNewTab,
    children: n.children?.length ? n.children.map(conv) : undefined,
  });
  return items.map(conv);
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
