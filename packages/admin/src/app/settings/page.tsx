'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPut } from '@/lib/api';

interface BrandConfig {
  name: string;
  brandTokens: Record<string, string>;
  reviewRequired: boolean;
}

const defaultTokens: Record<string, { label: string; type: 'color' | 'text' }> = {
  '--color-brand-primary': { label: '主色', type: 'color' },
  '--color-brand-secondary': { label: '輔色', type: 'color' },
  '--font-heading': { label: '標題字型', type: 'text' },
  'logo_url': { label: 'Logo URL', type: 'text' },
  'favicon_url': { label: 'Favicon URL', type: 'text' },
  'ga_id': { label: 'Google Analytics ID', type: 'text' },
  'footer_text': { label: '頁尾文字', type: 'text' },
  'footer_phone': { label: '聯絡電話', type: 'text' },
  'footer_address': { label: '地址', type: 'text' },
};

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

  async function handleSave() {
    setSaving(true);
    try {
      await apiPut('/tenant/config', {
        name: config.name,
        brandTokens: config.brandTokens,
        reviewRequired: config.reviewRequired,
      }, { tenant });
      setSaved(true);
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
        <main style={styles.main}><div style={styles.loading}>載入中...</div></main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>版型設定</h1>
            <p style={styles.subtitle}>調整局處品牌外觀與功能設定</p>
          </div>
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? '儲存中...' : saved ? '✓ 已儲存' : '儲存設定'}
          </button>
        </header>

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

        {/* Brand tokens */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>品牌 Design Token</h2>
          <div style={styles.card}>
            {Object.entries(defaultTokens).map(([key, meta]) => (
              <div key={key} style={styles.field}>
                <label style={styles.fieldLabel}>{meta.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {meta.type === 'color' && (
                    <input
                      type="color"
                      value={config.brandTokens[key] ?? '#0C5299'}
                      onChange={(e) => updateToken(key, e.target.value)}
                      style={styles.colorPicker}
                    />
                  )}
                  <input
                    value={config.brandTokens[key] ?? ''}
                    onChange={(e) => updateToken(key, e.target.value)}
                    placeholder={key}
                    style={{ ...styles.fieldInput, flex: 1, fontFamily: meta.type === 'text' ? 'var(--font-body)' : 'var(--font-mono)', fontSize: 13 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>色彩預覽</h2>
          <div style={styles.previewCard}>
            <div style={{
              height: 60, borderRadius: 8,
              background: `linear-gradient(135deg, ${config.brandTokens['--color-brand-primary'] ?? '#0C5299'}, ${config.brandTokens['--color-brand-secondary'] ?? '#E8F0F8'})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 16,
            }}>
              {config.name || '局處名稱'}
            </div>
          </div>
        </div>
      </main>
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
