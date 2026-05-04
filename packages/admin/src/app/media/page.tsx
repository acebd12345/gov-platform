'use client';

import { useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth-context';

interface MediaItem {
  id: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  cdnUrl: string | null;
  altText: string | null;
  createdAt: string;
}

export default function MediaPage() {
  const { tenant } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    // API upload integration (Phase 2 - stubbed for now)
    const newItems: MediaItem[] = Array.from(files).map((f, i) => ({
      id: crypto.randomUUID(),
      filename: f.name,
      mimeType: f.type,
      fileSizeBytes: f.size,
      width: null,
      height: null,
      cdnUrl: URL.createObjectURL(f),
      altText: null,
      createdAt: new Date().toISOString(),
    }));

    setItems((prev) => [...newItems, ...prev]);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleRemove(id: string) {
    if (!confirm('確定要刪除此檔案嗎？')) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>媒體庫</h1>
            <p style={styles.subtitle}>管理上傳的圖片與檔案</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} style={styles.uploadBtn}>
            ↑ 上傳檔案
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </header>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            ...styles.dropZone,
            ...(dragOver ? styles.dropZoneActive : {}),
          }}
        >
          <div style={styles.dropIcon}>📁</div>
          <p style={styles.dropText}>拖曳檔案到這裡上傳</p>
          <p style={styles.dropHint}>支援 image/*、PDF，最大 10MB</p>
        </div>

        {uploading && <div style={styles.uploadingBar}>上傳中...</div>}

        {/* Media grid */}
        {items.length === 0 ? (
          <div style={styles.empty}>尚無媒體檔案</div>
        ) : (
          <div style={styles.grid}>
            {items.map((item) => (
              <div key={item.id} style={styles.card}>
                {item.mimeType.startsWith('image/') && item.cdnUrl ? (
                  <div style={styles.imagePreview}>
                    <img src={item.cdnUrl} alt={item.altText ?? item.filename} style={styles.img} />
                  </div>
                ) : (
                  <div style={styles.filePlaceholder}>
                    <span style={{ fontSize: 28 }}>📄</span>
                  </div>
                )}
                <div style={styles.cardInfo}>
                  <div style={styles.filename}>{item.filename}</div>
                  <div style={styles.fileMeta}>
                    {formatSize(item.fileSizeBytes)}
                    {item.width && item.height ? ` · ${item.width}×${item.height}` : ''}
                  </div>
                </div>
                <button onClick={() => handleRemove(item.id)} style={styles.deleteBtn}>×</button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' },
  subtitle: { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 },
  uploadBtn: {
    padding: '10px 20px', background: 'var(--color-brand)', color: 'white', border: 'none',
    borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
  },
  dropZone: {
    border: '2px dashed var(--color-border)', borderRadius: 'var(--radius)', padding: '40px',
    textAlign: 'center', marginBottom: 24, transition: 'all 0.2s', cursor: 'pointer',
    background: 'white',
  },
  dropZoneActive: { borderColor: 'var(--color-brand)', background: 'var(--color-brand-light)' },
  dropIcon: { fontSize: 36, marginBottom: 8 },
  dropText: { fontSize: 15, fontWeight: 500, color: 'var(--color-text)' },
  dropHint: { fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 },
  uploadingBar: {
    padding: '12px', background: 'var(--color-brand-light)', borderRadius: 'var(--radius)',
    fontSize: 14, color: 'var(--color-brand)', marginBottom: 16, textAlign: 'center',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card: {
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-sm)',
  },
  imagePreview: { width: '100%', height: 140, overflow: 'hidden', background: '#F3F4F6' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  filePlaceholder: {
    width: '100%', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#F9FAFB',
  },
  cardInfo: { padding: '10px 12px' },
  filename: {
    fontSize: 13, fontWeight: 500, color: 'var(--color-text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  fileMeta: { fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 },
  deleteBtn: {
    position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
    background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', fontSize: 14,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  empty: {
    padding: '60px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14,
    background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
  },
};
