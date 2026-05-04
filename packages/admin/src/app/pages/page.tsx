'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPut, apiDelete } from '@/lib/api';

interface PageItem {
  id: string;
  slug: string;
  type: string;
  status: string;
  locale: string;
  authorId: string;
  publishAt: string | null;
  createdAt: string;
  updatedAt: string;
  title?: string;
  seoTitle?: string;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#6B7280', bg: '#F3F4F6' },
  pending: { label: '待審', color: '#D97706', bg: '#FFFBEB' },
  approved: { label: '已核准', color: '#059669', bg: '#ECFDF5' },
  published: { label: '已發布', color: '#0C5299', bg: '#E8F0F8' },
  archived: { label: '已下線', color: '#9CA3AF', bg: '#F9FAFB' },
};

const typeMap: Record<string, string> = {
  news: '最新消息',
  service: '市民服務',
  about: '關於我們',
  custom: '自訂頁面',
};

export default function PagesListPage() {
  const { user, tenant } = useAuth();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isChiefOrAbove = user?.role === 'admin' || user?.role === 'editor_in_chief' || user?.isSuperAdmin;

  useEffect(() => {
    loadPages();
  }, []);

  async function loadPages() {
    try {
      const res = await apiGet<{ data: PageItem[] }>('/content/pages?limit=100&all=true', { tenant });
      setPages(res.data ?? []);
    } catch {
      setPages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(pageId: string, action: string, label: string) {
    if (!confirm(`確定要${label}嗎？`)) return;
    setActionLoading(pageId);
    try {
      await apiPut(`/content/pages/${pageId}/${action}`, undefined, { tenant });
      await loadPages();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(pageId: string) {
    if (!confirm('確定要刪除此草稿嗎？此操作無法復原。')) return;
    setActionLoading(pageId);
    try {
      await apiDelete(`/content/pages/${pageId}`, { tenant });
      await loadPages();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredPages = filter === 'all' ? pages : pages.filter((p) => p.status === filter);

  function renderActions(page: PageItem) {
    const isLoading = actionLoading === page.id;
    const btns: React.ReactNode[] = [];

    btns.push(
      <Link key="edit" href={`/pages/${page.id}`} style={styles.actionBtn}>
        編輯
      </Link>
    );

    btns.push(
      <Link key="versions" href={`/pages/${page.id}/versions`} style={styles.actionBtn}>
        版本
      </Link>
    );

    if (page.status === 'draft') {
      btns.push(
        <button key="submit" onClick={() => handleAction(page.id, 'submit', '送審')} disabled={isLoading} style={styles.actionBtnPrimary}>
          送審
        </button>
      );
      if (isChiefOrAbove) {
        btns.push(
          <button key="delete" onClick={() => handleDelete(page.id)} disabled={isLoading} style={styles.actionBtnDanger}>
            刪除
          </button>
        );
      }
    }

    if (page.status === 'pending' && isChiefOrAbove) {
      btns.push(
        <button key="approve" onClick={() => handleAction(page.id, 'approve', '核准')} disabled={isLoading} style={styles.actionBtnSuccess}>
          核准
        </button>
      );
    }

    if (page.status === 'approved' && isChiefOrAbove) {
      btns.push(
        <button key="publish" onClick={() => handleAction(page.id, 'publish', '發布')} disabled={isLoading} style={styles.actionBtnSuccess}>
          發布
        </button>
      );
    }

    if (page.status === 'published' && isChiefOrAbove) {
      btns.push(
        <button key="unpublish" onClick={() => handleAction(page.id, 'unpublish', '下線')} disabled={isLoading} style={styles.actionBtnDanger}>
          下線
        </button>
      );
    }

    return <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{btns}</div>;
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>頁面管理</h1>
            <p style={styles.subtitle}>管理所有頁面內容與審核流程</p>
          </div>
          <Link href="/pages/new" style={styles.createBtn}>+ 新增頁面</Link>
        </header>

        {/* Status flow diagram */}
        <div style={styles.flowDiagram}>
          <span style={styles.flowStep}>草稿</span>
          <span style={styles.flowArrow}>→ 送審 →</span>
          <span style={styles.flowStep}>待審</span>
          <span style={styles.flowArrow}>→ 核准 →</span>
          <span style={styles.flowStep}>已核准</span>
          <span style={styles.flowArrow}>→ 發布 →</span>
          <span style={styles.flowStep}>已發布</span>
          <span style={styles.flowArrow}>→ 下線 →</span>
          <span style={styles.flowStep}>已下線</span>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          {[
            { key: 'all', label: '全部' },
            { key: 'draft', label: '草稿' },
            { key: 'pending', label: '待審' },
            { key: 'approved', label: '已核准' },
            { key: 'published', label: '已發布' },
            { key: 'archived', label: '已下線' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterBtnActive : {}) }}
            >
              {f.label}
              {f.key !== 'all' && (
                <span style={styles.filterCount}>
                  {pages.filter((p) => p.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          {loading ? (
            <div style={styles.empty}>載入中...</div>
          ) : filteredPages.length === 0 ? (
            <div style={styles.empty}>沒有符合條件的頁面</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>標題</th>
                  <th style={styles.th}>類型</th>
                  <th style={styles.th}>狀態</th>
                  <th style={styles.th}>更新時間</th>
                  <th style={{ ...styles.th, width: 220 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => {
                  const status = statusMap[page.status] ?? { label: page.status, color: '#6B7280', bg: '#F3F4F6' };
                  return (
                    <tr key={page.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.pageTitle}>{page.title || page.slug}</div>
                        <div style={styles.pageSlug}>/{page.slug}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.typeBadge}>{typeMap[page.type] ?? page.type}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, color: status.color, background: status.bg }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: 'var(--color-text-muted)', fontSize: 13 }}>
                        {new Date(page.updatedAt).toLocaleString('zh-TW')}
                      </td>
                      <td style={styles.td}>{renderActions(page)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { marginLeft: 240, flex: 1, padding: '32px 40px', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' },
  subtitle: { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 },
  createBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: 'var(--color-brand)', color: 'white', borderRadius: 'var(--radius)',
    fontSize: 14, fontWeight: 600, textDecoration: 'none',
  },
  flowDiagram: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px',
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    marginBottom: 16, fontSize: 12, flexWrap: 'wrap',
  },
  flowStep: { fontWeight: 600, color: 'var(--color-text)' },
  flowArrow: { color: 'var(--color-text-muted)' },
  filters: { display: 'flex', gap: 6, marginBottom: 16 },
  filterBtn: {
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '6px 14px', borderRadius: 20,
    borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-border)',
    background: 'white', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  filterBtnActive: { background: 'var(--color-brand)', color: 'white', borderColor: 'var(--color-brand)' },
  filterCount: { fontSize: 11, opacity: 0.7 },
  tableWrapper: {
    background: 'white', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600,
    color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
  },
  tr: { borderBottom: '1px solid var(--color-border)' },
  td: { padding: '12px 16px', fontSize: 14 },
  pageTitle: { fontWeight: 500, color: 'var(--color-text)' },
  pageSlug: { fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 },
  typeBadge: { fontSize: 12, color: 'var(--color-text-muted)', background: 'var(--color-surface)', padding: '2px 8px', borderRadius: 4 },
  statusBadge: { fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 12, display: 'inline-block' },
  actionBtn: {
    padding: '4px 10px', background: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 4, fontSize: 12, color: 'var(--color-brand)', cursor: 'pointer',
    fontFamily: 'var(--font-body)', textDecoration: 'none', display: 'inline-block',
  },
  actionBtnPrimary: {
    padding: '4px 10px', background: 'var(--color-brand)', border: 'none',
    borderRadius: 4, fontSize: 12, color: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  actionBtnSuccess: {
    padding: '4px 10px', background: 'var(--color-success)', border: 'none',
    borderRadius: 4, fontSize: 12, color: 'white', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  actionBtnDanger: {
    padding: '4px 10px', background: 'transparent', border: '1px solid #FECACA',
    borderRadius: 4, fontSize: 12, color: 'var(--color-danger)', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  empty: { padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
};
