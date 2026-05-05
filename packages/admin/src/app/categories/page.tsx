'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Category {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  sortOrder: number;
  children: Category[];
}

// Demo data for UI
const initialCategories: Category[] = [
  {
    id: '1', parentId: null, slug: 'city-news', name: '市政新聞', sortOrder: 0,
    children: [
      { id: '1a', parentId: '1', slug: 'policy', name: '政策公告', sortOrder: 0, children: [] },
      { id: '1b', parentId: '1', slug: 'events', name: '活動訊息', sortOrder: 1, children: [] },
    ],
  },
  {
    id: '2', parentId: null, slug: 'citizen-services', name: '市民服務', sortOrder: 1,
    children: [
      { id: '2a', parentId: '2', slug: 'tax', name: '稅務', sortOrder: 0, children: [] },
      { id: '2b', parentId: '2', slug: 'transport', name: '交通', sortOrder: 1, children: [] },
      { id: '2c', parentId: '2', slug: 'social', name: '社會福利', sortOrder: 2, children: [] },
    ],
  },
  { id: '3', parentId: null, slug: 'open-data', name: '開放資料', sortOrder: 2, children: [] },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  function startEdit(cat: Category) {
    setEditing(cat.id);
    setEditName(cat.name);
  }

  function saveEdit(id: string) {
    function updateTree(cats: Category[]): Category[] {
      return cats.map((c) => {
        if (c.id === id) return { ...c, name: editName };
        return { ...c, children: updateTree(c.children) };
      });
    }
    setCategories(updateTree(categories));
    setEditing(null);
  }

  function addCategory() {
    if (!newName.trim()) return;
    const slug = newSlug || newName.toLowerCase().replace(/\s+/g, '-');
    setCategories([
      ...categories,
      { id: crypto.randomUUID(), parentId: null, slug, name: newName, sortOrder: categories.length, children: [] },
    ]);
    setNewName('');
    setNewSlug('');
    setShowAdd(false);
  }

  function removeCategory(id: string) {
    if (!confirm('確定刪除此分類？')) return;
    function filterTree(cats: Category[]): Category[] {
      return cats.filter((c) => c.id !== id).map((c) => ({ ...c, children: filterTree(c.children) }));
    }
    setCategories(filterTree(categories));
  }

  function renderTree(cats: Category[], depth = 0) {
    return cats.map((cat) => (
      <div key={cat.id}>
        <div style={{ ...styles.treeItem, paddingLeft: 16 + depth * 24 }}>
          <span style={styles.treeIcon}>{cat.children.length > 0 ? '▾' : '·'}</span>
          {editing === cat.id ? (
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={styles.editInput}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat.id)}
              />
              <button onClick={() => saveEdit(cat.id)} style={styles.saveBtn}>儲存</button>
              <button onClick={() => setEditing(null)} style={styles.cancelBtn}>取消</button>
            </div>
          ) : (
            <>
              <span style={styles.catName}>{cat.name}</span>
              <span style={styles.catSlug}>/{cat.slug}</span>
              <div style={styles.treeActions}>
                <button onClick={() => startEdit(cat)} style={styles.actionBtn}>編輯</button>
                <button onClick={() => removeCategory(cat.id)} style={styles.actionBtnDanger}>刪除</button>
              </div>
            </>
          )}
        </div>
        {cat.children.length > 0 && renderTree(cat.children, depth + 1)}
      </div>
    ));
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main data-gov-main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>分類管理</h1>
            <p style={styles.subtitle}>管理內容分類，支援無限層級</p>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} style={styles.addBtn}>+ 新增分類</button>
        </header>

        {showAdd && (
          <div style={styles.addPanel}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="分類名稱"
              style={styles.addInput}
            />
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="URL slug（選填）"
              style={{ ...styles.addInput, flex: '0 0 200px' }}
            />
            <button onClick={addCategory} style={styles.addConfirmBtn}>新增</button>
          </div>
        )}

        <div style={styles.treeWrapper}>
          {categories.length === 0 ? (
            <div style={styles.empty}>尚無分類</div>
          ) : (
            renderTree(categories)
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
  treeWrapper: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
  },
  treeItem: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
    borderBottom: '1px solid var(--color-border)', fontSize: 14,
  },
  treeIcon: { color: 'var(--color-text-muted)', fontSize: 12, width: 14, textAlign: 'center' },
  catName: { fontWeight: 500, color: 'var(--color-text)' },
  catSlug: { fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' },
  treeActions: { marginLeft: 'auto', display: 'flex', gap: 4 },
  actionBtn: {
    padding: '3px 10px', background: 'transparent', border: '1px solid var(--color-border)',
    borderRadius: 4, fontSize: 12, color: 'var(--color-brand)', cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  actionBtnDanger: {
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
