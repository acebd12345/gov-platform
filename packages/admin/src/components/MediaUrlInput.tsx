'use client';

import { useState } from 'react';
import MediaPicker from './MediaPicker';

/**
 * 圖片 URL 輸入欄 — 結合 text input + 「從媒體庫挑選」按鈕。
 *
 * 用法：
 *   <MediaUrlInput
 *     tenant={tenant}
 *     value={cfg.imageUrl ?? ''}
 *     onChange={(url) => setImageUrl(url)}
 *     placeholder="貼 URL 或從媒體庫選"
 *   />
 */
export function MediaUrlInput({
  tenant,
  value,
  onChange,
  placeholder = '貼 URL 或從媒體庫選',
}: {
  tenant: string | null | undefined;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: '8px 10px',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          fontSize: 13.5,
          outline: 'none',
          fontFamily: 'var(--font-body)',
        }}
      />
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        disabled={!tenant}
        title="從媒體庫選"
        style={{
          padding: '0 12px',
          background: 'var(--color-bg-alt, #F8FAFB)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          cursor: tenant ? 'pointer' : 'not-allowed',
          fontSize: 13,
          fontFamily: 'inherit',
          color: 'var(--color-text)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        媒體庫
      </button>

      {value && (
        <span
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: `url(${value}) center/cover no-repeat`,
            flexShrink: 0,
          }}
        />
      )}

      {tenant && (
        <MediaPicker
          open={pickerOpen}
          tenant={tenant}
          onSelect={(url) => {
            onChange(url);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
