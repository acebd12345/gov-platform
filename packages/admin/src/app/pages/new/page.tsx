'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { apiPost } from '@/lib/api';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

export default function NewPageEditor() {
  const router = useRouter();
  const { tenant } = useAuth();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('news');
  const [bodyJson, setBodyJson] = useState<Record<string, unknown>>({});
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(val));
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      alert('請填寫標題和 Slug');
      return;
    }
    setSaving(true);
    try {
      const res = await apiPost<{ data: { id: string } }>('/content/pages', {
        slug,
        type,
        title,
        bodyJson,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDesc || undefined,
      }, { tenant });

      router.push(`/pages/${res.data.id}`);
    } catch (err: any) {
      alert('儲存失敗：' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <button onClick={() => router.back()} style={styles.backBtn}>← 返回</button>
          <div style={styles.headerActions}>
            <button onClick={handleSave} disabled={saving} style={styles.saveDraftBtn}>
              {saving ? '儲存中...' : '儲存草稿'}
            </button>
          </div>
        </header>

        <div style={styles.editorLayout}>
          <div style={styles.editorMain}>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="請輸入頁面標題..."
              style={styles.titleInput}
            />
            <RichEditor content={bodyJson} onChange={setBodyJson} />
          </div>

          <div style={styles.editorSidebar}>
            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>頁面設定</h3>
              <label style={styles.fieldLabel}>
                <span style={styles.fieldName}>頁面類型</span>
                <select value={type} onChange={(e) => setType(e.target.value)} style={styles.select}>
                  <option value="news">最新消息</option>
                  <option value="service">市民服務</option>
                  <option value="about">關於我們</option>
                  <option value="custom">自訂頁面</option>
                </select>
              </label>
              <label style={styles.fieldLabel}>
                <span style={styles.fieldName}>URL Slug</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  style={styles.fieldInput}
                  placeholder="page-url-slug"
                />
                <span style={styles.fieldHint}>/{slug || 'page-url-slug'}</span>
              </label>
            </div>

            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>SEO 設定</h3>
              <label style={styles.fieldLabel}>
                <span style={styles.fieldName}>SEO 標題</span>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  style={styles.fieldInput}
                  placeholder="搜尋引擎顯示的標題"
                />
              </label>
              <label style={styles.fieldLabel}>
                <span style={styles.fieldName}>SEO 描述</span>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  style={{ ...styles.fieldInput, height: 80, resize: 'vertical' as const }}
                  placeholder="搜尋引擎顯示的描述文字"
                />
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

const styles: Record<string, React.CSSProperties> = {
  main: { marginLeft: 240, flex: 1, padding: '24px 32px', minHeight: '100vh' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border)',
  },
  backBtn: {
    background: 'transparent', border: 'none', fontSize: 14, color: 'var(--color-text-muted)',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  headerActions: { display: 'flex', gap: 8 },
  saveDraftBtn: {
    padding: '8px 16px', background: 'var(--color-brand)', border: 'none',
    borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, color: 'white',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  editorLayout: { display: 'flex', gap: 24 },
  editorMain: { flex: 1 },
  titleInput: {
    width: '100%', padding: '16px 20px', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)',
    outline: 'none', background: 'white', marginBottom: 16,
  },
  editorSidebar: { width: 300, display: 'flex', flexDirection: 'column' as const, gap: 16 },
  panel: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    padding: '16px', boxShadow: 'var(--shadow-sm)',
  },
  panelTitle: {
    fontSize: 14, fontWeight: 600, marginBottom: 12, paddingBottom: 8,
    borderBottom: '1px solid var(--color-border)',
  },
  fieldLabel: { display: 'flex', flexDirection: 'column' as const, gap: 4, marginBottom: 12 },
  fieldName: { fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)' },
  fieldInput: {
    padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6,
    fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none',
  },
  select: {
    padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 6,
    fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', background: 'white',
  },
  fieldHint: { fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' },
};
