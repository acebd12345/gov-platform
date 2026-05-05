/** 藝文資源地圖（占位）— 實際介接 Google Maps / Leaflet 後再換 */
export function ResourceMap() {
  return (
    <div
      style={{
        position: 'relative',
        height: 320,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, #DCE3D8 0%, #C8D4C0 50%, #B8C8B0 100%)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* fake river */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          top: 0,
          bottom: 0,
          width: 24,
          background: 'rgba(140, 170, 195, 0.6)',
          transform: 'rotate(-12deg) translateX(80px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '40%',
          top: 0,
          bottom: 0,
          width: 18,
          background: 'rgba(140, 170, 195, 0.5)',
          transform: 'rotate(8deg)',
        }}
      />

      {/* fake pins */}
      {[
        [22, 38],
        [32, 58],
        [42, 30],
        [52, 65],
        [60, 42],
        [68, 58],
        [25, 70],
        [50, 45],
      ].map(([x, y], i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: 22,
            height: 22,
            background: 'var(--color-brand-accent, var(--color-brand-primary))',
            borderRadius: '50% 50% 50% 0',
            transform: 'translate(-50%, -100%) rotate(-45deg)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
          aria-hidden
        />
      ))}

      {/* search box */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          top: 16,
          width: 220,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-sm)',
          padding: 8,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 8px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 6,
            fontSize: 12,
            color: 'var(--color-text-muted)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span>搜尋地點或資源</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
          }}
        >
          <span>全部類別</span>
          <span aria-hidden>▾</span>
        </div>
      </div>
    </div>
  );
}
