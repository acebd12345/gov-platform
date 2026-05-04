'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';

interface Version {
  id: string;
  pageId: string;
  versionNumber: number;
  title: string;
  bodyJson: Record<string, unknown>;
  seoTitle: string | null;
  seoDescription: string | null;
  changeSummary: string | null;
  createdBy: string;
  createdAt: string;
}

export default function VersionHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  const { tenant } = useAuth();

  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [selectedB, setSelectedB] = useState<number | null>(null);

  useEffect(() => {
    loadVersions();
  }, [pageId]);

  async function loadVersions() {
    try {
      const res = await apiGet<{ data: Version[] }>(`/content/pages/${pageId}/versions`, { tenant });
      const v = res.data ?? [];
      setVersions(v);
      if (v.length >= 2) {
        setSelectedA(v[1].versionNumber);
        setSelectedB(v[0].versionNumber);
      } else if (v.length === 1) {
        setSelectedB(v[0].versionNumber);
      }
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }

  const versionA = versions.find((v) => v.versionNumber === selectedA);
  const versionB = versions.find((v) => v.versionNumber === selectedB);

  function renderDiff() {
    if (!versionA && !versionB) return <div style={styles.empty}>請選取版本進行比對</div>;

    const fieldsToCompare = ['title', 'seoTitle', 'seoDescription'] as const;
    const fieldLabels: Record<string, string> = { title: '標題', seoTitle: 'SEO 標題', seoDescription: 'SEO 描述' };

    return (
      <div style={styles.diffPanel}>
        <div style={styles.diffHeader}>
          <span>版本 {selectedA ?? '—'}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>vs</span>
          <span>版本 {selectedB ?? '—'}</span>
        </div>
        {fieldsToCompare.map((field) => {
          const valA = versionA?.[field] ?? '';
          const valB = versionB?.[field] ?? '';
          const changed = valA !== valB;
          return (
            <div key={field} style={styles.diffRow}>
              <div style={styles.diffLabel}>{fieldLabels[field]}</div>
              <div style={styles.diffColumns}>
                <div style={{ ...styles.diffCell, ...(changed ? styles.diffRemoved : {}) }}>
                  {String(valA || '（空）')}
                </div>
                <div style={{ ...styles.diffCell, ...(changed ? styles.diffAdded : {}) }}>
                  {String(valB || '（空）')}
                </div>
              </div>
            </div>
          );
        })}
        <div style={styles.diffRow}>
          <div style={styles.diffLabel}>內容 (JSON)</div>
          <div style={styles.diffColumns}>
            <pre style={styles.diffPre}>{JSON.stringify(versionA?.bodyJson ?? {}, null, 2)}</pre>
            <pre style={styles.diffPre}>{JSON.stringify(versionB?.bodyJson ?? {}, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <button onClick={() => router.push(`/pages/${pageId}`)} style={styles.backBtn}>← 返回編輯</button>
          <h1 style={styles.title}>版本歷史</h1>
        </header>

        <div style={styles.layout}>
          {/* Version list */}
          <div style={styles.versionList}>
            <div style={styles.listTitle}>所有版本</div>
            {loading ? (
              <div style={styles.empty}>載入中...</div>
            ) : versions.length === 0 ? (
              <div style={styles.empty}>無版本記錄</div>
            ) : (
              versions.map((v) => {
                const isSelectedA = v.versionNumber === selectedA;
                const isSelectedB = v.versionNumber === selectedB;
                return (
                  <div
                    key={v.id}
                    style={{
                      ...styles.versionItem,
                      ...(isSelectedA || isSelectedB ? styles.versionItemSelected : {}),
                    }}
                  >
                    <div style={styles.versionHeader}>
                      <span style={styles.versionNum}>v{v.versionNumber}</span>
                      <span style={styles.versionDate}>
                        {new Date(v.createdAt).toLocaleString('zh-TW')}
                      </span>
                    </div>
                    <div style={styles.versionTitle}>{v.title}</div>
                    {v.changeSummary && (
                      <div style={styles.changeSummary}>{v.changeSummary}</div>
                    )}
                    <div style={styles.versionActions}>
                      <button
                        onClick={() => setSelectedA(v.versionNumber)}
                        style={{ ...styles.compareBtn, ...(isSelectedA ? styles.compareBtnActive : {}) }}
                      >
                        A
                      </button>
                      <button
                        onClick={() => setSelectedB(v.versionNumber)}
                        style={{ ...styles.compareBtn, ...(isSelectedB ? styles.compareBtnActiveB : {}) }}
                      >
                        B
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Diff viewer */}
          <div style={styles.diffArea}>
            {renderDiff()}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { marginLeft: 240, flex: 1, padding: '24px 32px', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  backBtn: { background: 'transparent', border: 'none', fontSize: 14, color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' },
  title: { fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' },
  layout: { display: 'flex', gap: 24 },
  versionList: {
    width: 280, background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-sm)', overflow: 'hidden', alignSelf: 'flex-start',
  },
  listTitle: {
    padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
  },
  versionItem: {
    padding: '12px 16px', borderBottom: '1px solid var(--color-border)', cursor: 'default',
  },
  versionItemSelected: { background: 'var(--color-brand-light)' },
  versionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  versionNum: { fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-brand)' },
  versionDate: { fontSize: 11, color: 'var(--color-text-muted)' },
  versionTitle: { fontSize: 13, fontWeight: 500, marginBottom: 2 },
  changeSummary: { fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' },
  versionActions: { display: 'flex', gap: 4, marginTop: 6 },
  compareBtn: {
    width: 24, height: 24, borderRadius: 4, border: '1px solid var(--color-border)',
    background: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)',
  },
  compareBtnActive: { background: '#FEF2F2', borderColor: '#FECACA', color: 'var(--color-danger)' },
  compareBtnActiveB: { background: '#ECFDF5', borderColor: '#A7F3D0', color: 'var(--color-success)' },
  diffArea: { flex: 1 },
  diffPanel: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
  },
  diffHeader: {
    display: 'flex', justifyContent: 'space-around', padding: '12px 16px',
    borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
    fontSize: 13, fontWeight: 600,
  },
  diffRow: { borderBottom: '1px solid var(--color-border)' },
  diffLabel: {
    padding: '8px 16px', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)',
    background: 'var(--color-surface)',
  },
  diffColumns: { display: 'flex' },
  diffCell: { flex: 1, padding: '10px 16px', fontSize: 13, borderRight: '1px solid var(--color-border)' },
  diffRemoved: { background: '#FEF2F2', color: '#991B1B' },
  diffAdded: { background: '#ECFDF5', color: '#065F46' },
  diffPre: {
    flex: 1, padding: '10px 16px', fontSize: 11, fontFamily: 'var(--font-mono)',
    margin: 0, whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: 300,
    borderRight: '1px solid var(--color-border)',
  },
  empty: { padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
};
