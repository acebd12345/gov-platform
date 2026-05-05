'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { PreviewPane } from '@/components/PreviewPane';
import { SortableList, DragHandle } from '@/components/SortableList';
import { MediaUrlInput } from '@/components/MediaUrlInput';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPut } from '@/lib/api';

// ===== Types (mirror @gov/shared HomepageConfig) =====

interface HeroConfig {
  title: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  imageUrlMobile?: string;
}
interface AffiliateRow {
  name: string;
  href: string;
  abbr?: string;
}
interface QuickServiceRow {
  label: string;
  href: string;
  icon: string;
}
interface BusinessCard {
  title: string;
  description: string;
  href: string;
  icon: string;
}
interface EventCard {
  title: string;
  dateRange: string;
  venue?: string;
  imageUrl?: string;
  href?: string;
}
interface FooterLink {
  label: string;
  href: string;
}
interface FooterGroup {
  title?: string;
  items: FooterLink[];
}
interface TopUtilityItem {
  label: string;
  href: string;
  openNewTab?: boolean;
  emphasized?: boolean;
}
interface ExternalService {
  title: string;
  description?: string;
  href: string;
  imageUrl?: string;
  badge?: string;
}
interface NewsTabConfig {
  label: string;
  filterType?: string;
  moreHref?: string;
}
interface LiveMetric {
  label: string;
  value: string;
  unit?: string;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
  updatedAt?: string;
  sourceHref?: string;
}
interface StatItem {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  href?: string;
}
interface AudienceSegment {
  label: string;
  description?: string;
  href: string;
  abbr?: string;
}
interface SocialPost {
  platform: 'facebook' | 'instagram' | 'youtube' | 'threads' | 'twitter';
  href: string;
  imageUrl?: string;
  caption?: string;
  meta?: string;
}
interface SectionToggles {
  topUtility?: boolean;
  hero?: boolean;
  searchHero?: boolean;
  news?: boolean;
  events?: boolean;
  quickServices?: boolean;
  business?: boolean;
  externalServices?: boolean;
  map?: boolean;
  progress?: boolean;
  affiliates?: boolean;
  satisfaction?: boolean;
  liveData?: boolean;
  stats?: boolean;
  audienceSegments?: boolean;
  socialFeed?: boolean;
}
interface HomepageConfig {
  sections?: SectionToggles;
  hero?: HeroConfig;
  heroSlides?: HeroConfig[];
  heroIntervalSec?: number;
  heroVariant?: 'carousel' | 'split' | 'minimal';
  affiliates?: AffiliateRow[];
  affiliatesVariant?: 'chip' | 'card' | 'list';
  quickServices?: QuickServiceRow[];
  quickServicesVariant?: 'grid' | 'chip' | 'compact';
  businessCards?: BusinessCard[];
  businessVariant?: 'stripe' | 'minimal' | 'wide';
  newsVariant?: 'date-badge' | 'plain' | 'card-grid';
  events?: { featured?: EventCard; items?: EventCard[]; variant?: 'featured' | 'equal' | 'timeline' };
  satisfaction?: { title?: string; question?: string };
  footer?: {
    groups?: FooterGroup[];
    openData?: { title?: string; items?: FooterLink[]; ctaLabel?: string; ctaHref?: string };
  };
  topUtility?: { items?: TopUtilityItem[] };
  searchHero?: { title?: string; placeholder?: string; action?: string; hotKeywords?: string[] };
  externalServices?: { title?: string; variant?: 'image-card' | 'logo-grid' | 'banner'; items?: ExternalService[] };
  newsTabs?: { tabs?: NewsTabConfig[] };
  liveData?: { title?: string; variant?: 'dark' | 'light'; metrics?: LiveMetric[] };
  stats?: { title?: string; variant?: 'card' | 'bare'; items?: StatItem[] };
  audienceSegments?: { title?: string; variant?: 'numbered' | 'icon' | 'image'; items?: AudienceSegment[] };
  socialFeed?: { title?: string; variant?: 'card' | 'masonry' | 'list'; items?: SocialPost[] };
  businessFromCategories?: boolean;
  progress?: {
    steps?: Array<{ label: string; date?: string }>;
    currentIndex?: number;
    caseInfo?: { id: string; title: string };
  };
}

// ===== Constants =====

const QUICK_SERVICE_ICONS = [
  { value: 'apply', label: '線上申辦' },
  { value: 'status', label: '進度查詢' },
  { value: 'venue', label: '場地租借' },
  { value: 'street-artist', label: '街頭藝人' },
  { value: 'money', label: '補助' },
  { value: 'chat', label: '常見問答' },
];

const BUSINESS_ICONS = [
  { value: 'heritage', label: '建築（文化資產）' },
  { value: 'arts', label: '調色盤（藝術）' },
  { value: 'creative', label: '禮物（文創）' },
  { value: 'book', label: '書本（圖書）' },
  { value: 'film', label: '影片（影視）' },
  { value: 'exchange', label: '地球（交流）' },
  { value: 'subsidy', label: '補助金' },
];

const SECTION_LIST: Array<{ key: keyof SectionToggles; label: string }> = [
  { key: 'topUtility', label: '頂部 Utility 列' },
  { key: 'hero', label: 'Hero 主視覺' },
  { key: 'searchHero', label: '搜尋區（含熱門關鍵字）' },
  { key: 'news', label: '最新消息' },
  { key: 'events', label: '活動精選' },
  { key: 'quickServices', label: '快速服務' },
  { key: 'business', label: '業務專區' },
  { key: 'externalServices', label: '對外服務（大圖卡）' },
  { key: 'map', label: '資源地圖' },
  { key: 'progress', label: '申辦進度查詢' },
  { key: 'liveData', label: '即時數據面板' },
  { key: 'stats', label: '統計數字' },
  { key: 'audienceSegments', label: '分眾導覽' },
  { key: 'affiliates', label: '附屬機關' },
  { key: 'socialFeed', label: '社群動態牆' },
  { key: 'satisfaction', label: '滿意度調查' },
];

// ===== 版面模板（一鍵套整套 variants）=====
// 跟 settings 的色票主題正交：色票管「顏色」，版面模板管「形狀／layout」。

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  /** 該模板套用的 variants 與 sections 開關（其他不動，保留現有設定） */
  apply: Partial<HomepageConfig>;
}

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'modern-news',
    name: '資訊型',
    description: '輪播 hero + 公告 tabs + 業務條紋 + chip 附屬。資訊密度高、適合公告為主的局處',
    apply: {
      heroVariant: 'carousel',
      newsVariant: 'date-badge',
      quickServicesVariant: 'grid',
      businessVariant: 'stripe',
      affiliatesVariant: 'chip',
      events: { variant: 'featured' },
      externalServices: { variant: 'image-card' },
      audienceSegments: { variant: 'numbered' },
      socialFeed: { variant: 'card' },
      liveData: { variant: 'dark' },
      stats: { variant: 'card' },
    },
  },
  {
    id: 'storytelling',
    name: '故事型',
    description: '純文字 hero + 卡片網格新聞 + 寬卡業務 + 圖片背景分眾。重視覺敘事',
    apply: {
      heroVariant: 'minimal',
      newsVariant: 'card-grid',
      quickServicesVariant: 'chip',
      businessVariant: 'wide',
      affiliatesVariant: 'card',
      events: { variant: 'equal' },
      externalServices: { variant: 'banner' },
      audienceSegments: { variant: 'image' },
      socialFeed: { variant: 'masonry' },
      liveData: { variant: 'light' },
      stats: { variant: 'card' },
    },
  },
  {
    id: 'list-dense',
    name: '條列型',
    description: '圖文左右 hero + 純條列新聞 + 極簡業務 + 列表附屬。文字為主、檢索為導向',
    apply: {
      heroVariant: 'split',
      newsVariant: 'plain',
      quickServicesVariant: 'compact',
      businessVariant: 'minimal',
      affiliatesVariant: 'list',
      events: { variant: 'timeline' },
      externalServices: { variant: 'logo-grid' },
      audienceSegments: { variant: 'icon' },
      socialFeed: { variant: 'list' },
      liveData: { variant: 'light' },
      stats: { variant: 'bare' },
    },
  },
  {
    id: 'showcase',
    name: '展演型',
    description: '輪播 hero + 卡片新聞 + 條紋業務 + 圖片分眾 + Masonry 社群。視覺豐富、適合文化/觀光類',
    apply: {
      heroVariant: 'carousel',
      newsVariant: 'card-grid',
      quickServicesVariant: 'grid',
      businessVariant: 'stripe',
      affiliatesVariant: 'card',
      events: { variant: 'featured' },
      externalServices: { variant: 'image-card' },
      audienceSegments: { variant: 'image' },
      socialFeed: { variant: 'masonry' },
      liveData: { variant: 'dark' },
      stats: { variant: 'card' },
    },
  },
];

// ===== Page =====

export default function ModulesPage() {
  const { tenant } = useAuth();
  const [config, setConfig] = useState<HomepageConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const res = await apiGet<{ data: { homepageConfig?: HomepageConfig } }>('/tenant/config', {
        tenant,
      });
      const cfg = res.data.homepageConfig ?? {};
      // 把舊的單張 hero 自動升級成 heroSlides[0]
      if (cfg.hero && !cfg.heroSlides) {
        cfg.heroSlides = [cfg.hero];
      }
      setConfig(cfg);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      // 儲存時 hero 留 heroSlides[0] 做向下相容
      const toSave: HomepageConfig = {
        ...config,
        hero: config.heroSlides?.[0] ?? config.hero,
      };
      await apiPut('/tenant/config', { homepageConfig: toSave }, { tenant });
      setSaved(true);
      setPreviewKey((k) => k + 1);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Generic patcher
  const patch = (p: Partial<HomepageConfig>) => setConfig((c) => ({ ...c, ...p }));

  function applyLayoutTemplate(tpl: LayoutTemplate) {
    setConfig((c) => {
      // 深合併：events / externalServices / audienceSegments / socialFeed / liveData / stats 是物件型
      // 不能單純 spread 覆蓋整個 events，否則會洗掉 featured / items
      const next: HomepageConfig = { ...c };
      for (const [k, v] of Object.entries(tpl.apply) as Array<[keyof HomepageConfig, any]>) {
        if (v && typeof v === 'object' && !Array.isArray(v) && (next as any)[k]) {
          (next as any)[k] = { ...(next as any)[k], ...v };
        } else {
          (next as any)[k] = v;
        }
      }
      return next;
    });
  }
  function detectActiveTemplate(): string | null {
    for (const t of LAYOUT_TEMPLATES) {
      const allMatch = Object.entries(t.apply).every(([k, v]) => {
        const cur = (config as any)[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          return Object.entries(v as object).every(([ik, iv]) => cur?.[ik] === iv);
        }
        return cur === v;
      });
      if (allMatch) return t.id;
    }
    return null;
  }
  const activeTemplateId = detectActiveTemplate();
  const setSection = (key: keyof SectionToggles, value: boolean) =>
    setConfig((c) => ({ ...c, sections: { ...(c.sections ?? {}), [key]: value } }));

  if (loading) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main data-gov-main style={s.main}>
          <div style={s.loading}>載入中...</div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main data-gov-main style={s.main}>
        <header style={s.header}>
          <div>
            <h1 style={s.title}>首頁模組</h1>
            <p style={s.subtitle}>管理前台首頁所有區塊：開關、Hero 輪播、活動、業務、頁尾連結等</p>
          </div>
          <button onClick={save} disabled={saving} style={s.saveBtn}>
            {saving ? '儲存中…' : saved ? '✓ 已儲存' : '儲存設定'}
          </button>
        </header>

        {/* 版面模板 — 一鍵套整套 variants */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>版面模板</h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '-6px 0 12px' }}>
            一鍵套整套 layout（hero / 業務 / 新聞 / 附屬…的視覺風格組合）。色票在「版型設定」頁，這裡管形狀。
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            {LAYOUT_TEMPLATES.map((t) => {
              const active = activeTemplateId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => applyLayoutTemplate(t)}
                  style={{
                    background: 'white',
                    border: active ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    padding: 14,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    position: 'relative',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {t.description}
                  </div>
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'var(--color-brand)',
                        color: 'white',
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontWeight: 600,
                      }}
                    >
                      ✓ 已套用
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 區塊開關 */}
        <Section title="顯示／隱藏區塊">
          <div style={s.toggleGrid}>
            {SECTION_LIST.map(({ key, label }) => {
              const enabled = config.sections?.[key] !== false;
              return (
                <label key={key} style={s.toggleRow}>
                  <span style={{ flex: 1 }}>{label}</span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setSection(key, e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                </label>
              );
            })}
          </div>
        </Section>

        {/* Hero 輪播 */}
        <Section
          title="Hero 主視覺輪播"
          action={
            <button
              onClick={() =>
                patch({
                  heroSlides: [
                    ...(config.heroSlides ?? []),
                    { title: '', subtitle: '', body: '', ctaLabel: '', ctaHref: '', imageUrl: '' },
                  ],
                })
              }
              style={s.addBtn}
            >
              + 新增一張
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
            <Field label="視覺樣式">
              <select
                value={config.heroVariant ?? 'carousel'}
                onChange={(e) => patch({ heroVariant: e.target.value as 'carousel' | 'split' | 'minimal' })}
                style={s.input}
              >
                <option value="carousel">輪播（預設，多張自動切換）</option>
                <option value="split">圖文左右（單張，左字右圖）</option>
                <option value="minimal">純文字（無底圖）</option>
              </select>
            </Field>
            <Field label="切換間隔（秒）">
              <input
                type="number"
                min={2}
                value={config.heroIntervalSec ?? 6}
                onChange={(e) => patch({ heroIntervalSec: Number(e.target.value) || 6 })}
                style={s.input}
              />
            </Field>
          </div>

          {(config.heroSlides ?? []).length === 0 ? (
            <p style={s.empty}>還沒有任何 hero。新增第一張開始。</p>
          ) : (
            <SortableList
              items={config.heroSlides ?? []}
              onReorder={(next) => patch({ heroSlides: next })}
              renderItem={(slide, idx, { handleProps }) => (
              <CardEditor
                key={idx}
                title={`第 ${idx + 1} 張`}
                dragHandle={<DragHandle {...handleProps} />}
                onRemove={() =>
                  patch({ heroSlides: config.heroSlides!.filter((_, i) => i !== idx) })
                }
              >
                <Field label="主標題">
                  <input
                    value={slide.title}
                    onChange={(e) => updateAt(setConfig, 'heroSlides', idx, { title: e.target.value })}
                    style={s.input}
                  />
                </Field>
                <Field label="副標題">
                  <input
                    value={slide.subtitle ?? ''}
                    onChange={(e) =>
                      updateAt(setConfig, 'heroSlides', idx, { subtitle: e.target.value })
                    }
                    style={s.input}
                  />
                </Field>
                <Field label="說明文字">
                  <textarea
                    value={slide.body ?? ''}
                    onChange={(e) =>
                      updateAt(setConfig, 'heroSlides', idx, { body: e.target.value })
                    }
                    style={{ ...s.input, minHeight: 56, fontFamily: 'inherit' }}
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="按鈕文字">
                    <input
                      value={slide.ctaLabel ?? ''}
                      onChange={(e) =>
                        updateAt(setConfig, 'heroSlides', idx, { ctaLabel: e.target.value })
                      }
                      style={s.input}
                    />
                  </Field>
                  <Field label="按鈕連結">
                    <input
                      value={slide.ctaHref ?? ''}
                      onChange={(e) =>
                        updateAt(setConfig, 'heroSlides', idx, { ctaHref: e.target.value })
                      }
                      style={s.input}
                    />
                  </Field>
                </div>
                <Field label="背景圖片（桌機）">
                  <MediaUrlInput
                    tenant={tenant}
                    value={slide.imageUrl ?? ''}
                    onChange={(url) => updateAt(setConfig, 'heroSlides', idx, { imageUrl: url })}
                    placeholder="留空使用預設漸層；可貼 URL 或從媒體庫選"
                  />
                </Field>
                <Field label="背景圖片（手機，< 768px 用此圖；可空）">
                  <MediaUrlInput
                    tenant={tenant}
                    value={slide.imageUrlMobile ?? ''}
                    onChange={(url) => updateAt(setConfig, 'heroSlides', idx, { imageUrlMobile: url })}
                    placeholder="未設則用桌機圖縮放"
                  />
                </Field>
              </CardEditor>
              )}
            />
          )}
        </Section>

        {/* 活動精選 */}
        <Section title="活動精選">
          <Field label="視覺樣式">
            <select
              value={config.events?.variant ?? 'featured'}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  events: {
                    ...(c.events ?? {}),
                    variant: e.target.value as 'featured' | 'equal' | 'timeline',
                  },
                }))
              }
              style={s.input}
            >
              <option value="featured">主推 1 大 + 2 小（預設）</option>
              <option value="equal">3 卡平均</option>
              <option value="timeline">時間軸（直式列表）</option>
            </select>
          </Field>
          <div style={{ marginBottom: 16 }}>
            <h4 style={s.subhead}>主推活動（大卡）</h4>
            <EventEditor
              value={config.events?.featured ?? { title: '', dateRange: '' }}
              onChange={(v) =>
                setConfig((c) => ({ ...c, events: { ...(c.events ?? {}), featured: v } }))
              }
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={s.subhead}>次要活動（小卡，最多 2）</h4>
              <button
                onClick={() => {
                  const list = [...(config.events?.items ?? [])];
                  if (list.length >= 2) return;
                  list.push({ title: '', dateRange: '' });
                  setConfig((c) => ({ ...c, events: { ...(c.events ?? {}), items: list } }));
                }}
                style={s.addBtn}
                disabled={(config.events?.items ?? []).length >= 2}
              >
                + 新增
              </button>
            </div>
            {(config.events?.items ?? []).map((ev, idx) => (
              <CardEditor
                key={idx}
                title={`小卡 ${idx + 1}`}
                onRemove={() => {
                  const list = (config.events?.items ?? []).filter((_, i) => i !== idx);
                  setConfig((c) => ({ ...c, events: { ...(c.events ?? {}), items: list } }));
                }}
              >
                <EventEditor
                  value={ev}
                  onChange={(v) => {
                    const list = [...(config.events?.items ?? [])];
                    list[idx] = v;
                    setConfig((c) => ({ ...c, events: { ...(c.events ?? {}), items: list } }));
                  }}
                />
              </CardEditor>
            ))}
          </div>
        </Section>

        {/* 快速服務 */}
        <Section
          title="快速服務"
          action={
            <button
              onClick={() =>
                patch({
                  quickServices: [
                    ...(config.quickServices ?? []),
                    { label: '', href: '', icon: 'apply' },
                  ],
                })
              }
              style={s.addBtn}
            >
              + 新增
            </button>
          }
        >
          <Field label="視覺樣式">
            <select
              value={config.quickServicesVariant ?? 'grid'}
              onChange={(e) =>
                patch({ quickServicesVariant: e.target.value as 'grid' | 'chip' | 'compact' })
              }
              style={s.input}
            >
              <option value="grid">2x3 方格（預設）</option>
              <option value="chip">圓角 chip 一排</option>
              <option value="compact">緊湊小圖列</option>
            </select>
          </Field>
          {(config.quickServices ?? []).length === 0 ? (
            <p style={s.empty}>尚未設定。</p>
          ) : (
            <SortableList
              items={config.quickServices ?? []}
              onReorder={(next) => patch({ quickServices: next })}
              renderItem={(row, idx, { handleProps }) => (
              <Row key={idx} dragHandle={<DragHandle {...handleProps} />} onRemove={() =>
                patch({ quickServices: config.quickServices!.filter((_, i) => i !== idx) })
              }>
                <input
                  value={row.label}
                  onChange={(e) =>
                    updateAt(setConfig, 'quickServices', idx, { label: e.target.value })
                  }
                  placeholder="標籤"
                  style={{ ...s.input, flex: 2 }}
                />
                <select
                  value={row.icon}
                  onChange={(e) =>
                    updateAt(setConfig, 'quickServices', idx, { icon: e.target.value })
                  }
                  style={{ ...s.input, width: 140 }}
                >
                  {QUICK_SERVICE_ICONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  value={row.href}
                  onChange={(e) =>
                    updateAt(setConfig, 'quickServices', idx, { href: e.target.value })
                  }
                  placeholder="連結"
                  style={{ ...s.input, flex: 3 }}
                />
              </Row>
              )}
            />
          )}
        </Section>

        {/* 業務專區 */}
        <Section
          title="業務專區"
          action={
            <button
              onClick={() =>
                patch({
                  businessCards: [
                    ...(config.businessCards ?? []),
                    { title: '', description: '', href: '#', icon: 'heritage' },
                  ],
                })
              }
              style={s.addBtn}
            >
              + 新增
            </button>
          }
        >
          <Field label="視覺樣式">
            <select
              value={config.businessVariant ?? 'stripe'}
              onChange={(e) =>
                patch({ businessVariant: e.target.value as 'stripe' | 'minimal' | 'wide' })
              }
              style={s.input}
            >
              <option value="stripe">條紋卡（上方 brand 色條 + hover 浮起）</option>
              <option value="minimal">極簡（無框、純圖示 + 文字）</option>
              <option value="wide">寬卡（圖左字右、3–4 欄）</option>
            </select>
          </Field>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            <input
              type="checkbox"
              checked={config.businessFromCategories ?? false}
              onChange={(e) => patch({ businessFromCategories: e.target.checked })}
            />
            <span>從「分類管理」自動帶業務專區（勾選後忽略下方手動清單）</span>
          </label>
          {(config.businessCards ?? []).length === 0 ? (
            <p style={s.empty}>未設定 → 前台會用內建預設。</p>
          ) : (
            <SortableList
              items={config.businessCards ?? []}
              onReorder={(next) => patch({ businessCards: next })}
              renderItem={(row, idx, { handleProps }) => (
              <CardEditor
                key={idx}
                title={`卡片 ${idx + 1}`}
                dragHandle={<DragHandle {...handleProps} />}
                onRemove={() =>
                  patch({ businessCards: config.businessCards!.filter((_, i) => i !== idx) })
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12 }}>
                  <Field label="標題">
                    <input
                      value={row.title}
                      onChange={(e) =>
                        updateAt(setConfig, 'businessCards', idx, { title: e.target.value })
                      }
                      style={s.input}
                    />
                  </Field>
                  <Field label="圖示">
                    <select
                      value={row.icon}
                      onChange={(e) =>
                        updateAt(setConfig, 'businessCards', idx, { icon: e.target.value })
                      }
                      style={s.input}
                    >
                      {BUSINESS_ICONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="說明文字（兩行用 \\n 換行）">
                  <input
                    value={row.description}
                    onChange={(e) =>
                      updateAt(setConfig, 'businessCards', idx, { description: e.target.value })
                    }
                    style={s.input}
                  />
                </Field>
                <Field label="連結">
                  <input
                    value={row.href}
                    onChange={(e) =>
                      updateAt(setConfig, 'businessCards', idx, { href: e.target.value })
                    }
                    style={s.input}
                  />
                </Field>
              </CardEditor>
              )}
            />
          )}
        </Section>

        {/* 附屬機關 */}
        <Section
          title="附屬機關"
          action={
            <button
              onClick={() =>
                patch({
                  affiliates: [
                    ...(config.affiliates ?? []),
                    { name: '', href: '', abbr: '' },
                  ],
                })
              }
              style={s.addBtn}
            >
              + 新增
            </button>
          }
        >
          <Field label="視覺樣式">
            <select
              value={config.affiliatesVariant ?? 'chip'}
              onChange={(e) =>
                patch({ affiliatesVariant: e.target.value as 'chip' | 'card' | 'list' })
              }
              style={s.input}
            >
              <option value="chip">Chip 列（藥丸狀，緊湊）</option>
              <option value="card">卡片（小卡 + 圖示，傳統）</option>
              <option value="list">列表（直式條目，適合長清單）</option>
            </select>
          </Field>
          {(config.affiliates ?? []).length === 0 ? (
            <p style={s.empty}>尚未設定。</p>
          ) : (
            <SortableList
              items={config.affiliates ?? []}
              onReorder={(next) => patch({ affiliates: next })}
              renderItem={(row, idx, { handleProps }) => (
              <Row key={idx} dragHandle={<DragHandle {...handleProps} />} onRemove={() =>
                patch({ affiliates: config.affiliates!.filter((_, i) => i !== idx) })
              }>
                <input
                  value={row.name}
                  onChange={(e) =>
                    updateAt(setConfig, 'affiliates', idx, { name: e.target.value })
                  }
                  placeholder="名稱"
                  style={{ ...s.input, flex: 2 }}
                />
                <input
                  value={row.abbr ?? ''}
                  onChange={(e) =>
                    updateAt(setConfig, 'affiliates', idx, { abbr: e.target.value })
                  }
                  placeholder="代字"
                  style={{ ...s.input, width: 60 }}
                  maxLength={2}
                />
                <input
                  value={row.href}
                  onChange={(e) =>
                    updateAt(setConfig, 'affiliates', idx, { href: e.target.value })
                  }
                  placeholder="連結"
                  style={{ ...s.input, flex: 3 }}
                />
              </Row>
              )}
            />
          )}
        </Section>

        {/* 申辦進度查詢 */}
        <Section
          title="申辦進度查詢"
          action={
            <button
              onClick={() => {
                const steps = [...(config.progress?.steps ?? []), { label: '', date: '' }];
                setConfig((c) => ({ ...c, progress: { ...(c.progress ?? {}), steps } }));
              }}
              style={s.addBtn}
            >
              + 新增步驟
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
            <Field label="案件編號">
              <input
                value={config.progress?.caseInfo?.id ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    progress: {
                      ...(c.progress ?? {}),
                      caseInfo: {
                        ...(c.progress?.caseInfo ?? { id: '', title: '' }),
                        id: e.target.value,
                      },
                    },
                  }))
                }
                placeholder="A1130510001"
                style={s.input}
              />
            </Field>
            <Field label="申請項目">
              <input
                value={config.progress?.caseInfo?.title ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    progress: {
                      ...(c.progress ?? {}),
                      caseInfo: {
                        ...(c.progress?.caseInfo ?? { id: '', title: '' }),
                        title: e.target.value,
                      },
                    },
                  }))
                }
                placeholder="113 年度藝文活動補助申請"
                style={s.input}
              />
            </Field>
            <Field label="目前步驟">
              <input
                type="number"
                min={0}
                value={config.progress?.currentIndex ?? 0}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    progress: { ...(c.progress ?? {}), currentIndex: Number(e.target.value) || 0 },
                  }))
                }
                style={s.input}
              />
            </Field>
          </div>
          {(config.progress?.steps ?? []).length === 0 ? (
            <p style={s.empty}>未設定 → 用內建預設 5 步驟。</p>
          ) : (
            (config.progress?.steps ?? []).map((step, idx) => (
              <Row
                key={idx}
                onRemove={() => {
                  const steps = (config.progress?.steps ?? []).filter((_, i) => i !== idx);
                  setConfig((c) => ({ ...c, progress: { ...(c.progress ?? {}), steps } }));
                }}
              >
                <input
                  value={step.label}
                  onChange={(e) => {
                    const steps = [...(config.progress?.steps ?? [])];
                    steps[idx] = { ...step, label: e.target.value };
                    setConfig((c) => ({ ...c, progress: { ...(c.progress ?? {}), steps } }));
                  }}
                  placeholder={`步驟 ${idx + 1}（如：案件申請）`}
                  style={{ ...s.input, flex: 2 }}
                />
                <input
                  value={step.date ?? ''}
                  onChange={(e) => {
                    const steps = [...(config.progress?.steps ?? [])];
                    steps[idx] = { ...step, date: e.target.value };
                    setConfig((c) => ({ ...c, progress: { ...(c.progress ?? {}), steps } }));
                  }}
                  placeholder="2024/05/10"
                  style={{ ...s.input, flex: 1 }}
                />
              </Row>
            ))
          )}
        </Section>

        {/* 滿意度調查 */}
        <Section title="滿意度調查">
          <Field label="標題">
            <input
              value={config.satisfaction?.title ?? ''}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  satisfaction: { ...(c.satisfaction ?? {}), title: e.target.value },
                }))
              }
              placeholder="滿意度調查"
              style={s.input}
            />
          </Field>
          <Field label="提問文字">
            <input
              value={config.satisfaction?.question ?? ''}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  satisfaction: { ...(c.satisfaction ?? {}), question: e.target.value },
                }))
              }
              placeholder="您對本網站的整體滿意度為何？"
              style={s.input}
            />
          </Field>
        </Section>

        {/* 頂部 Utility 列 */}
        <Section
          title="頂部 Utility 列"
          action={
            <button
              onClick={() => {
                const items = [
                  ...(config.topUtility?.items ?? []),
                  { label: '', href: '#', openNewTab: false, emphasized: false },
                ];
                setConfig((c) => ({ ...c, topUtility: { items } }));
              }}
              style={s.addBtn}
            >
              + 新增
            </button>
          }
        >
          <p style={s.empty}>
            放在 header 最上方的政府站慣例連結（網站導覽 / English / 陳情 / 常見問答 / 台北通…）。
          </p>
          {(config.topUtility?.items ?? []).map((it, idx) => (
            <Row
              key={idx}
              onRemove={() => {
                const items = (config.topUtility?.items ?? []).filter((_, i) => i !== idx);
                setConfig((c) => ({ ...c, topUtility: { items } }));
              }}
            >
              <input
                value={it.label}
                onChange={(e) => {
                  const items = [...(config.topUtility?.items ?? [])];
                  items[idx] = { ...it, label: e.target.value };
                  setConfig((c) => ({ ...c, topUtility: { items } }));
                }}
                placeholder="文字"
                style={{ ...s.input, flex: 2 }}
              />
              <input
                value={it.href}
                onChange={(e) => {
                  const items = [...(config.topUtility?.items ?? [])];
                  items[idx] = { ...it, href: e.target.value };
                  setConfig((c) => ({ ...c, topUtility: { items } }));
                }}
                placeholder="連結"
                style={{ ...s.input, flex: 3 }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={!!it.openNewTab}
                  onChange={(e) => {
                    const items = [...(config.topUtility?.items ?? [])];
                    items[idx] = { ...it, openNewTab: e.target.checked };
                    setConfig((c) => ({ ...c, topUtility: { items } }));
                  }}
                />
                新分頁
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={!!it.emphasized}
                  onChange={(e) => {
                    const items = [...(config.topUtility?.items ?? [])];
                    items[idx] = { ...it, emphasized: e.target.checked };
                    setConfig((c) => ({ ...c, topUtility: { items } }));
                  }}
                />
                強調
              </label>
            </Row>
          ))}
        </Section>

        {/* 搜尋區 */}
        <Section title="搜尋區">
          <Field label="標題（可空）">
            <input
              value={config.searchHero?.title ?? ''}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  searchHero: { ...(c.searchHero ?? {}), title: e.target.value },
                }))
              }
              style={s.input}
              placeholder="例：搜尋本站"
            />
          </Field>
          <Field label="輸入框 placeholder">
            <input
              value={config.searchHero?.placeholder ?? ''}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  searchHero: { ...(c.searchHero ?? {}), placeholder: e.target.value },
                }))
              }
              style={s.input}
              placeholder="請輸入關鍵字"
            />
          </Field>
          <Field label="送出後跳轉路徑">
            <input
              value={config.searchHero?.action ?? ''}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  searchHero: { ...(c.searchHero ?? {}), action: e.target.value },
                }))
              }
              style={s.input}
              placeholder="/search"
            />
          </Field>
          <Field label="熱門關鍵字（逗號分隔）">
            <input
              value={(config.searchHero?.hotKeywords ?? []).join(', ')}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  searchHero: {
                    ...(c.searchHero ?? {}),
                    hotKeywords: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                }))
              }
              style={s.input}
              placeholder="例：補助申請, 文化資產, 老房子"
            />
          </Field>
        </Section>

        {/* 對外服務 */}
        <Section
          title="對外服務"
          action={
            <button
              onClick={() => {
                const items = [
                  ...(config.externalServices?.items ?? []),
                  { title: '', href: '#' },
                ];
                setConfig((c) => ({
                  ...c,
                  externalServices: { ...(c.externalServices ?? {}), items },
                }));
              }}
              style={s.addBtn}
            >
              + 新增
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="區塊標題">
              <input
                value={config.externalServices?.title ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    externalServices: { ...(c.externalServices ?? {}), title: e.target.value },
                  }))
                }
                placeholder="對外服務"
                style={s.input}
              />
            </Field>
            <Field label="視覺樣式">
              <select
                value={config.externalServices?.variant ?? 'image-card'}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    externalServices: {
                      ...(c.externalServices ?? {}),
                      variant: e.target.value as 'image-card' | 'logo-grid' | 'banner',
                    },
                  }))
                }
                style={s.input}
              >
                <option value="image-card">大圖卡（預設）</option>
                <option value="logo-grid">Logo grid（簡潔）</option>
                <option value="banner">橫幅列</option>
              </select>
            </Field>
          </div>
          {(config.externalServices?.items ?? []).map((it, idx) => (
            <CardEditor
              key={idx}
              title={`卡片 ${idx + 1}`}
              onRemove={() => {
                const items = (config.externalServices?.items ?? []).filter((_, i) => i !== idx);
                setConfig((c) => ({
                  ...c,
                  externalServices: { ...(c.externalServices ?? {}), items },
                }));
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                <Field label="標題">
                  <input
                    value={it.title}
                    onChange={(e) => {
                      const items = [...(config.externalServices?.items ?? [])];
                      items[idx] = { ...it, title: e.target.value };
                      setConfig((c) => ({
                        ...c,
                        externalServices: { ...(c.externalServices ?? {}), items },
                      }));
                    }}
                    style={s.input}
                  />
                </Field>
                <Field label="徽章 (可空)">
                  <input
                    value={it.badge ?? ''}
                    onChange={(e) => {
                      const items = [...(config.externalServices?.items ?? [])];
                      items[idx] = { ...it, badge: e.target.value };
                      setConfig((c) => ({
                        ...c,
                        externalServices: { ...(c.externalServices ?? {}), items },
                      }));
                    }}
                    placeholder="OPEN DATA"
                    style={s.input}
                  />
                </Field>
              </div>
              <Field label="說明">
                <input
                  value={it.description ?? ''}
                  onChange={(e) => {
                    const items = [...(config.externalServices?.items ?? [])];
                    items[idx] = { ...it, description: e.target.value };
                    setConfig((c) => ({
                      ...c,
                      externalServices: { ...(c.externalServices ?? {}), items },
                    }));
                  }}
                  style={s.input}
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="連結">
                  <input
                    value={it.href}
                    onChange={(e) => {
                      const items = [...(config.externalServices?.items ?? [])];
                      items[idx] = { ...it, href: e.target.value };
                      setConfig((c) => ({
                        ...c,
                        externalServices: { ...(c.externalServices ?? {}), items },
                      }));
                    }}
                    style={s.input}
                  />
                </Field>
                <Field label="背景圖 URL">
                  <input
                    value={it.imageUrl ?? ''}
                    onChange={(e) => {
                      const items = [...(config.externalServices?.items ?? [])];
                      items[idx] = { ...it, imageUrl: e.target.value };
                      setConfig((c) => ({
                        ...c,
                        externalServices: { ...(c.externalServices ?? {}), items },
                      }));
                    }}
                    style={s.input}
                  />
                </Field>
              </div>
            </CardEditor>
          ))}
        </Section>

        {/* 最新消息（NewsRow / NewsTabs 共用 newsVariant） */}
        <Section title="最新消息（單列模式）視覺">
          <Field label="視覺樣式">
            <select
              value={config.newsVariant ?? 'date-badge'}
              onChange={(e) =>
                patch({ newsVariant: e.target.value as 'date-badge' | 'plain' | 'card-grid' })
              }
              style={s.input}
            >
              <option value="date-badge">紅色日期方塊（預設）</option>
              <option value="plain">純條列（日期 + 標題）</option>
              <option value="card-grid">卡片網格</option>
            </select>
          </Field>
          <p style={s.empty}>※ 只在「公告 Tab」未設定時生效；設了 tab 之後改 tab 區塊。</p>
        </Section>

        {/* 公告 Tabs */}
        <Section
          title="公告區 Tab"
          action={
            <button
              onClick={() => {
                const tabs = [
                  ...(config.newsTabs?.tabs ?? []),
                  { label: '', filterType: '', moreHref: '/news' },
                ];
                setConfig((c) => ({ ...c, newsTabs: { tabs } }));
              }}
              style={s.addBtn}
            >
              + 新增 Tab
            </button>
          }
        >
          <p style={s.empty}>
            未設定 → 顯示單一最新消息列。設定後，依 page type 過濾顯示對應 tab 的內容。
          </p>
          {(config.newsTabs?.tabs ?? []).map((t, idx) => (
            <Row
              key={idx}
              onRemove={() => {
                const tabs = (config.newsTabs?.tabs ?? []).filter((_, i) => i !== idx);
                setConfig((c) => ({ ...c, newsTabs: { tabs } }));
              }}
            >
              <input
                value={t.label}
                onChange={(e) => {
                  const tabs = [...(config.newsTabs?.tabs ?? [])];
                  tabs[idx] = { ...t, label: e.target.value };
                  setConfig((c) => ({ ...c, newsTabs: { tabs } }));
                }}
                placeholder="Tab 名稱（新聞稿）"
                style={{ ...s.input, flex: 2 }}
              />
              <select
                value={t.filterType ?? ''}
                onChange={(e) => {
                  const tabs = [...(config.newsTabs?.tabs ?? [])];
                  tabs[idx] = { ...t, filterType: e.target.value };
                  setConfig((c) => ({ ...c, newsTabs: { tabs } }));
                }}
                style={{ ...s.input, width: 130 }}
              >
                <option value="">全部</option>
                <option value="news">news</option>
                <option value="service">service</option>
                <option value="about">about</option>
                <option value="custom">custom</option>
              </select>
              <input
                value={t.moreHref ?? ''}
                onChange={(e) => {
                  const tabs = [...(config.newsTabs?.tabs ?? [])];
                  tabs[idx] = { ...t, moreHref: e.target.value };
                  setConfig((c) => ({ ...c, newsTabs: { tabs } }));
                }}
                placeholder="查看更多連結"
                style={{ ...s.input, flex: 2 }}
              />
            </Row>
          ))}
        </Section>

        {/* 即時數據面板 */}
        <Section
          title="即時數據面板"
          action={
            <button
              onClick={() => {
                const metrics = [
                  ...(config.liveData?.metrics ?? []),
                  { label: '', value: '', unit: '' },
                ];
                setConfig((c) => ({
                  ...c,
                  liveData: { ...(c.liveData ?? {}), metrics },
                }));
              }}
              style={s.addBtn}
            >
              + 新增
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="區塊標題">
              <input
                value={config.liveData?.title ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    liveData: { ...(c.liveData ?? {}), title: e.target.value },
                  }))
                }
                placeholder="即時資訊"
                style={s.input}
              />
            </Field>
            <Field label="視覺樣式">
              <select
                value={config.liveData?.variant ?? 'dark'}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    liveData: { ...(c.liveData ?? {}), variant: e.target.value as 'dark' | 'light' },
                  }))
                }
                style={s.input}
              >
                <option value="dark">深色 dashboard</option>
                <option value="light">淺色卡片</option>
              </select>
            </Field>
          </div>
          {(config.liveData?.metrics ?? []).map((m, idx) => (
            <CardEditor
              key={idx}
              title={`指標 ${idx + 1}`}
              onRemove={() => {
                const metrics = (config.liveData?.metrics ?? []).filter((_, i) => i !== idx);
                setConfig((c) => ({
                  ...c,
                  liveData: { ...(c.liveData ?? {}), metrics },
                }));
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="名稱">
                  <input
                    value={m.label}
                    onChange={(e) => {
                      const metrics = [...(config.liveData?.metrics ?? [])];
                      metrics[idx] = { ...m, label: e.target.value };
                      setConfig((c) => ({
                        ...c,
                        liveData: { ...(c.liveData ?? {}), metrics },
                      }));
                    }}
                    style={s.input}
                  />
                </Field>
                <Field label="數值">
                  <input
                    value={m.value}
                    onChange={(e) => {
                      const metrics = [...(config.liveData?.metrics ?? [])];
                      metrics[idx] = { ...m, value: e.target.value };
                      setConfig((c) => ({
                        ...c,
                        liveData: { ...(c.liveData ?? {}), metrics },
                      }));
                    }}
                    placeholder="例：78.5"
                    style={s.input}
                  />
                </Field>
                <Field label="單位">
                  <input
                    value={m.unit ?? ''}
                    onChange={(e) => {
                      const metrics = [...(config.liveData?.metrics ?? [])];
                      metrics[idx] = { ...m, unit: e.target.value };
                      setConfig((c) => ({
                        ...c,
                        liveData: { ...(c.liveData ?? {}), metrics },
                      }));
                    }}
                    placeholder="%、ppm、人"
                    style={s.input}
                  />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="狀態燈號">
                  <select
                    value={m.status ?? ''}
                    onChange={(e) => {
                      const metrics = [...(config.liveData?.metrics ?? [])];
                      metrics[idx] = { ...m, status: (e.target.value || undefined) as any };
                      setConfig((c) => ({
                        ...c,
                        liveData: { ...(c.liveData ?? {}), metrics },
                      }));
                    }}
                    style={s.input}
                  >
                    <option value="">無</option>
                    <option value="green">🟢 正常</option>
                    <option value="yellow">🟡 注意</option>
                    <option value="red">🔴 警示</option>
                    <option value="neutral">⚪ 中性</option>
                  </select>
                </Field>
                <Field label="來源 URL">
                  <input
                    value={m.sourceHref ?? ''}
                    onChange={(e) => {
                      const metrics = [...(config.liveData?.metrics ?? [])];
                      metrics[idx] = { ...m, sourceHref: e.target.value };
                      setConfig((c) => ({
                        ...c,
                        liveData: { ...(c.liveData ?? {}), metrics },
                      }));
                    }}
                    style={s.input}
                  />
                </Field>
              </div>
            </CardEditor>
          ))}
        </Section>

        {/* 統計數字 */}
        <Section
          title="統計數字"
          action={
            <button
              onClick={() => {
                const items = [
                  ...(config.stats?.items ?? []),
                  { label: '', value: '' },
                ];
                setConfig((c) => ({
                  ...c,
                  stats: { ...(c.stats ?? {}), items },
                }));
              }}
              style={s.addBtn}
            >
              + 新增
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="區塊標題">
              <input
                value={config.stats?.title ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    stats: { ...(c.stats ?? {}), title: e.target.value },
                  }))
                }
                placeholder="本局數據"
                style={s.input}
              />
            </Field>
            <Field label="樣式">
              <select
                value={config.stats?.variant ?? 'card'}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    stats: { ...(c.stats ?? {}), variant: e.target.value as 'card' | 'bare' },
                  }))
                }
                style={s.input}
              >
                <option value="card">卡片版</option>
                <option value="bare">純數字版</option>
              </select>
            </Field>
          </div>
          {(config.stats?.items ?? []).map((it, idx) => (
            <CardEditor
              key={idx}
              title={`KPI ${idx + 1}`}
              onRemove={() => {
                const items = (config.stats?.items ?? []).filter((_, i) => i !== idx);
                setConfig((c) => ({ ...c, stats: { ...(c.stats ?? {}), items } }));
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px', gap: 12 }}>
                <Field label="前綴">
                  <input
                    value={it.prefix ?? ''}
                    onChange={(e) => {
                      const items = [...(config.stats?.items ?? [])];
                      items[idx] = { ...it, prefix: e.target.value };
                      setConfig((c) => ({ ...c, stats: { ...(c.stats ?? {}), items } }));
                    }}
                    placeholder="$"
                    style={s.input}
                  />
                </Field>
                <Field label="數值">
                  <input
                    value={it.value}
                    onChange={(e) => {
                      const items = [...(config.stats?.items ?? [])];
                      items[idx] = { ...it, value: e.target.value };
                      setConfig((c) => ({ ...c, stats: { ...(c.stats ?? {}), items } }));
                    }}
                    style={s.input}
                  />
                </Field>
                <Field label="後綴">
                  <input
                    value={it.suffix ?? ''}
                    onChange={(e) => {
                      const items = [...(config.stats?.items ?? [])];
                      items[idx] = { ...it, suffix: e.target.value };
                      setConfig((c) => ({ ...c, stats: { ...(c.stats ?? {}), items } }));
                    }}
                    placeholder="件"
                    style={s.input}
                  />
                </Field>
              </div>
              <Field label="標籤">
                <input
                  value={it.label}
                  onChange={(e) => {
                    const items = [...(config.stats?.items ?? [])];
                    items[idx] = { ...it, label: e.target.value };
                    setConfig((c) => ({ ...c, stats: { ...(c.stats ?? {}), items } }));
                  }}
                  placeholder="本年度服務件數"
                  style={s.input}
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <Field label="說明">
                  <input
                    value={it.description ?? ''}
                    onChange={(e) => {
                      const items = [...(config.stats?.items ?? [])];
                      items[idx] = { ...it, description: e.target.value };
                      setConfig((c) => ({ ...c, stats: { ...(c.stats ?? {}), items } }));
                    }}
                    style={s.input}
                  />
                </Field>
                <Field label="連結">
                  <input
                    value={it.href ?? ''}
                    onChange={(e) => {
                      const items = [...(config.stats?.items ?? [])];
                      items[idx] = { ...it, href: e.target.value };
                      setConfig((c) => ({ ...c, stats: { ...(c.stats ?? {}), items } }));
                    }}
                    style={s.input}
                  />
                </Field>
              </div>
            </CardEditor>
          ))}
        </Section>

        {/* 分眾導覽 */}
        <Section
          title="分眾導覽"
          action={
            <button
              onClick={() => {
                const items = [
                  ...(config.audienceSegments?.items ?? []),
                  { label: '', href: '#' },
                ];
                setConfig((c) => ({
                  ...c,
                  audienceSegments: { ...(c.audienceSegments ?? {}), items },
                }));
              }}
              style={s.addBtn}
            >
              + 新增
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="區塊標題">
              <input
                value={config.audienceSegments?.title ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    audienceSegments: { ...(c.audienceSegments ?? {}), title: e.target.value },
                  }))
                }
                placeholder="我是…"
                style={s.input}
              />
            </Field>
            <Field label="視覺樣式">
              <select
                value={config.audienceSegments?.variant ?? 'numbered'}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    audienceSegments: {
                      ...(c.audienceSegments ?? {}),
                      variant: e.target.value as 'numbered' | 'icon' | 'image',
                    },
                  }))
                }
                style={s.input}
              >
                <option value="numbered">編號（預設，01/02/03 大字）</option>
                <option value="icon">圓 icon（簡單版）</option>
                <option value="image">圖片背景（漸層 + 名稱 overlay）</option>
              </select>
            </Field>
          </div>
          {(config.audienceSegments?.items ?? []).map((it, idx) => (
            <Row
              key={idx}
              onRemove={() => {
                const items = (config.audienceSegments?.items ?? []).filter((_, i) => i !== idx);
                setConfig((c) => ({
                  ...c,
                  audienceSegments: { ...(c.audienceSegments ?? {}), items },
                }));
              }}
            >
              <input
                value={it.label}
                onChange={(e) => {
                  const items = [...(config.audienceSegments?.items ?? [])];
                  items[idx] = { ...it, label: e.target.value };
                  setConfig((c) => ({
                    ...c,
                    audienceSegments: { ...(c.audienceSegments ?? {}), items },
                  }));
                }}
                placeholder="身份（例：役男）"
                style={{ ...s.input, flex: 2 }}
              />
              <input
                value={it.abbr ?? ''}
                onChange={(e) => {
                  const items = [...(config.audienceSegments?.items ?? [])];
                  items[idx] = { ...it, abbr: e.target.value };
                  setConfig((c) => ({
                    ...c,
                    audienceSegments: { ...(c.audienceSegments ?? {}), items },
                  }));
                }}
                placeholder="代字"
                style={{ ...s.input, width: 60 }}
                maxLength={2}
              />
              <input
                value={it.description ?? ''}
                onChange={(e) => {
                  const items = [...(config.audienceSegments?.items ?? [])];
                  items[idx] = { ...it, description: e.target.value };
                  setConfig((c) => ({
                    ...c,
                    audienceSegments: { ...(c.audienceSegments ?? {}), items },
                  }));
                }}
                placeholder="說明"
                style={{ ...s.input, flex: 3 }}
              />
              <input
                value={it.href}
                onChange={(e) => {
                  const items = [...(config.audienceSegments?.items ?? [])];
                  items[idx] = { ...it, href: e.target.value };
                  setConfig((c) => ({
                    ...c,
                    audienceSegments: { ...(c.audienceSegments ?? {}), items },
                  }));
                }}
                placeholder="連結"
                style={{ ...s.input, flex: 2 }}
              />
            </Row>
          ))}
        </Section>

        {/* 社群動態牆 */}
        <Section
          title="社群動態牆"
          action={
            <button
              onClick={() => {
                const items = [
                  ...(config.socialFeed?.items ?? []),
                  { platform: 'facebook' as const, href: '' },
                ];
                setConfig((c) => ({
                  ...c,
                  socialFeed: { ...(c.socialFeed ?? {}), items },
                }));
              }}
              style={s.addBtn}
            >
              + 新增
            </button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <Field label="區塊標題">
              <input
                value={config.socialFeed?.title ?? ''}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    socialFeed: { ...(c.socialFeed ?? {}), title: e.target.value },
                  }))
                }
                placeholder="社群動態"
                style={s.input}
              />
            </Field>
            <Field label="視覺樣式">
              <select
                value={config.socialFeed?.variant ?? 'card'}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    socialFeed: {
                      ...(c.socialFeed ?? {}),
                      variant: e.target.value as 'card' | 'masonry' | 'list',
                    },
                  }))
                }
                style={s.input}
              >
                <option value="card">卡片網格（預設）</option>
                <option value="masonry">不規則 Masonry</option>
                <option value="list">純連結列</option>
              </select>
            </Field>
          </div>
          {(config.socialFeed?.items ?? []).map((it, idx) => (
            <CardEditor
              key={idx}
              title={`貼文 ${idx + 1}`}
              onRemove={() => {
                const items = (config.socialFeed?.items ?? []).filter((_, i) => i !== idx);
                setConfig((c) => ({
                  ...c,
                  socialFeed: { ...(c.socialFeed ?? {}), items },
                }));
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
                <Field label="平台">
                  <select
                    value={it.platform}
                    onChange={(e) => {
                      const items = [...(config.socialFeed?.items ?? [])];
                      items[idx] = { ...it, platform: e.target.value as any };
                      setConfig((c) => ({
                        ...c,
                        socialFeed: { ...(c.socialFeed ?? {}), items },
                      }));
                    }}
                    style={s.input}
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="threads">Threads</option>
                    <option value="twitter">X / Twitter</option>
                  </select>
                </Field>
                <Field label="貼文連結">
                  <input
                    value={it.href}
                    onChange={(e) => {
                      const items = [...(config.socialFeed?.items ?? [])];
                      items[idx] = { ...it, href: e.target.value };
                      setConfig((c) => ({
                        ...c,
                        socialFeed: { ...(c.socialFeed ?? {}), items },
                      }));
                    }}
                    style={s.input}
                  />
                </Field>
              </div>
              <Field label="縮圖 URL">
                <input
                  value={it.imageUrl ?? ''}
                  onChange={(e) => {
                    const items = [...(config.socialFeed?.items ?? [])];
                    items[idx] = { ...it, imageUrl: e.target.value };
                    setConfig((c) => ({
                      ...c,
                      socialFeed: { ...(c.socialFeed ?? {}), items },
                    }));
                  }}
                  style={s.input}
                />
              </Field>
              <Field label="文案">
                <input
                  value={it.caption ?? ''}
                  onChange={(e) => {
                    const items = [...(config.socialFeed?.items ?? [])];
                    items[idx] = { ...it, caption: e.target.value };
                    setConfig((c) => ({
                      ...c,
                      socialFeed: { ...(c.socialFeed ?? {}), items },
                    }));
                  }}
                  style={s.input}
                />
              </Field>
              <Field label="時間 / meta">
                <input
                  value={it.meta ?? ''}
                  onChange={(e) => {
                    const items = [...(config.socialFeed?.items ?? [])];
                    items[idx] = { ...it, meta: e.target.value };
                    setConfig((c) => ({
                      ...c,
                      socialFeed: { ...(c.socialFeed ?? {}), items },
                    }));
                  }}
                  placeholder="2 天前 / 2026/05/01"
                  style={s.input}
                />
              </Field>
            </CardEditor>
          ))}
        </Section>

        {/* 頁尾連結 */}
        <Section
          title="頁尾連結欄"
          action={
            <button
              onClick={() => {
                const groups = [...(config.footer?.groups ?? []), { items: [{ label: '', href: '#' }] }];
                setConfig((c) => ({ ...c, footer: { ...(c.footer ?? {}), groups } }));
              }}
              style={s.addBtn}
            >
              + 新增一欄
            </button>
          }
        >
          {(config.footer?.groups ?? []).length === 0 ? (
            <p style={s.empty}>未設定 → 使用內建預設（網站導覽 / 隱私 / 無障礙等）。</p>
          ) : (
            (config.footer?.groups ?? []).map((g, gi) => (
              <CardEditor
                key={gi}
                title={`第 ${gi + 1} 欄`}
                onRemove={() => {
                  const groups = config.footer!.groups!.filter((_, i) => i !== gi);
                  setConfig((c) => ({ ...c, footer: { ...(c.footer ?? {}), groups } }));
                }}
              >
                <Field label="欄位標題（可空）">
                  <input
                    value={g.title ?? ''}
                    onChange={(e) => {
                      const groups = [...config.footer!.groups!];
                      groups[gi] = { ...g, title: e.target.value };
                      setConfig((c) => ({ ...c, footer: { ...(c.footer ?? {}), groups } }));
                    }}
                    style={s.input}
                  />
                </Field>
                {g.items.map((it, ii) => (
                  <Row
                    key={ii}
                    onRemove={() => {
                      const groups = [...config.footer!.groups!];
                      groups[gi] = { ...g, items: g.items.filter((_, x) => x !== ii) };
                      setConfig((c) => ({ ...c, footer: { ...(c.footer ?? {}), groups } }));
                    }}
                  >
                    <input
                      value={it.label}
                      onChange={(e) => {
                        const groups = [...config.footer!.groups!];
                        const items = [...g.items];
                        items[ii] = { ...it, label: e.target.value };
                        groups[gi] = { ...g, items };
                        setConfig((c) => ({ ...c, footer: { ...(c.footer ?? {}), groups } }));
                      }}
                      placeholder="文字"
                      style={{ ...s.input, flex: 2 }}
                    />
                    <input
                      value={it.href}
                      onChange={(e) => {
                        const groups = [...config.footer!.groups!];
                        const items = [...g.items];
                        items[ii] = { ...it, href: e.target.value };
                        groups[gi] = { ...g, items };
                        setConfig((c) => ({ ...c, footer: { ...(c.footer ?? {}), groups } }));
                      }}
                      placeholder="連結"
                      style={{ ...s.input, flex: 3 }}
                    />
                  </Row>
                ))}
                <button
                  onClick={() => {
                    const groups = [...config.footer!.groups!];
                    groups[gi] = { ...g, items: [...g.items, { label: '', href: '#' }] };
                    setConfig((c) => ({ ...c, footer: { ...(c.footer ?? {}), groups } }));
                  }}
                  style={{ ...s.addBtn, marginTop: 8 }}
                >
                  + 新增連結
                </button>
              </CardEditor>
            ))
          )}
        </Section>
      </main>

      <PreviewPane
        tenant={tenant}
        refreshKey={previewKey}
        draft={{ homepageConfig: config }}
      />
    </div>
  );
}

// ===== Helpers =====

/** 在 config[key] (陣列) 的第 idx 個元素上 patch 部分欄位 */
function updateAt<K extends 'heroSlides' | 'quickServices' | 'businessCards' | 'affiliates'>(
  setConfig: React.Dispatch<React.SetStateAction<HomepageConfig>>,
  key: K,
  idx: number,
  patchObj: Record<string, unknown>
) {
  setConfig((c) => {
    const arr = ([...((c as any)[key] ?? [])] as any[]);
    arr[idx] = { ...arr[idx], ...patchObj };
    return { ...c, [key]: arr };
  });
}

function EventEditor({
  value,
  onChange,
}: {
  value: { title: string; dateRange: string; venue?: string; href?: string; imageUrl?: string };
  onChange: (v: typeof value) => void;
}) {
  return (
    <>
      <Field label="標題">
        <input
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          style={s.input}
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="日期 / 期間">
          <input
            value={value.dateRange}
            onChange={(e) => onChange({ ...value, dateRange: e.target.value })}
            placeholder="06.01 — 06.30"
            style={s.input}
          />
        </Field>
        <Field label="地點">
          <input
            value={value.venue ?? ''}
            onChange={(e) => onChange({ ...value, venue: e.target.value })}
            style={s.input}
          />
        </Field>
      </div>
      <Field label="背景圖片 URL（可空）">
        <input
          value={value.imageUrl ?? ''}
          onChange={(e) => onChange({ ...value, imageUrl: e.target.value })}
          style={s.input}
        />
      </Field>
    </>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={s.section}>
      <div style={s.sectionHeader}>
        <h2 style={s.sectionTitle}>{title}</h2>
        {action}
      </div>
      <div style={s.card}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function Row({
  children,
  onRemove,
  dragHandle,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  dragHandle?: React.ReactNode;
}) {
  return (
    <div style={s.row}>
      {dragHandle}
      {children}
      <button onClick={onRemove} style={s.removeBtn} aria-label="移除">×</button>
    </div>
  );
}

function CardEditor({
  title,
  onRemove,
  children,
  dragHandle,
}: {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
  dragHandle?: React.ReactNode;
}) {
  return (
    <div style={s.subCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {dragHandle}
          <strong style={{ fontSize: 13 }}>{title}</strong>
        </span>
        <button onClick={onRemove} style={s.removeBtn} aria-label="移除">×</button>
      </div>
      {children}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  main: { marginLeft: 240, flex: 1, padding: '32px 40px', minHeight: '100vh' },
  loading: { padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' },
  subtitle: { fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 },
  saveBtn: {
    padding: '10px 24px', background: 'var(--color-brand)', color: 'white', border: 'none',
    borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  section: { marginBottom: 24 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: 600 },
  subhead: { fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 8 },
  card: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    padding: 18, boxShadow: 'var(--shadow-sm)',
  },
  subCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 4 },
  input: {
    width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6,
    fontSize: 13.5, outline: 'none', fontFamily: 'var(--font-body)',
  },
  toggleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  toggleRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 6, cursor: 'pointer', fontSize: 13.5,
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
    borderBottom: '1px solid var(--color-border)',
  },
  removeBtn: {
    width: 28, height: 28, border: '1px solid var(--color-border)', borderRadius: 6,
    background: 'white', color: 'var(--color-danger, #DC2626)', cursor: 'pointer',
    fontSize: 16, lineHeight: 1, fontFamily: 'inherit',
  },
  addBtn: {
    padding: '6px 12px', background: 'transparent', color: 'var(--color-brand)',
    border: '1px dashed var(--color-brand)', borderRadius: 6, fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  empty: { fontSize: 13, color: 'var(--color-text-muted)', padding: '8px 0', margin: 0 },
};
