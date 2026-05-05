import {
  Container,
  HeroCarousel,
  SectionHeader,
  NewsRow,
  EventCards,
  QuickServiceGrid,
  BusinessGrid,
  ResourceMap,
  ApplicationProgress,
  AffiliatesGrid,
  SatisfactionSurvey,
  SearchHero,
  ExternalServicesGrid,
  NewsTabs,
  LiveDataPanel,
  StatsNumbers,
  AudienceSegments,
  SocialFeed,
  renderIcon,
  IconHeritage,
  IconArts,
  IconCreative,
  IconBook,
  IconFilm,
  IconExchange,
  IconSubsidy,
  IconApply,
  IconStatus,
  IconVenue,
  IconStreetArtist,
  IconMoney,
  IconChat,
} from '@gov/ui';
import { getTenantSlug } from '@/lib/tenant';
import { fetchPages, fetchSite, fetchCategories, type HomepageConfig, type HeroSlideConfig } from '@/lib/api';

export const revalidate = 300;

const NEWS_TAGS = ['活動', '補助公告', '新聞稿', '展覽'];

const DEFAULT_NEWS_TABS = [
  { label: '最新消息', moreHref: '/news' },
  { label: '新聞稿', filterType: 'news', moreHref: '/news' },
  { label: '活動訊息', filterType: 'service', moreHref: '/news' },
  { label: '徵才公告', filterType: 'about', moreHref: '/news' },
];

const DEFAULT_QUICK_SERVICES = [
  { label: '線上申辦', href: '#', icon: <IconApply /> },
  { label: '進度查詢', href: '#', icon: <IconStatus /> },
  { label: '場地租借', href: '#', icon: <IconVenue /> },
  { label: '街頭藝人登記', href: '#', icon: <IconStreetArtist /> },
  { label: '補助專區', href: '#', icon: <IconMoney /> },
  { label: '常見問答', href: '#', icon: <IconChat /> },
];

const DEFAULT_AFFILIATES = [
  { name: '中山堂', href: '#', abbr: '堂' },
  { name: '臺北市文獻館', href: '#', abbr: '獻' },
  { name: '臺北市立交響樂團', href: '#', abbr: '響' },
  { name: '臺北市立美術館', href: '#', abbr: '美' },
  { name: '臺北市立國樂團', href: '#', abbr: '國' },
  { name: '藝文推廣處', href: '#', abbr: '藝' },
];

const DEFAULT_BUSINESS = [
  { title: '文化資產', description: '古蹟、歷史建築、文化景觀\n保存與活化', href: '#', icon: <IconHeritage /> },
  { title: '藝術發展', description: '視覺藝術、表演藝術\n及藝文推廣', href: '#', icon: <IconArts /> },
  { title: '文創產業', description: '文創輔導、品牌發展\n與產業媒合', href: '#', icon: <IconCreative /> },
  { title: '圖書館與閱讀', description: '城市閱讀．推廣與\n圖書館服務', href: '#', icon: <IconBook /> },
  { title: '影視音發展', description: '影視協拍、拍片支援\n與產業發展', href: '#', icon: <IconFilm /> },
  { title: '文化交流', description: '國際交流、城市合作\n與駐村計畫', href: '#', icon: <IconExchange /> },
  { title: '補助申請', description: '藝文補助、活動補助\n線上申辦', href: '#', icon: <IconSubsidy /> },
];

const DEFAULT_HERO: HeroSlideConfig = {
  title: '文化．臺北',
  subtitle: '藝述城市的日常',
  body: '探索城市文化底蘊，感受臺北的藝文能量',
  ctaLabel: '探索更多',
  ctaHref: '/news',
};

const DEFAULT_EVENTS = {
  featured: { title: '2026 臺北電影節', dateRange: '06.01 — 06.30', venue: '臺北市中山堂、光點華山電影館' },
  items: [
    { title: '市民講座系列\n文化資產保存新思維', dateRange: '06.15', venue: '臺北市立圖書館總館' },
    { title: '當代藝術展覽\n邊界 ／ 無限', dateRange: '06.22 — 07.14', venue: '臺北當代藝術館' },
  ],
};

const isOn = (cfg: HomepageConfig, key: keyof NonNullable<HomepageConfig['sections']>) =>
  cfg.sections?.[key] !== false;

export default async function HomePage() {
  const slug = await getTenantSlug();
  const [site, news] = await Promise.all([fetchSite(slug), fetchPages(slug, { limit: 4 })]);

  const cfg: HomepageConfig = site?.homepageConfig ?? {};

  // 業務專區：勾了 businessFromCategories 就拉 categories；否則用 cfg.businessCards
  const categories = cfg.businessFromCategories ? await fetchCategories(slug) : null;
  const CATEGORY_ICONS = ['heritage', 'arts', 'creative', 'book', 'film', 'exchange', 'subsidy'];
  const businessFromCats =
    categories?.map((c, i) => ({
      title: c.name,
      description: '',
      href: `/services?category=${c.slug}`,
      icon: renderIcon(CATEGORY_ICONS[i % CATEGORY_ICONS.length]),
    })) ?? null;

  // Hero slides：優先用 heroSlides，沒有就退回單張 hero
  const heroSlides: HeroSlideConfig[] =
    cfg.heroSlides && cfg.heroSlides.length > 0
      ? cfg.heroSlides
      : cfg.hero
      ? [cfg.hero]
      : [DEFAULT_HERO];

  const affiliates = cfg.affiliates ?? DEFAULT_AFFILIATES;
  const quickServices =
    cfg.quickServices?.map((qs) => ({
      label: qs.label,
      href: qs.href,
      icon: renderIcon(qs.icon),
    })) ?? DEFAULT_QUICK_SERVICES;

  const businessCards =
    businessFromCats ??
    cfg.businessCards?.map((b) => ({
      title: b.title,
      description: b.description,
      href: b.href,
      icon: renderIcon(b.icon),
    })) ??
    DEFAULT_BUSINESS;

  const events = {
    featured: cfg.events?.featured ?? DEFAULT_EVENTS.featured,
    items: cfg.events?.items ?? DEFAULT_EVENTS.items,
  };

  // 公告 tabs：未設用內建預設 4 個（最新/新聞/活動/徵才），符合 95% 政府站慣例
  const newsTabs = cfg.newsTabs?.tabs ?? DEFAULT_NEWS_TABS;
  const newsItems = news.items.map((p, i) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    publishAt: p.publishAt,
    summary: p.seoDescription,
    type: p.type,
    tag: NEWS_TAGS[i % NEWS_TAGS.length],
  }));

  return (
    <>
      {isOn(cfg, 'hero') && heroSlides.length > 0 && (
        <HeroCarousel
          slides={heroSlides}
          intervalMs={(cfg.heroIntervalSec ?? 6) * 1000}
          variant={cfg.heroVariant}
        />
      )}

      {isOn(cfg, 'searchHero') && cfg.searchHero && (
        <SearchHero
          title={cfg.searchHero.title}
          placeholder={cfg.searchHero.placeholder}
          action={cfg.searchHero.action}
          hotKeywords={cfg.searchHero.hotKeywords}
        />
      )}

      {(isOn(cfg, 'news') || isOn(cfg, 'events') || isOn(cfg, 'quickServices')) && (
        <section style={{ padding: '48px 0' }}>
          <Container>
            <div className="gov-dashboard-row">
              {isOn(cfg, 'news') && (
                <div>
                  {newsTabs && newsTabs.length > 0 ? (
                    <NewsTabs tabs={newsTabs} items={newsItems} hrefPrefix="/news" />
                  ) : (
                    <>
                      <SectionHeader title="最新消息" moreHref="/news" />
                      <NewsRow
                        hrefPrefix="/news"
                        items={newsItems.slice(0, 4)}
                        variant={cfg.newsVariant}
                      />
                    </>
                  )}
                </div>
              )}

              {isOn(cfg, 'events') && (
                <div>
                  <SectionHeader title="活動精選" moreHref="/news" />
                  <EventCards
                    featured={events.featured}
                    items={events.items}
                    variant={cfg.events?.variant}
                  />
                </div>
              )}

              {isOn(cfg, 'quickServices') && (
                <div>
                  <SectionHeader title="快速服務" />
                  <QuickServiceGrid
                    items={quickServices.filter((q) => q.icon)}
                    variant={cfg.quickServicesVariant}
                  />
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      {isOn(cfg, 'business') && (
        <section style={{ padding: '32px 0 48px' }}>
          <Container>
            <SectionHeader title="業務專區" />
            <BusinessGrid
              items={businessCards.filter((b) => b.icon) as Parameters<typeof BusinessGrid>[0]['items']}
              variant={cfg.businessVariant}
            />
          </Container>
        </section>
      )}

      {isOn(cfg, 'externalServices') && (cfg.externalServices?.items?.length ?? 0) > 0 && (
        <ExternalServicesGrid
          title={cfg.externalServices?.title ?? '對外服務'}
          items={cfg.externalServices!.items!}
          variant={cfg.externalServices?.variant}
        />
      )}

      {(isOn(cfg, 'map') || isOn(cfg, 'progress')) && (
        <section style={{ padding: '0 0 48px' }}>
          <Container>
            <div className="gov-bottom-row">
              {isOn(cfg, 'map') && (
                <div>
                  <SectionHeader title="藝文資源地圖" moreHref="#" />
                  <ResourceMap />
                </div>
              )}
              {isOn(cfg, 'progress') && (
                <div>
                  <SectionHeader title="申辦進度查詢" moreHref="#" />
                  <ApplicationProgress
                    currentIndex={cfg.progress?.currentIndex ?? 2}
                    steps={cfg.progress?.steps?.length ? cfg.progress.steps : [
                      { label: '案件申請', date: '2024/05/10' },
                      { label: '受理審查', date: '2024/05/15' },
                      { label: '審核中', date: '2024/05/20' },
                      { label: '核定' },
                      { label: '結案' },
                    ]}
                    caseInfo={cfg.progress?.caseInfo ?? { id: 'A1130510001', title: '113 年度藝文活動補助申請' }}
                  />
                </div>
              )}
            </div>
          </Container>
        </section>
      )}

      {isOn(cfg, 'liveData') && (cfg.liveData?.metrics?.length ?? 0) > 0 && (
        <LiveDataPanel
          title={cfg.liveData?.title}
          metrics={cfg.liveData!.metrics!}
          variant={cfg.liveData?.variant}
        />
      )}

      {isOn(cfg, 'stats') && (cfg.stats?.items?.length ?? 0) > 0 && (
        <StatsNumbers
          title={cfg.stats?.title}
          variant={cfg.stats?.variant}
          items={cfg.stats!.items!}
        />
      )}

      {isOn(cfg, 'audienceSegments') && (cfg.audienceSegments?.items?.length ?? 0) > 0 && (
        <AudienceSegments
          title={cfg.audienceSegments?.title}
          items={cfg.audienceSegments!.items!}
          variant={cfg.audienceSegments?.variant}
        />
      )}

      {isOn(cfg, 'affiliates') && (
        <AffiliatesGrid items={affiliates} variant={cfg.affiliatesVariant} />
      )}

      {isOn(cfg, 'socialFeed') && (cfg.socialFeed?.items?.length ?? 0) > 0 && (
        <SocialFeed
          title={cfg.socialFeed?.title}
          items={cfg.socialFeed!.items!}
          variant={cfg.socialFeed?.variant}
        />
      )}

      {isOn(cfg, 'satisfaction') && (
        <SatisfactionSurvey
          title={cfg.satisfaction?.title}
          question={cfg.satisfaction?.question}
        />
      )}
    </>
  );
}
