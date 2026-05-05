'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface TenantItem {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  memberCount: number;
  reviewRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TenantsPage() {
  const { user, tenant } = useAuth();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // Create form state
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState('');

  const isSuperAdmin = user?.isSuperAdmin;

  useEffect(() => {
    if (isSuperAdmin) loadTenants();
  }, [isSuperAdmin]);

  async function loadTenants() {
    try {
      const res = await apiGet<{ data: TenantItem[] }>('/tenant/all', { tenant });
      setTenants(res.data ?? []);
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newSlug.trim() || !newName.trim()) {
      alert('Slug 與名稱為必填');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(newSlug)) {
      alert('Slug 只能包含小寫字母、數字和底線');
      return;
    }
    try {
      await apiPost('/tenant', {
        slug: newSlug.trim(),
        name: newName.trim(),
        domain: newDomain.trim() || undefined,
      }, { tenant });
      setShowCreate(false);
      setNewSlug('');
      setNewName('');
      setNewDomain('');
      await loadTenants();
    } catch (err: any) {
      alert('建立失敗：' + err.message);
    }
  }

  function startEdit(t: TenantItem) {
    setEditingSlug(t.slug);
    setEditName(t.name);
    setEditDomain(t.domain ?? '');
  }

  async function handleSaveEdit() {
    if (!editingSlug || !editName.trim()) return;
    try {
      await apiPatch(`/tenant/${editingSlug}`, {
        name: editName.trim(),
        domain: editDomain.trim() || undefined,
      }, { tenant });
      setEditingSlug(null);
      await loadTenants();
    } catch (err: any) {
      alert('更新失敗：' + err.message);
    }
  }

  if (!isSuperAdmin) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main data-gov-main style={styles.main}>
          <div style={styles.forbidden}>
            <div style={styles.forbiddenIcon}>🔒</div>
            <h2 style={styles.forbiddenTitle}>權限不足</h2>
            <p style={styles.forbiddenDesc}>租戶管理僅限超級管理員操作</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main data-gov-main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>租戶管理</h1>
            <p style={styles.subtitle}>管理平台上所有局處租戶</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} style={styles.createBtn}>
            + 新增租戶
          </button>
        </header>

        {/* Create form */}
        {showCreate && (
          <div style={styles.formPanel}>
            <h3 style={styles.formTitle}>建立新租戶</h3>
            <div style={styles.formGrid}>
              <div style={styles.formField}>
                <label style={styles.label}>Slug（識別碼）*</label>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="例如：health、edu、fire"
                  style={styles.input}
                />
                <span style={styles.hint}>小寫英文、數字、底線，建立後無法變更</span>
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>名稱 *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：衛生局"
                  style={styles.input}
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>網域</label>
                <input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="例如：health.gov.taipei"
                  style={styles.input}
                />
                <span style={styles.hint}>選填，用於正式環境的子網域識別</span>
              </div>
            </div>
            <div style={styles.formActions}>
              <button onClick={() => setShowCreate(false)} style={styles.cancelBtn}>取消</button>
              <button onClick={handleCreate} style={styles.submitBtn}>建立租戶</button>
            </div>
          </div>
        )}

        {/* Tenant list */}
        {loading ? (
          <div style={styles.empty}>載入中...</div>
        ) : tenants.length === 0 ? (
          <div style={styles.empty}>尚無租戶</div>
        ) : (
          <div style={styles.grid}>
            {tenants.map((t) => (
              <div key={t.slug} style={styles.card}>
                {editingSlug === t.slug ? (
                  /* Edit mode */
                  <div>
                    <div style={styles.cardSlug}>{t.slug}</div>
                    <div style={{ marginTop: 8 }}>
                      <label style={styles.label}>名稱</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <label style={styles.label}>網域</label>
                      <input
                        value={editDomain}
                        onChange={(e) => setEditDomain(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button onClick={() => setEditingSlug(null)} style={styles.cancelBtn}>取消</button>
                      <button onClick={handleSaveEdit} style={styles.submitBtn}>儲存</button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <div style={styles.cardHeader}>
                      <div style={styles.cardIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect width="24" height="24" rx="5" fill="var(--color-brand)" opacity="0.15" />
                          <path d="M6 8h12v1.2H6zm0 2.5h10v1.2H6zm0 2.5h7v1.2H6z" fill="var(--color-brand)" />
                        </svg>
                      </div>
                      <button onClick={() => startEdit(t)} style={styles.editBtn}>
                        編輯
                      </button>
                    </div>
                    <h3 style={styles.cardName}>{t.name}</h3>
                    <div style={styles.cardSlug}>{t.slug}</div>
                    {t.domain && <div style={styles.cardDomain}>{t.domain}</div>}
                    <div style={styles.cardMeta}>
                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>成員</span>
                        <span style={styles.metaValue}>{t.memberCount} 人</span>
                      </div>
                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>審核</span>
                        <span style={styles.metaValue}>{t.reviewRequired ? '啟用' : '關閉'}</span>
                      </div>
                      <div style={styles.metaItem}>
                        <span style={styles.metaLabel}>建立時間</span>
                        <span style={styles.metaValue}>
                          {new Date(t.createdAt).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { marginLeft: 240, flex: 1, padding: '32px 40px', minHeight: '100vh' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' },
  subtitle: { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 },
  createBtn: {
    padding: '10px 20px', background: 'var(--color-brand)', color: 'white', border: 'none',
    borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },

  // Create / Edit form
  formPanel: {
    marginBottom: 24, padding: '24px', background: 'white',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-sm)',
  },
  formTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  formField: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' },
  input: {
    padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6,
    fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
  },
  hint: { fontSize: 11, color: 'var(--color-text-muted)' },
  formActions: { display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 6, fontSize: 13, color: 'var(--color-text-muted)', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  submitBtn: {
    padding: '8px 16px', background: 'var(--color-brand)', color: 'white', border: 'none',
    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },

  // Card grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    padding: '20px', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow 0.15s',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardIcon: {},
  editBtn: {
    padding: '4px 10px', background: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 4, fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  cardName: { fontSize: 18, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 },
  cardSlug: {
    display: 'inline-block', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-brand)',
    background: 'var(--color-brand-light)', padding: '2px 8px', borderRadius: 4, marginBottom: 4,
  },
  cardDomain: { fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 },
  cardMeta: {
    display: 'flex', gap: 16, marginTop: 16, paddingTop: 12,
    borderTop: '1px solid var(--color-border)',
  },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  metaLabel: { fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 },
  metaValue: { fontSize: 13, fontWeight: 500, color: 'var(--color-text)' },

  // Empty / Forbidden
  empty: { padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
  forbidden: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  forbiddenIcon: { fontSize: 48, marginBottom: 16 },
  forbiddenTitle: { fontSize: 20, fontWeight: 600, marginBottom: 8 },
  forbiddenDesc: { fontSize: 14, color: 'var(--color-text-muted)' },
};
