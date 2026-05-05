import { Container } from './Container';

export interface HeroSlide {
  title: string;
  subtitle: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
}

export function Hero({ slide, slidesCount = 1, current = 0 }: {
  slide: HeroSlide;
  slidesCount?: number;
  current?: number;
}) {
  return (
    <section
      style={{
        position: 'relative',
        height: 'min(72vh, 540px)',
        background: slide.imageUrl
          ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%), url(${escapeUrl(slide.imageUrl)}) center/cover no-repeat`
          : 'linear-gradient(135deg, #5C6F5C 0%, #2C3D33 60%, #B89968 100%)',
        color: '#FFFFFF',
        overflow: 'hidden',
      }}
      aria-roledescription="carousel"
    >
      <Container style={{ height: '100%' }}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 620,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            {slide.title}
            <br />
            {slide.subtitle}
          </h1>
          {slide.body && (
            <p style={{ fontSize: '1.05rem', marginTop: 16, opacity: 0.92 }}>{slide.body}</p>
          )}
          {slide.ctaLabel && (
            <a
              href={slide.ctaHref ?? '#'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginTop: 24,
                padding: '10px 24px',
                background: 'var(--color-brand-primary)',
                color: '#FFFFFF',
                textDecoration: 'none',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                width: 'fit-content',
              }}
            >
              {slide.ctaLabel}
            </a>
          )}
        </div>
      </Container>

      {/* Carousel arrows (decorative, no logic for now) */}
      <CarouselArrow side="left" />
      <CarouselArrow side="right" />

      {/* Dots */}
      {slidesCount > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
          }}
          role="tablist"
        >
          {Array.from({ length: slidesCount }).map((_, i) => (
            <span
              key={i}
              role="tab"
              aria-selected={i === current}
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                background: i === current ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                borderRadius: 4,
                transition: 'width 0.2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Pause button (decorative) */}
      <button
        aria-label="暫停輪播"
        style={{
          position: 'absolute',
          right: 24,
          bottom: 22,
          background: 'transparent',
          border: 'none',
          color: '#FFFFFF',
          cursor: 'pointer',
          opacity: 0.7,
          fontSize: 14,
        }}
      >
        ❚❚
      </button>
    </section>
  );
}

function CarouselArrow({ side }: { side: 'left' | 'right' }) {
  return (
    <button
      aria-label={side === 'left' ? '上一張' : '下一張'}
      style={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [side]: 16,
        background: 'transparent',
        border: 'none',
        color: '#FFFFFF',
        cursor: 'pointer',
        fontSize: 28,
        opacity: 0.7,
        padding: 8,
      } as React.CSSProperties}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}

function escapeUrl(u: string): string {
  return u.replace(/[\s"()]/g, encodeURIComponent);
}
