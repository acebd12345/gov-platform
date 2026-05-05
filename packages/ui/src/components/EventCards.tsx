export interface EventCardItem {
  title: string;
  dateRange: string;
  venue?: string;
  imageUrl?: string;
  href?: string;
}

export type EventsVariant = 'featured' | 'equal' | 'timeline';

/** 活動精選，三種視覺：featured（1 大 + 2 小）/ equal（3 平均卡）/ timeline（時間軸） */
export function EventCards({
  featured,
  items,
  variant = 'featured',
}: {
  featured: EventCardItem;
  items: EventCardItem[];
  variant?: EventsVariant;
}) {
  if (variant === 'equal') {
    const all = [featured, ...items].slice(0, 3);
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        {all.map((e, i) => (
          <EventCard key={i} event={e} />
        ))}
      </div>
    );
  }
  if (variant === 'timeline') {
    const all = [featured, ...items];
    return <Timeline items={all} />;
  }
  // featured (default)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <EventCard event={featured} large />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {items.map((e, i) => (
          <EventCard key={i} event={e} />
        ))}
      </div>
    </div>
  );
}

function Timeline({ items }: { items: EventCardItem[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((e, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: 16,
            padding: '14px 0',
            borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--color-border)',
            position: 'relative',
          }}
        >
          <span
            style={{
              flexShrink: 0,
              width: 64,
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-brand-accent, var(--color-brand-primary))',
              lineHeight: 1.4,
              paddingTop: 2,
            }}
          >
            {e.dateRange}
          </span>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-brand-primary)',
              marginTop: 8,
              flexShrink: 0,
              boxShadow: '0 0 0 4px var(--color-brand-secondary)',
            }}
          />
          <a
            href={e.href ?? '#'}
            style={{
              flex: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontFamily: 'var(--font-heading)',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text)',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}
            >
              {e.title}
            </div>
            {e.venue && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                <span aria-hidden>📍</span> {e.venue}
              </div>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

function EventCard({ event, large = false }: { event: EventCardItem; large?: boolean }) {
  const height = large ? 200 : 130;
  return (
    <a
      href={event.href ?? '#'}
      style={{
        display: 'block',
        position: 'relative',
        height,
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        background: event.imageUrl
          ? `linear-gradient(180deg, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 100%), url(${event.imageUrl}) center/cover no-repeat`
          : 'linear-gradient(135deg, #4A3F2A 0%, #2C2418 100%)',
        color: '#FFFFFF',
        textDecoration: 'none',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          padding: '8px 12px',
          background: 'rgba(0,0,0,0.55)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
        }}
      >
        {event.dateRange}
      </div>
      <button
        aria-label="收藏"
        style={{
          position: 'absolute',
          right: 8,
          bottom: 8,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-text)',
        }}
      >
        ♡
      </button>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: large ? 16 : 10,
          fontSize: large ? 15 : 12.5,
          fontWeight: 600,
          fontFamily: 'var(--font-heading)',
          lineHeight: 1.4,
        }}
      >
        <div style={{ whiteSpace: 'pre-line' }}>{event.title}</div>
        {event.venue && (
          <div style={{ marginTop: 4, fontSize: 11, fontWeight: 400, opacity: 0.92 }}>
            <span aria-hidden>📍</span> {event.venue}
          </div>
        )}
      </div>
    </a>
  );
}
