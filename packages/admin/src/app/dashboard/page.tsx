'use client';

import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user, tenant } = useAuth();

  const stats = [
    { label: '已發布頁面', value: '—', color: 'var(--color-success)' },
    { label: '待審件數', value: '—', color: 'var(--color-warning)' },
    { label: '草稿數量', value: '—', color: 'var(--color-brand)' },
    { label: '媒體檔案', value: '—', color: 'var(--color-text-muted)' },
  ];

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>儀表板</h1>
            <p style={styles.subtitle}>歡迎回來，{user?.email ?? '管理員'}</p>
          </div>
        </header>

        <div style={styles.statsGrid}>
          {stats.map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ ...styles.statDot, background: s.color }} />
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>快速操作</h2>
          <div style={styles.actionsGrid}>
            <a href="/pages/new" style={styles.actionCard}>
              <span style={styles.actionIcon}>+</span>
              <span>新增頁面</span>
            </a>
            <a href="/media" style={styles.actionCard}>
              <span style={styles.actionIcon}>↑</span>
              <span>上傳媒體</span>
            </a>
            <a href="/pages" style={styles.actionCard}>
              <span style={styles.actionIcon}>✎</span>
              <span>管理頁面</span>
            </a>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>系統資訊</h2>
          <div style={styles.infoCard}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>目前租戶</span>
              <span style={styles.infoValue}>{tenant}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>角色</span>
              <span style={styles.infoValue}>{user?.isSuperAdmin ? '超級管理員' : user?.role}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>API 版本</span>
              <span style={styles.infoValue}>v1</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>平台版本</span>
              <span style={styles.infoValue}>0.1.0</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    marginLeft: 240,
    flex: 1,
    padding: '32px 40px',
    minHeight: '100vh',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    color: 'var(--color-text)',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--color-text-muted)',
    marginTop: 4,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: 'white',
    borderRadius: 'var(--radius)',
    padding: '20px',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--color-text)',
    fontFamily: 'var(--font-mono)',
  },
  statLabel: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
    marginTop: 4,
  },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 12,
  },
  actionsGrid: {
    display: 'flex',
    gap: 12,
  },
  actionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 20px',
    background: 'white',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-brand)',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    boxShadow: 'var(--shadow-sm)',
  },
  actionIcon: { fontSize: 18, fontWeight: 700 },
  infoCard: {
    background: 'white',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    padding: '4px 0',
    boxShadow: 'var(--shadow-sm)',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 20px',
    borderBottom: '1px solid var(--color-border)',
  },
  infoLabel: { fontSize: 13, color: 'var(--color-text-muted)' },
  infoValue: { fontSize: 13, fontWeight: 500, color: 'var(--color-text)' },
};
