'use client';

import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

interface MediaItem {
  id: string;
  filename: string;
  cdnUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface MediaPickerProps {
  open: boolean;
  tenant: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function MediaPicker({ open, tenant, onSelect, onClose }: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) loadMedia();
  }, [open]);

  async function loadMedia() {
    setLoading(true);
    try {
      const res = await apiGet<{ data: MediaItem[] }>('/content/media', { tenant });
      setItems((res.data ?? []).filter((m) => m.mimeType.startsWith('image/')));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:4000';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>從媒體庫選擇圖片</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          {loading ? (
            <div style={styles.empty}>載入中...</div>
          ) : items.length === 0 ? (
            <div style={styles.empty}>媒體庫尚無圖片，請先上傳</div>
          ) : (
            <div style={styles.grid}>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelect(`${API_BASE}${item.cdnUrl}`);
                    onClose();
                  }}
                  style={styles.imageCard}
                >
                  <img src={`${API_BASE}${item.cdnUrl}`} alt={item.filename} style={styles.img} />
                  <div style={styles.imageName}>{item.filename}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    width: '90%', maxWidth: 700, maxHeight: '80vh', background: 'white',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', display: 'flex',
    flexDirection: 'column', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
  },
  title: { fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)' },
  closeBtn: {
    background: 'transparent', border: 'none', fontSize: 18, color: 'var(--color-text-muted)',
    cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1, overflow: 'auto', padding: '16px 20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 },
  imageCard: {
    background: 'none', border: '2px solid var(--color-border)', borderRadius: 'var(--radius)',
    overflow: 'hidden', cursor: 'pointer', padding: 0, transition: 'border-color 0.2s',
  },
  img: { width: '100%', height: 100, objectFit: 'cover', display: 'block' },
  imageName: {
    padding: '6px 8px', fontSize: 11, color: 'var(--color-text-muted)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left',
  },
  empty: { padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
};
