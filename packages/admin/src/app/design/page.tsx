'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { PreviewPane } from '@/components/PreviewPane';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPut } from '@/lib/api';
import type { HomepageConfig, HeroConfig } from '@gov/shared';

const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3002';

export default function DesignPage() {
  const { tenant } = useAuth();
  const [config, setConfig] = useState<HomepageConfig>({
    sections: {},
    heroSlides: [],
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
      const res = await apiGet<{ data: any }>('/tenant/config', { tenant });
      setConfig(res.data.homepageConfig || { sections: {}, heroSlides: [] });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // 讀取目前的 tenant 完整 config，只更新 homepageConfig
      const current = await apiGet<{ data: any }>('/tenant/config', { tenant });
      await apiPut('/tenant/config', {
        ...current.data,
        homepageConfig: config,
      }, { tenant });
      
      setSaved(true);
      setPreviewKey(k => k + 1);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const toggleSection = (key: keyof NonNullable<HomepageConfig['sections']>) => {
    setConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: !prev.sections?.[key]
      }
    }));
  };

  const updateHero = (index: number, fields: Partial<HeroConfig>) => {
    const newSlides = [...(config.heroSlides || [])];
    if (newSlides[index]) {
      newSlides[index] = { ...newSlides[index], ...fields };
      setConfig(prev => ({ ...prev, heroSlides: newSlides }));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={styles.main}>載入中...</main>
    </div>
  );

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>首頁設計</h1>
            <p style={styles.subtitle}>配置前台首頁模組與視覺內容</p>
          </div>
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? '儲存中...' : saved ? '✓ 已儲存' : '發布設計'}
          </button>
        </header>

        {/* 模組開關 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>模組配置</h2>
          <div style={styles.grid}>
            {SECTION_LABELS.map(([key, label]) => (
              <div key={key} style={styles.toggleCard}>
                <span style={styles.toggleLabel}>{label}</span>
                <button
                  onClick={() => toggleSection(key as any)}
                  style={{
                    ...styles.toggle,
                    background: config.sections?.[key as keyof typeof config.sections] !== false ? 'var(--color-brand)' : '#cbd5e1'
                  }}
                >
                  <div style={{
                    ...styles.toggleKnob,
                    transform: config.sections?.[key as keyof typeof config.sections] !== false ? 'translateX(20px)' : 'translateX(2px)'
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Hero 編輯 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Hero 主視覺編輯</h2>
          {(config.heroSlides || []).map((slide, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.field}>
                <label style={styles.label}>主標題</label>
                <input
                  value={slide.title}
                  onChange={e => updateHero(i, { title: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>副標題</label>
                <input
                  value={slide.subtitle || ''}
                  onChange={e => updateHero(i, { subtitle: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>背景圖片 URL</label>
                <input
                  value={slide.imageUrl || ''}
                  onChange={e => updateHero(i, { imageUrl: e.target.value })}
                  style={styles.input}
                  placeholder="/taiwan_gov_hero.png"
                />
              </div>
            </div>
          ))}
          {(!config.heroSlides || config.heroSlides.length === 0) && (
            <button 
              onClick={() => setConfig(p => ({ ...p, heroSlides: [{ title: '新標題', subtitle: '新副標' }] }))}
              style={styles.addBtn}
            >
              + 新增 Hero 投影片
            </button>
          )}
        </div>
      </main>

      <PreviewPane 
        tenant={tenant} 
        refreshKey={previewKey}
        draft={{ homepageConfig: config }}
      />
    </div>
  );
}

const SECTION_LABELS = [
  ['hero', '主視覺輪播'],
  ['searchHero', '大搜尋框'],
  ['news', '最新消息'],
  ['events', '活動精選'],
  ['quickServices', '快速服務'],
  ['business', '業務專區'],
  ['progress', '申辦進度'],
  ['map', '資源地圖'],
  ['stats', '統計數據'],
  ['socialFeed', '社群動態'],
];

const styles: Record<string, React.CSSProperties> = {
  main: { marginLeft: 240, flex: 1, padding: '32px 40px', minHeight: '100vh', background: '#f8fafc' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { fontSize: 14, color: '#64748b' },
  saveBtn: { padding: '10px 24px', background: '#0C5299', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  toggleCard: { background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 14, fontWeight: 500 },
  toggle: { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: '0.2s' },
  toggleKnob: { width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  card: { background: 'white', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#475569' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none' },
  addBtn: { width: '100%', padding: 12, background: 'white', border: '2px dashed #e2e8f0', borderRadius: 12, color: '#64748b', cursor: 'pointer' },
};
