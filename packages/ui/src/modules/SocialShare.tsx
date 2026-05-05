/**
 * 文章頁分享按鈕（FB / Line / Twitter / Email / 複製連結）。
 * Server-renderable — 用 a 標籤與分享協議，不需要 client JS。
 */
export function SocialShare({
  url,
  title,
  label = '分享',
}: {
  url: string;
  title: string;
  label?: string;
}) {
  const enc = encodeURIComponent;
  const targets = [
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      svg: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    },
    {
      name: 'Line',
      href: `https://social-plugins.line.me/lineit/share?url=${enc(url)}`,
      svg: 'M12 3C6.5 3 2 6.7 2 11.2c0 3 1.9 5.5 4.7 6.9-.1.4-.6 2.2-.7 2.5 0 .2.1.5.4.4.2 0 2.7-1.7 3.7-2.4.6.1 1.2.2 1.9.2 5.5 0 10-3.7 10-8.6S17.5 3 12 3z',
    },
    {
      name: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
      svg: 'M18 4h3l-7 8 8 10h-6l-5-6-5 6H3l7-9-7-9h6l4 5z',
    },
    {
      name: 'Email',
      href: `mailto:?subject=${enc(title)}&body=${enc(url)}`,
      svg: 'M3 6h18v12H3z M3 6l9 7 9-7',
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}
      aria-label={label}
    >
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{label}：</span>
      {targets.map((t) => (
        <a
          key={t.name}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`分享至 ${t.name}`}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            background: 'var(--color-surface)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={t.svg} />
          </svg>
        </a>
      ))}
    </div>
  );
}
