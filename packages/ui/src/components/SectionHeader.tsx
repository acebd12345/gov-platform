import Link from 'next/link';

export function SectionHeader({
  title,
  moreHref,
  moreLabel = '查看更多',
}: {
  title: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16,
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.4rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          letterSpacing: '0.04em',
          margin: 0,
        }}
      >
        {title}
      </h2>
      {moreHref && (
        <Link
          href={moreHref}
          style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none' }}
        >
          {moreLabel} ›
        </Link>
      )}
    </header>
  );
}
