'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { PreviewPane } from '@/components/PreviewPane';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPut } from '@/lib/api';

interface BrandConfig {
  name: string;
  brandTokens: Record<string, string>;
  reviewRequired: boolean;
}

// ===== 預設主題 =====
// 一鍵套用的色票包。User 點選後所有 brand tokens 同時填入，
// 之後可在下方各分組微調。預設值不會立即儲存，要按「儲存設定」。

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  swatch: [string, string, string];
  tokens: Record<string, string>;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'gov-blue',
    name: '政府藍',
    description: '標準政府風（資訊局、警察局、工務局風格）',
    swatch: ['#0C5299', '#E8F0F8', '#1F2937'],
    tokens: {
      '--color-brand-primary': '#0C5299',
      '--color-brand-secondary': '#E8F0F8',
      '--color-brand-accent': '#083B6E',
      '--color-bg': '#FFFFFF',
      '--color-bg-alt': '#F8FAFB',
      '--color-surface': '#FFFFFF',
      '--color-text': '#1A1D23',
      '--color-text-muted': '#6B7280',
      '--color-border': '#E2E8F0',
      '--color-link': '#0C5299',
      '--color-footer-bg': '#1F2937',
      '--color-footer-text': '#D1D5DB',
      '--color-footer-heading': '#FFFFFF',
      '--color-tag-bg': '#0C5299',
      '--color-date-badge': '#A02C2C',
      '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
    },
  },
  {
    id: 'culture-gold',
    name: '文化金茶',
    description: '暖金 + 米白 + 墨綠（文化局、客委會風格）',
    swatch: ['#B89968', '#EFE6D6', '#2C3D33'],
    tokens: {
      '--color-brand-primary': '#B89968',
      '--color-brand-secondary': '#EFE6D6',
      '--color-brand-accent': '#A88A4F',
      '--color-bg': '#F8F2E8',
      '--color-bg-alt': '#FFFFFF',
      '--color-surface': '#FFFFFF',
      '--color-text': '#2D2A24',
      '--color-text-muted': '#7A6F5E',
      '--color-border': '#E5DDD0',
      '--color-link': '#A88A4F',
      '--color-footer-bg': '#2C3D33',
      '--color-footer-text': '#D6CFC2',
      '--color-footer-heading': '#FFFFFF',
      '--color-tag-bg': '#B89968',
      '--color-date-badge': '#A02C2C',
      '--font-heading': "'Noto Serif TC', 'Noto Sans TC', serif",
    },
  },
  {
    id: 'eco-green',
    name: '環保綠',
    description: '清新自然（環保局、翡翠水庫風格）',
    swatch: ['#0F7B3F', '#DAEDDA', '#1A2E1F'],
    tokens: {
      '--color-brand-primary': '#0F7B3F',
      '--color-brand-secondary': '#DAEDDA',
      '--color-brand-accent': '#0A5C2E',
      '--color-bg': '#FFFFFF',
      '--color-bg-alt': '#F4F9F4',
      '--color-surface': '#FFFFFF',
      '--color-text': '#1A2E1F',
      '--color-text-muted': '#5B6B5F',
      '--color-border': '#D8E5D8',
      '--color-link': '#0F7B3F',
      '--color-footer-bg': '#1A2E1F',
      '--color-footer-text': '#C9DACA',
      '--color-footer-heading': '#FFFFFF',
      '--color-tag-bg': '#0F7B3F',
      '--color-date-badge': '#D97706',
      '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
    },
  },
  {
    id: 'social-pink',
    name: '社福粉',
    description: '溫暖親民（社會局風格）',
    swatch: ['#D6336C', '#FCE4EC', '#3A2530'],
    tokens: {
      '--color-brand-primary': '#D6336C',
      '--color-brand-secondary': '#FCE4EC',
      '--color-brand-accent': '#B02A55',
      '--color-bg': '#FFFFFF',
      '--color-bg-alt': '#FFF8FA',
      '--color-surface': '#FFFFFF',
      '--color-text': '#2A1E24',
      '--color-text-muted': '#7A5C66',
      '--color-border': '#F0DCE2',
      '--color-link': '#D6336C',
      '--color-footer-bg': '#3A2530',
      '--color-footer-text': '#E8D2D8',
      '--color-footer-heading': '#FFFFFF',
      '--color-tag-bg': '#D6336C',
      '--color-date-badge': '#A02C2C',
      '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
    },
  },
  {
    id: 'health-teal',
    name: '健康藍綠',
    description: '醫療專業（衛生局、消防局風格）',
    swatch: ['#0E8388', '#DCF1F3', '#1A3742'],
    tokens: {
      '--color-brand-primary': '#0E8388',
      '--color-brand-secondary': '#DCF1F3',
      '--color-brand-accent': '#0A6B6F',
      '--color-bg': '#FFFFFF',
      '--color-bg-alt': '#F4FAFB',
      '--color-surface': '#FFFFFF',
      '--color-text': '#0F2A30',
      '--color-text-muted': '#5B7480',
      '--color-border': '#D5E5E7',
      '--color-link': '#0E8388',
      '--color-footer-bg': '#1A3742',
      '--color-footer-text': '#C9DEDC',
      '--color-footer-heading': '#FFFFFF',
      '--color-tag-bg': '#0E8388',
      '--color-date-badge': '#C92127',
      '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
    },
  },
  {
    id: 'tech-purple',
    name: '科技紫',
    description: '現代科技感（青年局、創新單位風格）',
    swatch: ['#6D28D9', '#EDE9FE', '#1E1B4B'],
    tokens: {
      '--color-brand-primary': '#6D28D9',
      '--color-brand-secondary': '#EDE9FE',
      '--color-brand-accent': '#5B21B6',
      '--color-bg': '#FFFFFF',
      '--color-bg-alt': '#FAF8FF',
      '--color-surface': '#FFFFFF',
      '--color-text': '#1A1632',
      '--color-text-muted': '#6B6477',
      '--color-border': '#E0DCEC',
      '--color-link': '#6D28D9',
      '--color-footer-bg': '#1E1B4B',
      '--color-footer-text': '#C7C2E0',
      '--color-footer-heading': '#FFFFFF',
      '--color-tag-bg': '#6D28D9',
      '--color-date-badge': '#DC2626',
      '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
    },
  },
  {
    id: 'youth-vibrant',
    name: '青年活力',
    description: '高彩度搶眼（青年活動、節慶活動風格）',
    swatch: ['#F59E0B', '#FEF3C7', '#18181B'],
    tokens: {
      '--color-brand-primary': '#F59E0B',
      '--color-brand-secondary': '#FEF3C7',
      '--color-brand-accent': '#D97706',
      '--color-bg': '#FFFFFF',
      '--color-bg-alt': '#FFFBF0',
      '--color-surface': '#FFFFFF',
      '--color-text': '#18181B',
      '--color-text-muted': '#6B6B70',
      '--color-border': '#EFE5D2',
      '--color-link': '#D97706',
      '--color-footer-bg': '#18181B',
      '--color-footer-text': '#D1D1D6',
      '--color-footer-heading': '#FFFFFF',
      '--color-tag-bg': '#F59E0B',
      '--color-date-badge': '#DC2626',
      '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
    },
  },
  {
    id: 'legal-navy',
    name: '司法莊重',
    description: '深邃沉穩（法務、政風、研考風格）',
    swatch: ['#1E3A5F', '#DDE6F0', '#0F1F33'],
    tokens: {
      '--color-brand-primary': '#1E3A5F',
      '--color-brand-secondary': '#DDE6F0',
      '--color-brand-accent': '#152844',
      '--color-bg': '#FFFFFF',
      '--color-bg-alt': '#F6F8FB',
      '--color-surface': '#FFFFFF',
      '--color-text': '#0F1F33',
      '--color-text-muted': '#5C6E80',
      '--color-border': '#D8DEE6',
      '--color-link': '#1E3A5F',
      '--color-footer-bg': '#0F1F33',
      '--color-footer-text': '#C0CCD8',
      '--color-footer-heading': '#FFFFFF',
      '--color-tag-bg': '#1E3A5F',
      '--color-date-badge': '#A02C2C',
      '--font-heading': "'Noto Serif TC', 'Noto Sans TC', serif",
    },
  },
];

interface TokenMeta {
  label: string;
  type: 'color' | 'text';
  hint?: string;
}

interface TokenGroup {
  title: string;
  hint?: string;
  tokens: Record<string, TokenMeta>;
}

const tokenGroups: TokenGroup[] = [
  {
    title: '品牌色彩',
    hint: '主視覺顏色。整站元件透過 CSS 變數引用，改了立刻全站套用。',
    tokens: {
      '--color-brand-primary': { label: '主色', type: 'color', hint: '按鈕、連結、強調元素' },
      '--color-brand-secondary': { label: '輔色（淡）', type: 'color', hint: '主色淡版，用於 icon 圓底等' },
      '--color-brand-accent': { label: '強調色', type: 'color', hint: 'logo 文字、業務區彩條等。常等於主色或更暗的同色' },
    },
  },
  {
    title: '介面色彩',
    hint: '頁面背景、卡片、文字等基礎色。',
    tokens: {
      '--color-bg': { label: '頁面底色', type: 'color' },
      '--color-bg-alt': { label: '次要區塊底色（米色 tint）', type: 'color', hint: '用於統計數字、滿意度調查等強調 section' },
      '--color-surface': { label: '卡片底色', type: 'color', hint: '通常白色' },
      '--color-border': { label: '邊框', type: 'color' },
      '--color-text': { label: '主文字', type: 'color' },
      '--color-text-muted': { label: '次要文字', type: 'color' },
      '--color-link': { label: '連結色', type: 'color' },
    },
  },
  {
    title: '頁尾色彩',
    hint: '深色頁尾區的背景與文字。',
    tokens: {
      '--color-footer-bg': { label: '頁尾底色', type: 'color' },
      '--color-footer-text': { label: '頁尾文字', type: 'color' },
      '--color-footer-heading': { label: '頁尾標題', type: 'color' },
    },
  },
  {
    title: '功能色彩',
    hint: '特殊用途的點綴色。',
    tokens: {
      '--color-tag-bg': { label: '新聞 tag 底色', type: 'color', hint: '最新消息列表的 tag 標籤' },
      '--color-date-badge': { label: '日期方塊', type: 'color', hint: '新聞列表左側紅色日期方塊' },
    },
  },
  {
    title: '字型',
    tokens: {
      '--font-heading': { label: '標題字型 family', type: 'text', hint: "例：'Noto Serif TC', serif" },
      '--font-body': { label: '內文字型 family', type: 'text' },
    },
  },
  {
    title: '機關資訊',
    hint: 'Logo、英文名、聯絡方式。會出現在 header / footer。',
    tokens: {
      logo_url: { label: 'Logo URL', type: 'text' },
      favicon_url: { label: 'Favicon URL', type: 'text' },
      en_name: { label: '英文機關名', type: 'text', hint: '例：DEPARTMENT OF CULTURAL AFFAIRS' },
      en_org: { label: '英文上級機關名', type: 'text', hint: '例：TAIPEI CITY GOVERNMENT' },
      address: { label: '地址', type: 'text' },
      phone: { label: '聯絡電話', type: 'text' },
      service_hours: { label: '服務時間', type: 'text' },
      email: { label: '聯絡信箱', type: 'text' },
    },
  },
  {
    title: '第三方整合',
    tokens: {
      ga_id: { label: 'Google Analytics ID', type: 'text', hint: '例：G-XXXXXXXX' },
    },
  },
];

export default function SettingsPage() {
  const { tenant } = useAuth();
  const [config, setConfig] = useState<BrandConfig>({
    name: '',
    brandTokens: {},
    reviewRequired: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await apiGet<{ data: BrandConfig }>('/tenant/config', { tenant });
      setConfig({
        name: res.data.name ?? '',
        brandTokens: res.data.brandTokens ?? {},
        reviewRequired: res.data.reviewRequired ?? true,
      });
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }

  function updateToken(key: string, value: string) {
    setConfig((prev) => ({
      ...prev,
      brandTokens: { ...prev.brandTokens, [key]: value },
    }));
  }

  function applyPreset(preset: ThemePreset) {
    setConfig((prev) => ({
      ...prev,
      // 用 spread 合併：保留既有自訂值的 key（preset 沒提到的不會被洗掉）；
      // preset 有的 key 一律覆蓋
      brandTokens: { ...prev.brandTokens, ...preset.tokens },
    }));
  }

  // 偵測目前 tokens 是否完全符合某個 preset（用於高亮選中的）
  function detectActivePreset(): string | null {
    for (const p of THEME_PRESETS) {
      const allMatch = Object.entries(p.tokens).every(
        ([k, v]) => config.brandTokens[k] === v
      );
      if (allMatch) return p.id;
    }
    return null;
  }
  const activePresetId = detectActivePreset();

  async function handleSave() {
    setSaving(true);
    try {
      await apiPut('/tenant/config', {
        name: config.name,
        brandTokens: config.brandTokens,
        reviewRequired: config.reviewRequired,
      }, { tenant });
      setSaved(true);
      setPreviewKey((k) => k + 1);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main data-gov-main style={styles.main}><div style={styles.loading}>載入中...</div></main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main data-gov-main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>版型設定</h1>
            <p style={styles.subtitle}>調整局處品牌外觀與功能設定</p>
          </div>
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? '儲存中...' : saved ? '✓ 已儲存' : '儲存設定'}
          </button>
        </header>

        {/* Theme presets — 一鍵套色 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>預設主題</h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 12px' }}>
            選一組整套套用。套用後仍可在下方分組微調。需按「儲存設定」才會生效。
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {THEME_PRESETS.map((p) => {
              const active = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  style={{
                    background: 'white',
                    border: active
                      ? '2px solid var(--color-brand)'
                      : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    padding: 14,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-body)',
                    transition: 'border-color 0.15s, transform 0.15s',
                    position: 'relative',
                  }}
                  className="gov-preset-card"
                >
                  {/* 色塊 */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginBottom: 10,
                      height: 36,
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {p.swatch.map((c, i) => (
                      <div key={i} style={{ flex: 1, background: c }} />
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      marginBottom: 2,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    {p.description}
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
                      ✓ 已選
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <style>{`
            .gov-preset-card:hover {
              border-color: var(--color-brand) !important;
              transform: translateY(-2px);
            }
          `}</style>
        </div>

        {/* Basic settings */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>基本設定</h2>
          <div style={styles.card}>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>局處名稱</label>
              <input
                value={config.name}
                onChange={(e) => setConfig((p) => ({ ...p, name: e.target.value }))}
                style={styles.fieldInput}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.fieldLabel}>啟用審核流程</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setConfig((p) => ({ ...p, reviewRequired: !p.reviewRequired }))}
                  style={{
                    ...styles.toggle,
                    background: config.reviewRequired ? 'var(--color-brand)' : 'var(--color-border)',
                  }}
                >
                  <div style={{
                    ...styles.toggleKnob,
                    transform: config.reviewRequired ? 'translateX(20px)' : 'translateX(2px)',
                  }} />
                </button>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {config.reviewRequired ? '已啟用（草稿需送審才能發布）' : '已關閉（編輯可直接發布）'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand token groups */}
        {tokenGroups.map((group) => (
          <div key={group.title} style={styles.section}>
            <h2 style={styles.sectionTitle}>{group.title}</h2>
            {group.hint && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 12px' }}>
                {group.hint}
              </p>
            )}
            <div style={styles.card}>
              {Object.entries(group.tokens).map(([key, meta]) => (
                <div key={key} style={styles.field}>
                  <label style={styles.fieldLabel}>
                    {meta.label}
                    {meta.hint && (
                      <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--color-text-muted)', fontSize: 11 }}>
                        — {meta.hint}
                      </span>
                    )}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {meta.type === 'color' && (
                      <input
                        type="color"
                        value={normalizeColor(config.brandTokens[key])}
                        onChange={(e) => updateToken(key, e.target.value)}
                        style={styles.colorPicker}
                      />
                    )}
                    <input
                      value={config.brandTokens[key] ?? ''}
                      onChange={(e) => updateToken(key, e.target.value)}
                      placeholder={key}
                      style={{
                        ...styles.fieldInput,
                        flex: 1,
                        fontFamily: meta.type === 'text' ? 'var(--font-body)' : 'var(--font-mono)',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Preview */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>色彩預覽</h2>
          <div style={styles.previewCard}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
              }}
            >
              <PreviewSwatch
                label="主色"
                color={config.brandTokens['--color-brand-primary'] ?? '#0C5299'}
              />
              <PreviewSwatch
                label="輔色"
                color={config.brandTokens['--color-brand-secondary'] ?? '#E8F0F8'}
              />
              <PreviewSwatch
                label="強調"
                color={config.brandTokens['--color-brand-accent'] ?? '#0C5299'}
              />
              <PreviewSwatch
                label="頁尾"
                color={config.brandTokens['--color-footer-bg'] ?? '#1F2937'}
                lightText
              />
            </div>
            <div
              style={{
                marginTop: 12,
                padding: '14px 16px',
                background: config.brandTokens['--color-bg-alt'] ?? '#F8FAFB',
                color: config.brandTokens['--color-text'] ?? '#1A1D23',
                borderRadius: 8,
                border: `1px solid ${config.brandTokens['--color-border'] ?? '#E2E8F0'}`,
                fontSize: 14,
              }}
            >
              米色區塊預覽（次要 section / 滿意度調查 / 統計數字 用）
            </div>
          </div>
        </div>
      </main>

      <PreviewPane
        tenant={tenant}
        refreshKey={previewKey}
        draft={{ brandTokens: config.brandTokens }}
      />
    </div>
  );
}

/** color picker 不接受 rgb/var()，只吃 #hex；不是 hex 給個預設值避免 React warning */
function normalizeColor(v: string | undefined): string {
  if (!v) return '#000000';
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return '#' + v.slice(1).split('').map((c) => c + c).join('');
  }
  return '#000000';
}

function PreviewSwatch({ label, color, lightText = false }: { label: string; color: string; lightText?: boolean }) {
  return (
    <div
      style={{
        height: 64,
        borderRadius: 8,
        background: color,
        color: lightText ? '#FFFFFF' : '#1A1D23',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        border: '1px solid var(--color-border)',
      }}
    >
      <div>{label}</div>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.8 }}>{color}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { marginLeft: 240, flex: 1, padding: '32px 40px', minHeight: '100vh' },
  loading: { padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' },
  subtitle: { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 },
  saveBtn: {
    padding: '10px 24px', background: 'var(--color-brand)', color: 'white', border: 'none',
    borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' },
  card: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    padding: '20px', boxShadow: 'var(--shadow-sm)',
  },
  field: { marginBottom: 16 },
  fieldLabel: {
    display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 6,
  },
  fieldInput: {
    width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6,
    fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
  },
  colorPicker: {
    width: 36, height: 36, padding: 0, border: '2px solid var(--color-border)', borderRadius: 6,
    cursor: 'pointer', background: 'none',
  },
  toggle: {
    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
    position: 'relative', transition: 'background 0.2s',
  },
  toggleKnob: {
    width: 20, height: 20, borderRadius: '50%', background: 'white',
    position: 'absolute', top: 2, transition: 'transform 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  previewCard: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    padding: '20px', boxShadow: 'var(--shadow-sm)',
  },
};
