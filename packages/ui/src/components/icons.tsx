/** 小型 SVG 圖示集 — 主要供首頁業務專區與快速服務使用 */

const baseProps = {
  width: 28,
  height: 28,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const bizProps = { ...baseProps, width: 40, height: 40, strokeWidth: 1.4 };

// ---- 業務專區 ----
export const IconHeritage = () => (
  <svg {...bizProps}>
    <path d="M3 21h18" />
    <path d="M5 21V10l7-4 7 4v11" />
    <path d="M9 21v-7h6v7" />
    <path d="M5 10h14" />
  </svg>
);

export const IconArts = () => (
  <svg {...bizProps}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 2-1 2-2s-1-1.5-1-3 1-2 2-2h3c2 0 4-2 4-5 0-5-4-10-10-10z" />
  </svg>
);

export const IconCreative = () => (
  <svg {...bizProps}>
    <rect x="3" y="8" width="18" height="13" rx="1" />
    <path d="M12 8v13" />
    <path d="M19 5c0 1.5-1 3-3 3-1.5 0-3-1-3-3 1 0 3-1 3-2 0 1 2 2 3 2z" />
    <path d="M5 5c0 1.5 1 3 3 3 1.5 0 3-1 3-3-1 0-3-1-3-2 0 1-2 2-3 2z" />
  </svg>
);

export const IconBook = () => (
  <svg {...bizProps}>
    <path d="M4 4h6a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4z" />
    <path d="M20 4h-6a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h7z" />
  </svg>
);

export const IconFilm = () => (
  <svg {...bizProps}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
  </svg>
);

export const IconExchange = () => (
  <svg {...bizProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

export const IconSubsidy = () => (
  <svg {...bizProps}>
    <path d="M3 16c4-2 8-2 12 0 3-1 5-1 6 0v2c-2 1-4 1-6 0-4-1-8 1-12 0z" />
    <circle cx="14" cy="9" r="3" />
    <path d="M14 6V4M14 14v-2M11 9H9M19 9h-2" />
  </svg>
);

// ---- 快速服務 ----
export const IconApply = () => (
  <svg {...baseProps}>
    <rect x="6" y="3" width="12" height="18" rx="1" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
);

export const IconStatus = () => (
  <svg {...baseProps}>
    <rect x="4" y="4" width="16" height="16" rx="1" />
    <circle cx="14" cy="14" r="3" />
    <path d="m17 17 2 2" />
    <path d="M8 8h6M8 11h3" />
  </svg>
);

export const IconVenue = () => (
  <svg {...baseProps}>
    <rect x="3" y="6" width="18" height="15" rx="1" />
    <path d="M3 10h18M8 6V3M16 6V3M8 14h2M14 14h2M8 17h2M14 17h2" />
  </svg>
);

export const IconStreetArtist = () => (
  <svg {...baseProps}>
    <circle cx="9" cy="16" r="3" />
    <circle cx="17" cy="14" r="2.5" />
    <path d="M12 16V5l8-2v11" />
  </svg>
);

export const IconMoney = () => (
  <svg {...baseProps}>
    <path d="M12 21c-3 0-6-1-9-3 1-2 2-4 4-4 1 0 2 1 4 1s3-1 4-1c2 0 3 2 4 4-2 2-4 3-7 3z" />
    <path d="M12 12V8M9 11l3 1 3-1" />
    <path d="M9 4h6l-1 4h-4z" />
  </svg>
);

export const IconChat = () => (
  <svg {...baseProps}>
    <path d="M21 12c0 4-4 7-9 7-1.5 0-3-.3-4.3-.8L3 20l1-3.5C2.5 15 2 13.5 2 12c0-4 4-7 9-7s10 3 10 7z" />
    <circle cx="8" cy="12" r=".5" fill="currentColor" />
    <circle cx="12" cy="12" r=".5" fill="currentColor" />
    <circle cx="16" cy="12" r=".5" fill="currentColor" />
  </svg>
);
