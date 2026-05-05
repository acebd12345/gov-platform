'use client';

import { useEffect, useRef, useState } from 'react';

const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3002';

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 0, // 0 = 用面板寬
  tablet: 768,
  mobile: 390,
};

interface PreviewPaneProps {
  tenant: string | null | undefined;
  /** 儲存成功後 bump 一次，觸發 iframe 重整。 */
  refreshKey?: number;
  /**
   * 即時 draft 設定（不需存檔即時生效）。
   * 透過 postMessage 推給 web 前台，由 layout/page 接收後 inline 套用。
   */
  draft?: { brandTokens?: Record<string, string>; homepageConfig?: any };
}

export function PreviewPane({ tenant, refreshKey = 0, draft }: PreviewPaneProps) {
  const [open, setOpen] = useState(true);
  const [ts, setTs] = useState(0);
  const [paneWidth, setPaneWidth] = useState(480);
  const [device, setDevice] = useState<Device>('desktop');
  const [hydrated, setHydrated] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    try {
      const o = localStorage.getItem('gov-preview-open');
      const w = localStorage.getItem('gov-preview-width');
      const d = localStorage.getItem('gov-preview-device') as Device | null;
      if (o !== null) setOpen(o === '1');
      if (w !== null) setPaneWidth(Math.max(360, Math.min(1000, Number(w) || 480)));
      if (d && DEVICE_WIDTHS[d] !== undefined) setDevice(d);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem('gov-preview-open', open ? '1' : '0'); } catch {}
    }
  }, [open, hydrated]);

  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem('gov-preview-device', device); } catch {}
    }
  }, [device, hydrated]);

  // refreshKey bump 時 reload iframe
  useEffect(() => {
    setTs(Date.now());
  }, [refreshKey]);

  // 即時 draft 推送
  useEffect(() => {
    if (!draft) return;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage({ type: 'gov-preview-draft', draft }, '*');
    } catch {}
  }, [draft]);

  if (!tenant) return null;
  if (!hydrated) return null;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} title="顯示預覽" style={collapsedBtn}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span style={{ fontSize: 12, marginLeft: 6 }}>預覽</span>
      </button>
    );
  }

  const src = `${WEB_BASE}/?tenant=${encodeURIComponent(tenant)}&preview=1${ts ? `&_t=${ts}` : ''}`;
  const innerWidth = device === 'desktop' ? '100%' : `${DEVICE_WIDTHS[device]}px`;

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: paneWidth,
        background: '#FFFFFF',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}
    >
      <ResizeHandle width={paneWidth} setWidth={setPaneWidth} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          fontSize: 12,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text)', fontWeight: 600 }}>
          <span
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-success, #10B981)',
              boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
            }}
            aria-hidden
          />
          預覽
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{tenant}</span>

        <span style={{ flex: 1 }} />

        <DeviceSwitcher value={device} onChange={setDevice} />
        <a href={src} target="_blank" rel="noopener noreferrer" title="新分頁開啟" style={iconBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M14 10l7-7M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
          </svg>
        </a>
        <button onClick={() => setTs(Date.now())} title="重新載入" style={iconBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v6h6" />
          </svg>
        </button>
        <button onClick={() => setOpen(false)} title="收合" style={iconBtn}>✕</button>
      </div>

      <div
        style={{
          flex: 1,
          background: '#F1F5F9',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: device === 'desktop' ? 0 : 16,
          overflow: 'auto',
        }}
      >
        <iframe
          ref={iframeRef}
          key={ts}
          src={src}
          title={`預覽 - ${tenant}`}
          style={{
            width: innerWidth,
            maxWidth: '100%',
            height: device === 'desktop' ? '100%' : 'calc(100% - 32px)',
            minHeight: device === 'mobile' ? 720 : device === 'tablet' ? 800 : '100%',
            border: device === 'desktop' ? 'none' : '1px solid var(--color-border)',
            borderRadius: device === 'desktop' ? 0 : 8,
            background: '#FFFFFF',
            boxShadow: device === 'desktop' ? 'none' : '0 4px 16px rgba(0,0,0,0.08)',
          }}
        />
      </div>
    </aside>
  );
}

function DeviceSwitcher({ value, onChange }: { value: Device; onChange: (d: Device) => void }) {
  const items: Array<{ key: Device; label: string; icon: string }> = [
    {
      key: 'desktop',
      label: '桌機',
      icon: 'M3 5h18v11H3z M8 21h8 M12 16v5',
    },
    {
      key: 'tablet',
      label: '平板',
      icon: 'M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M11 18h2',
    },
    {
      key: 'mobile',
      label: '手機',
      icon: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M11 18h2',
    },
  ];
  return (
    <div
      role="group"
      aria-label="預覽寬度"
      style={{
        display: 'inline-flex',
        background: 'var(--color-bg-alt, #F8FAFB)',
        border: '1px solid var(--color-border)',
        borderRadius: 6,
        padding: 2,
      }}
    >
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            title={it.label}
            aria-pressed={active}
            style={{
              width: 28,
              height: 22,
              border: 'none',
              borderRadius: 4,
              background: active ? '#FFFFFF' : 'transparent',
              cursor: 'pointer',
              color: active ? 'var(--color-brand)' : 'var(--color-text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              fontFamily: 'inherit',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={it.icon} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function ResizeHandle({ width, setWidth }: { width: number; setWidth: (n: number) => void }) {
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    const onMove = (ev: MouseEvent) => {
      const next = Math.max(360, Math.min(1000, startW - (ev.clientX - startX)));
      setWidth(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      try { localStorage.setItem('gov-preview-width', String(width)); } catch {}
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
  return (
    <div
      onMouseDown={onMouseDown}
      style={{ position: 'absolute', left: -3, top: 0, bottom: 0, width: 6, cursor: 'ew-resize', zIndex: 1 }}
    />
  );
}

const iconBtn: React.CSSProperties = {
  width: 26, height: 26,
  border: '1px solid var(--color-border)',
  background: 'white',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text)',
  fontSize: 13,
  fontFamily: 'inherit',
  textDecoration: 'none',
};

const collapsedBtn: React.CSSProperties = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 14px',
  background: 'var(--color-brand)',
  color: 'white',
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  zIndex: 20,
  fontFamily: 'inherit',
};
