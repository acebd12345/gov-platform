// ===== Tenant =====
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  brandTokens: Record<string, string>;
  featureFlags: Record<string, boolean>;
  homepageConfig: HomepageConfig;
  reviewRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Homepage Module Config =====
/**
 * 各局處在後台「首頁模組」可調整的設定。
 * 沒設定的欄位前台會 fallback 到內建預設值。
 */
export interface HomepageConfig {
  /** 各區塊開關 */
  sections?: Partial<{
    topUtility: boolean;
    hero: boolean;
    searchHero: boolean;
    news: boolean;
    events: boolean;
    quickServices: boolean;
    business: boolean;
    externalServices: boolean;
    map: boolean;
    progress: boolean;
    affiliates: boolean;
    satisfaction: boolean;
    liveData: boolean;
    stats: boolean;
    audienceSegments: boolean;
    socialFeed: boolean;
  }>;
  /** 單張 hero（向下相容；若設了 heroSlides 則此欄位被忽略） */
  hero?: HeroConfig;
  /** 多張輪播（建議使用） */
  heroSlides?: HeroConfig[];
  /** 輪播切換秒數，預設 6 */
  heroIntervalSec?: number;
  affiliates?: AffiliateConfig[];
  quickServices?: QuickServiceConfig[];
  businessCards?: BusinessCardConfig[];
  events?: EventsConfig;
  satisfaction?: SatisfactionConfig;
  footer?: FooterConfig;
  /** 最上方政府慣例 utility 列（網站導覽 / 陳情 / 台北通…） */
  topUtility?: TopUtilityConfig;
  /** 搜尋區（搜尋框 + 熱門關鍵字） */
  searchHero?: SearchHeroSettings;
  /** 對外服務大圖卡（資訊局風） */
  externalServices?: ExternalServicesSettings;
  /** 公告區多 tab */
  newsTabs?: NewsTabsSettings;
  liveData?: LiveDataSettings;
  stats?: StatsSettings;
  audienceSegments?: AudienceSettings;
  socialFeed?: SocialFeedSettings;
}

export interface LiveMetricConfig {
  label: string;
  value: string;
  unit?: string;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
  updatedAt?: string;
  sourceHref?: string;
  icon?: string;
}
export interface LiveDataSettings {
  title?: string;
  metrics?: LiveMetricConfig[];
}

export interface StatItemConfig {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  href?: string;
}
export interface StatsSettings {
  title?: string;
  variant?: 'card' | 'bare';
  items?: StatItemConfig[];
}

export interface AudienceSegmentConfig {
  label: string;
  description?: string;
  href: string;
  icon?: string;
  abbr?: string;
}
export interface AudienceSettings {
  title?: string;
  items?: AudienceSegmentConfig[];
}

export interface SocialPostConfig {
  platform: 'facebook' | 'instagram' | 'youtube' | 'threads' | 'twitter';
  href: string;
  imageUrl?: string;
  caption?: string;
  meta?: string;
}
export interface SocialFeedSettings {
  title?: string;
  items?: SocialPostConfig[];
}

export interface HeroConfig {
  title: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
}

export interface AffiliateConfig {
  name: string;
  href: string;
  abbr?: string;
  logoUrl?: string;
}

export interface QuickServiceConfig {
  label: string;
  href: string;
  icon: string;
}

export interface BusinessCardConfig {
  title: string;
  description: string;
  href: string;
  icon: string;
}

export interface EventCardConfig {
  title: string;
  dateRange: string;
  venue?: string;
  imageUrl?: string;
  href?: string;
}
export interface EventsConfig {
  featured?: EventCardConfig;
  items?: EventCardConfig[];
}

export interface SatisfactionConfig {
  title?: string;
  question?: string;
}

export interface FooterLink {
  label: string;
  href: string;
}
export interface FooterLinkGroup {
  title?: string;
  items: FooterLink[];
}
export interface FooterConfig {
  /** 多組連結欄（mockup 上是 2 組） */
  groups?: FooterLinkGroup[];
  /** 「開放資料」block；空則不顯示 */
  openData?: {
    title?: string;
    items?: FooterLink[];
    ctaLabel?: string;
    ctaHref?: string;
  };
}

export interface TopUtilityItemConfig {
  label: string;
  href: string;
  openNewTab?: boolean;
  emphasized?: boolean;
}
export interface TopUtilityConfig {
  items?: TopUtilityItemConfig[];
}

export interface SearchHeroSettings {
  title?: string;
  placeholder?: string;
  action?: string;
  hotKeywords?: string[];
}

export interface ExternalServiceConfig {
  title: string;
  description?: string;
  href: string;
  imageUrl?: string;
  badge?: string;
}
export interface ExternalServicesSettings {
  title?: string;
  items?: ExternalServiceConfig[];
}

export interface NewsTabConfig {
  label: string;
  filterType?: string;
  filterCategory?: string;
  moreHref?: string;
}
export interface NewsTabsSettings {
  tabs?: NewsTabConfig[];
}


// ===== User & Auth =====
export type Role = 'admin' | 'editor_in_chief' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  taipeiPassId: string | null;
  isSuperAdmin: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface TenantMember {
  id: string;
  tenantId: string;
  userId: string;
  role: Role;
  createdAt: Date;
}

export interface JwtPayload {
  sub: string;
  tenant_id: string;
  role: Role;
  is_super_admin: boolean;
  exp: number;
}

// ===== Content =====
export type PageType = 'news' | 'service' | 'about' | 'custom';
export type PageStatus = 'draft' | 'pending' | 'approved' | 'published' | 'archived';

export interface Page {
  id: string;
  slug: string;
  type: PageType;
  status: PageStatus;
  locale: string;
  authorId: string;
  reviewerId: string | null;
  publishAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageVersion {
  id: string;
  pageId: string;
  versionNumber: number;
  title: string;
  bodyJson: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageKey: string | null;
  changeSummary: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
}

export interface Media {
  id: string;
  filename: string;
  storageKey: string;
  cdnUrl: string | null;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  uploadedBy: string;
  createdAt: Date;
}

export interface NavigationItem {
  id: string;
  parentId: string | null;
  label: string;
  url: string | null;
  pageId: string | null;
  sortOrder: number;
  openNewTab: boolean;
  isVisible: boolean;
}

// ===== API Response =====
export interface ApiResponse<T> {
  data: T;
  meta?: {
    tenant?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ===== Audit =====
export type AuditAction = 'create' | 'update' | 'publish' | 'delete' | 'login';
export type ResourceType = 'page' | 'media' | 'tenant_config' | 'user';
