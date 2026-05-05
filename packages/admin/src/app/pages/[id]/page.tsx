'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPatch, apiPut } from '@/lib/api';

const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });

export default function EditPageEditor() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  const { tenant } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [bodyJson, setBodyJson] = useState<Record<string, unknown>>({});
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  useEffect(() => {
    loadPage();
  }, [pageId]);

  async function loadPage() {
    try {
      const res = await apiGet<{ data: any }>(`/content/pages/${pageId}`, { tenant });
      const p = res.data;
      setPage(p);
      setTitle(p.currentVersion?.title ?? '');
      setBodyJson(p.currentVersion?.bodyJson ?? {});
      setSeoTitle(p.currentVersion?.seoTitle ?? '');
      setSeoDesc(p.currentVersion?.seoDescription ?? '');
    } catch (err: any) {
      alert('載入失敗：' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiPatch(`/content/pages/${pageId}`, {
        title,
        bodyJson,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDesc || undefined,
        changeSummary: changeSummary || undefined,
      }, { tenant });

      setChangeSummary('');
      alert('已儲存');
      await loadPage();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    try {
      await apiPut(`/content/pages/${pageId}/submit`, undefined, { tenant });
      alert('已送審');
      router.push('/pages');
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main data-gov-main style={styles.main}><div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>載入中...</div></main>
      </div>
    );
  }

  const isDraft = page?.status === 'draft';
  const statusLabel: Record<string, string> = {
    draft: '草稿', pending: '待審', approved: '已核准', published: '已發布', archived: '已下線',
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main data-gov-main style={styles.main}>
        <header style={styles.header}>
          <button onClick={() => router.push('/pages')} style={styles.backBtn}>← 返回列表</button>
          <div style={styles.headerActions}>
            {isDraft && (
              <>
                <button onClick={handleSave} disabled={saving} style={styles.saveDraftBtn}>
                  {saving ? '儲存中...' : '儲存草稿'}
                </button>
                <button onClick={handleSubmit} style={styles.submitBtn}>送審</button>
              </>
            )}
          </div>
        </header>

        {/* Status bar */}
        <div style={styles.statusBar}>
          <span>狀態：<strong>{statusLabel[page?.status] ?? page?.status}</strong></span>
          <span style={styles.dot}>·</span>
          <span>Slug：<code style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>/{page?.slug}</code></span>
          <span style={styles.dot}>·</span>
          <span>類型：{page?.type}</span>
        </div>

        <div style={styles.editorLayout}>
          <div style={styles.editorMain}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="頁面標題"
              style={styles.titleInput}
              disabled={!isDraft}
            />
            <RichEditor content={bodyJson} onChange={setBodyJson} disabled={!isDraft} />
          </div>

          <div style={styles.editorSidebar}>
            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>SEO 設定</h3>
              <label style={styles.fieldLabel}>
                <span style={styles.fieldName}>SEO 標題</span>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  style={styles.fieldInput}
                  disabled={!isDraft}
                />
              </label>
              <label style={styles.fieldLabel}>
                <span style={styles.fieldName}>SEO 描述</span>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  style={{ ...styles.fieldInput, height: 80, resize: 'vertical' as const }}
                  disabled={!isDraft}
                />
              </label>
            </div>

            {isDraft && (
              <div style={styles.panel}>
                <h3 style={styles.panelTitle}>變更摘要</h3>
                <input
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="簡述本次修改內容"
                  style={styles.fieldInput}
                />
              </div>
            )}

            <div style={styles.panel}>
              <h3 style={styles.panelTitle}>版本資訊</h3>
              <p style={styles.infoText}>
                版本：{page?.currentVersion?.versionNumber ?? 1}
              </p>
              <p style={styles.infoText}>
                建立時間：{page?.createdAt ? new Date(page.createdAt).toLocaleString('zh-TW') : '—'}
              </p>
              <a href={`/pages/${pageId}/versions`} style={styles.linkBtn}>查看版本歷史 →</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { marginLeft: 240, flex: 1, padding: '24px 32px', minHeight: '100vh' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--color-border)',
  },
  backBtn: { background: 'transparent', border: 'none', fontSize: 14, color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  headerActions: { display: 'flex', gap: 8 },
  saveDraftBtn: {
    padding: '8px 16px', background: 'white', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  submitBtn: {
    padding: '8px 16px', background: 'var(--color-brand)', border: 'none',
    borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, color: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  statusBar: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16,
  },
  dot: { color: 'var(--color-border)' },
  editorLayout: { display: 'flex', gap: 24 },
  editorMain: { flex: 1 },
  titleInput: {
    width: '100%', padding: '14px 18px', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)', fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)',
    outline: 'none', background: 'white', marginBottom: 16,
  },
  editorSidebar: { width: 280, display: 'flex', flexDirection: 'column' as const, gap: 16 },
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
    fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', width: '100%',
  },
  infoText: { fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 },
  linkBtn: {
    display: 'inline-block', marginTop: 8, fontSize: 13, color: 'var(--color-brand)',
    textDecoration: 'none', fontWeight: 500,
  },
};
