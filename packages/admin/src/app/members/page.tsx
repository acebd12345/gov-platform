'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

interface Member {
  id: string;
  userId: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin: '管理員',
  editor_in_chief: '總編輯',
  editor: '編輯',
  viewer: '檢視者',
};

const roleColors: Record<string, { color: string; bg: string }> = {
  admin: { color: '#DC2626', bg: '#FEF2F2' },
  editor_in_chief: { color: '#7C3AED', bg: '#F5F3FF' },
  editor: { color: '#0C5299', bg: '#E8F0F8' },
  viewer: { color: '#6B7280', bg: '#F3F4F6' },
};

export default function MembersPage() {
  const { tenant } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('editor');

  useEffect(() => {
    loadMembers();
  }, [tenant]);

  async function loadMembers() {
    try {
      const res = await apiGet<{ data: Member[] }>('/tenant/members', { tenant });
      setMembers(res.data ?? []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember() {
    if (!newEmail.trim()) {
      alert('請輸入 Email');
      return;
    }
    try {
      await apiPost('/tenant/members', { email: newEmail.trim(), role: newRole }, { tenant });
      setShowAdd(false);
      setNewEmail('');
      await loadMembers();
    } catch (err: any) {
      alert('新增失敗：' + err.message);
    }
  }

  async function handleChangeRole(userId: string, role: string) {
    try {
      await apiPatch(`/tenant/members/${userId}/role`, { role }, { tenant });
      await loadMembers();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleRemove(userId: string, email: string) {
    if (!confirm(`確定要移除 ${email} 嗎？`)) return;
    try {
      await apiDelete(`/tenant/members/${userId}`, { tenant });
      await loadMembers();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main data-gov-main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>成員管理</h1>
            <p style={styles.subtitle}>管理局處人員與角色權限</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} style={styles.addBtn}>
            + 新增成員
          </button>
        </header>

        {showAdd && (
          <div style={styles.addPanel}>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="輸入使用者 Email"
              style={styles.addInput}
            />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={styles.addSelect}>
              <option value="editor">編輯</option>
              <option value="editor_in_chief">總編輯</option>
              <option value="admin">管理員</option>
              <option value="viewer">檢視者</option>
            </select>
            <button style={styles.addConfirmBtn} onClick={handleAddMember}>
              新增
            </button>
          </div>
        )}

        {/* Role legend */}
        <div style={styles.legend}>
          <span style={styles.legendLabel}>角色說明：</span>
          <span><strong>管理員</strong> — 局處設定、成員管理</span>
          <span style={styles.legendDot}>·</span>
          <span><strong>總編輯</strong> — 審核、發布、分類管理</span>
          <span style={styles.legendDot}>·</span>
          <span><strong>編輯</strong> — 建立/編輯草稿、送審</span>
          <span style={styles.legendDot}>·</span>
          <span><strong>檢視者</strong> — 唯讀</span>
        </div>

        <div style={styles.tableWrapper}>
          {loading ? (
            <div style={styles.empty}>載入中...</div>
          ) : members.length === 0 ? (
            <div style={styles.empty}>尚無成員資料</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>角色</th>
                  <th style={styles.th}>最後登入</th>
                  <th style={{ ...styles.th, width: 160 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const rc = roleColors[m.role] ?? { color: '#6B7280', bg: '#F3F4F6' };
                  return (
                    <tr key={m.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={styles.avatar}>{m.email.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{m.email}</div>
                            {m.isSuperAdmin && (
                              <span style={styles.superBadge}>超級管理員</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <select
                          value={m.role}
                          onChange={(e) => handleChangeRole(m.userId, e.target.value)}
                          style={{ ...styles.roleSelect, color: rc.color, background: rc.bg }}
                          disabled={m.isSuperAdmin}
                        >
                          <option value="admin">管理員</option>
                          <option value="editor_in_chief">總編輯</option>
                          <option value="editor">編輯</option>
                          <option value="viewer">檢視者</option>
                        </select>
                      </td>
                      <td style={{ ...styles.td, fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString('zh-TW') : '從未登入'}
                      </td>
                      <td style={styles.td}>
                        {!m.isSuperAdmin && (
                          <button onClick={() => handleRemove(m.userId, m.email)} style={styles.removeBtn}>
                            移除
                          </button>
                        )}
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' },
  subtitle: { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 },
  addBtn: {
    padding: '10px 20px', background: 'var(--color-brand)', color: 'white', border: 'none',
    borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  addPanel: {
    display: 'flex', gap: 8, marginBottom: 16, padding: '16px', background: 'white',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
  },
  addInput: {
    flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6,
    fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
  },
  addSelect: {
    padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 6,
    fontSize: 14, fontFamily: 'var(--font-body)', background: 'white',
  },
  addConfirmBtn: {
    padding: '8px 16px', background: 'var(--color-brand)', color: 'white', border: 'none',
    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  legend: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)',
    marginBottom: 16, flexWrap: 'wrap',
  },
  legendLabel: { fontWeight: 600 },
  legendDot: { color: 'var(--color-border)' },
  tableWrapper: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600,
    color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
  },
  tr: { borderBottom: '1px solid var(--color-border)' },
  td: { padding: '12px 16px', fontSize: 14 },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', background: 'var(--color-brand)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600,
  },
  superBadge: {
    fontSize: 10, color: '#D97706', background: '#FFFBEB', padding: '1px 6px',
    borderRadius: 4, fontWeight: 500, marginTop: 2, display: 'inline-block',
  },
  roleSelect: {
    padding: '4px 8px', borderRadius: 6, border: '1px solid transparent', fontSize: 13,
    fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  removeBtn: {
    padding: '4px 12px', background: 'transparent', border: '1px solid #FECACA', borderRadius: 4,
    fontSize: 12, color: 'var(--color-danger)', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  empty: { padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
};
