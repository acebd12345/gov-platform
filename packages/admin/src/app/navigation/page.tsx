'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface NavItem {
  id: string;
  parentId: string | null;
  label: string;
  url: string | null;
  pageId: string | null;
  sortOrder: number;
  openNewTab: boolean;
  isVisible: boolean;
  children: NavItem[];
}

const initialNav: NavItem[] = [
  { id: '1', parentId: null, label: '首頁', url: '/', pageId: null, sortOrder: 0, openNewTab: false, isVisible: true, children: [] },
  {
    id: '2', parentId: null, label: '最新消息', url: '/news', pageId: null, sortOrder: 1, openNewTab: false, isVisible: true,
    children: [
      { id: '2a', parentId: '2', label: '市政新聞', url: '/news?type=city', pageId: null, sortOrder: 0, openNewTab: false, isVisible: true, children: [] },
      { id: '2b', parentId: '2', label: '活動訊息', url: '/news?type=event', pageId: null, sortOrder: 1, openNewTab: false, isVisible: true, children: [] },
    ],
  },
  { id: '3', parentId: null, label: '市民服務', url: '/services', pageId: null, sortOrder: 2, openNewTab: false, isVisible: true, children: [] },
  { id: '4', parentId: null, label: '關於我們', url: '/about', pageId: null, sortOrder: 3, openNewTab: false, isVisible: true, children: [] },
  { id: '5', parentId: null, label: '開放資料', url: 'https://data.taipei', pageId: null, sortOrder: 4, openNewTab: true, isVisible: true, children: [] },
];

export default function NavigationPage() {
  const [items, setItems] = useState<NavItem[]>(initialNav);
  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  function startEdit(item: NavItem) {
    setEditing(item.id);
    setEditLabel(item.label);
    setEditUrl(item.url ?? '');
  }

  function saveEdit(id: string) {
    function update(arr: NavItem[]): NavItem[] {
      return arr.map((item) => {
        if (item.id === id) return { ...item, label: editLabel, url: editUrl || null };
        return { ...item, children: update(item.children) };
      });
    }
    setItems(update(items));
    setEditing(null);
  }

  function toggleVisible(id: string) {
    function update(arr: NavItem[]): NavItem[] {
      return arr.map((item) => {
        if (item.id === id) return { ...item, isVisible: !item.isVisible };
        return { ...item, children: update(item.children) };
      });
    }
    setItems(update(items));
  }

  function removeItem(id: string) {
    if (!confirm('確定刪除此選單項目？')) return;
    function filter(arr: NavItem[]): NavItem[] {
      return arr.filter((i) => i.id !== id).map((i) => ({ ...i, children: filter(i.children) }));
    }
    setItems(filter(items));
  }

  function addItem() {
    if (!newLabel.trim()) return;
    setItems([
      ...items,
      {
        id: crypto.randomUUID(), parentId: null, label: newLabel, url: newUrl || null,
        pageId: null, sortOrder: items.length, openNewTab: false, isVisible: true, children: [],
      },
    ]);
    setNewLabel('');
    setNewUrl('');
    setShowAdd(false);
  }

  function moveUp(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy;
    });
  }

  function moveDown(id: string) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      return copy;
    });
  }

  function renderTree(arr: NavItem[], depth = 0) {
    return arr.map((item, idx) => (
      <div key={item.id}>
        <div style={{ ...styles.navRow, paddingLeft: 16 + depth * 24, opacity: item.isVisible ? 1 : 0.4 }}>
          <div style={styles.navHandle}>≡</div>
          {editing === item.id ? (
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="標籤" style={styles.editInput} autoFocus />
              <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="URL" style={{ ...styles.editInput, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              <button onClick={() => saveEdit(item.id)} style={styles.saveBtn}>儲存</button>
              <button onClick={() => setEditing(null)} style={styles.cancelBtn}>取消</button>
            </div>
          ) : (
            <>
              <span style={styles.navLabel}>{item.label}</span>
              <span style={styles.navUrl}>{item.url ?? '（內部頁面）'}</span>
              {item.openNewTab && <span style={styles.externalBadge}>外部</span>}
              <div style={styles.navActions}>
                {depth === 0 && <button onClick={() => moveUp(item.id)} style={styles.moveBtn}>↑</button>}
                {depth === 0 && <button onClick={() => moveDown(item.id)} style={styles.moveBtn}>↓</button>}
                <button onClick={() => toggleVisible(item.id)} style={styles.visBtn}>
                  {item.isVisible ? '👁' : '👁‍🗨'}
                </button>
                <button onClick={() => startEdit(item)} style={styles.editBtn}>編輯</button>
                <button onClick={() => removeItem(item.id)} style={styles.delBtn}>刪除</button>
              </div>
            </>
          )}
        </div>
        {item.children.length > 0 && renderTree(item.children, depth + 1)}
      </div>
    ));
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main data-gov-main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>導覽管理</h1>
            <p style={styles.subtitle}>編輯前台主選單項目與順序</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} style={styles.addBtn}>+ 新增項目</button>
        </header>

        {showAdd && (
          <div style={styles.addPanel}>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="選單標籤" style={styles.addInput} />
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="URL（選填）" style={styles.addInput} />
            <button onClick={addItem} style={styles.addConfirmBtn}>新增</button>
          </div>
        )}

        <div style={styles.listWrapper}>
          <div style={styles.listHeader}>
            <span>前台主選單預覽</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>使用 ↑↓ 調整順序</span>
          </div>
          {items.length === 0 ? (
            <div style={styles.empty}>尚無選單項目</div>
          ) : (
            renderTree(items)
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
  addConfirmBtn: {
    padding: '8px 16px', background: 'var(--color-brand)', color: 'white', border: 'none',
    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  listWrapper: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
  },
  listHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)',
    borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
  },
  navRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
    borderBottom: '1px solid var(--color-border)', fontSize: 14, transition: 'opacity 0.2s',
  },
  navHandle: { color: 'var(--color-border)', cursor: 'grab', fontSize: 16 },
  navLabel: { fontWeight: 500, color: 'var(--color-text)' },
  navUrl: { fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' },
  externalBadge: {
    fontSize: 10, color: '#D97706', background: '#FFFBEB', padding: '1px 6px',
    borderRadius: 4, fontWeight: 500,
  },
  navActions: { marginLeft: 'auto', display: 'flex', gap: 4 },
  moveBtn: {
    width: 24, height: 24, background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 4, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  visBtn: {
    width: 24, height: 24, background: 'transparent', border: 'none', fontSize: 14, cursor: 'pointer',
  },
  editBtn: {
    padding: '3px 10px', background: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 4, fontSize: 12, color: 'var(--color-brand)', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  delBtn: {
    padding: '3px 10px', background: 'transparent', border: '1px solid #FECACA',
    borderRadius: 4, fontSize: 12, color: 'var(--color-danger)', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  editInput: {
    flex: 1, padding: '4px 8px', border: '1px solid var(--color-brand)', borderRadius: 4,
    fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none',
  },
  saveBtn: {
    padding: '4px 10px', background: 'var(--color-brand)', color: 'white', border: 'none',
    borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  cancelBtn: {
    padding: '4px 10px', background: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  empty: { padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
};
