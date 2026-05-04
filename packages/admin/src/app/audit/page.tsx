'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';

interface AuditEntry {
  id: string;
  actorId: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  create: { label: '建立', color: '#059669' },
  update: { label: '更新', color: '#0C5299' },
  publish: { label: '發布', color: '#7C3AED' },
  delete: { label: '刪除', color: '#DC2626' },
  login: { label: '登入', color: '#6B7280' },
};

const resourceLabels: Record<string, string> = {
  page: '頁面',
  media: '媒體',
  tenant_config: '租戶設定',
  user: '使用者',
};

export default function AuditPage() {
  const { tenant } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const res = await apiGet<{ data: AuditEntry[] }>('/tenant/audit', { tenant });
      setLogs(res.data ?? []);
    } catch {
      // API endpoint may not exist yet; use empty array
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filterAction === 'all' ? logs : logs.filter((l) => l.action === filterAction);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>稽核日誌</h1>
            <p style={styles.subtitle}>所有操作記錄，依時間倒序排列</p>
          </div>
        </header>

        {/* Filters */}
        <div style={styles.filters}>
          {[
            { key: 'all', label: '全部' },
            { key: 'create', label: '建立' },
            { key: 'update', label: '更新' },
            { key: 'publish', label: '發布' },
            { key: 'delete', label: '刪除' },
            { key: 'login', label: '登入' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterAction(f.key)}
              style={{
                ...styles.filterBtn,
                ...(filterAction === f.key ? styles.filterBtnActive : {}),
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={styles.tableWrapper}>
          {loading ? (
            <div style={styles.empty}>載入中...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>尚無稽核記錄</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>時間</th>
                  <th style={styles.th}>操作者</th>
                  <th style={styles.th}>動作</th>
                  <th style={styles.th}>資源類型</th>
                  <th style={styles.th}>IP 位址</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const act = actionLabels[log.action] ?? { label: log.action, color: '#6B7280' };
                  return (
                    <tr key={log.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                        {new Date(log.createdAt).toLocaleString('zh-TW')}
                      </td>
                      <td style={styles.td}>{log.actorEmail ?? log.actorId.slice(0, 8)}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, color: act.color, background: act.color + '15', borderColor: act.color + '30' }}>
                          {act.label}
                        </span>
                      </td>
                      <td style={styles.td}>{resourceLabels[log.resourceType] ?? log.resourceType}</td>
                      <td style={{ ...styles.td, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {log.ipAddress ?? '—'}
                      </td>
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
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' },
  subtitle: { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 },
  filters: { display: 'flex', gap: 6, marginBottom: 16 },
  filterBtn: {
    padding: '6px 14px', borderRadius: 20, border: '1px solid var(--color-border)',
    background: 'white', fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)',
    cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  filterBtnActive: { background: 'var(--color-brand)', color: 'white', borderColor: 'var(--color-brand)' },
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
  badge: {
    fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 12,
    display: 'inline-block', border: '1px solid',
  },
  empty: { padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
};
