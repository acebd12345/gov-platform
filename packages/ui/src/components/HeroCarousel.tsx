'use client';

import { useEffect, useState, useRef } from 'react';
import { Container } from './Container';

export interface HeroSlideData {
  title: string;
  subtitle?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  imageUrlMobile?: string;
}

export type HeroVariant = 'carousel' | 'split' | 'minimal';

/** 多張 Hero 輪播 + 三種視覺：carousel（預設）/ split（圖文左右）/ minimal（純文字） */
export function HeroCarousel({
  slides,
  intervalMs = 6000,
  variant = 'carousel',
}: {
  slides: HeroSlideData[];
  intervalMs?: number;
  variant?: HeroVariant;
}) {
  if (variant === 'split') return <SplitHero slide={slides[0]} />;
  if (variant === 'minimal') return <MinimalHero slide={slides[0]} />;
  return <CarouselHero slides={slides} intervalMs={intervalMs} />;
}

function CarouselHero({
  slides,
  intervalMs = 6000,
}: {
  slides: HeroSlideData[];
  intervalMs?: number;
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timer.current = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, slides.length, intervalMs]);

  if (slides.length === 0) return null;
  const slide = slides[idx];
  const multi = slides.length > 1;

  const go = (n: number) => setIdx((n + slides.length) % slides.length);

  // RWD bg：桌機用 imageUrl，<768px 用 imageUrlMobile（沒設則回退 imageUrl）
  const slideClassName = `gov-hero-slide-${idx}`;
  const desktopBg = slide.imageUrl
    ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%), url(${escapeUrl(slide.imageUrl)}) center/cover no-repeat`
    : 'linear-gradient(135deg, #5C6F5C 0%, #2C3D33 60%, #B89968 100%)';
  const mobileBg = slide.imageUrlMobile
    ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%), url(${escapeUrl(slide.imageUrlMobile)}) center/cover no-repeat`
    : null;

  return (
    <section
      className={slideClassName}
      style={{
        position: 'relative',
        height: 'min(72vh, 540px)',
        background: desktopBg,
        color: '#FFFFFF',
        overflow: 'hidden',
        transition: 'background 0.4s',
      }}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {mobileBg && (
        <style>{`@media (max-width: 768px) { .${slideClassName} { background: ${mobileBg} !important; } }`}</style>
      )}
      <Container style={{ height: '100%' }}>
        <div
          key={idx}
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 620,
            animation: 'gov-fade 0.5s ease-out',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.25rem, 5vw, 4rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            {slide.title}
            {slide.subtitle && (
              <>
                <br />
                {slide.subtitle}
              </>
            )}
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

      {multi && (
        <>
          <CarouselArrow side="left" onClick={() => go(idx - 1)} />
          <CarouselArrow side="right" onClick={() => go(idx + 1)} />

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
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === idx}
                aria-label={`第 ${i + 1} 張`}
                onClick={() => go(i)}
                style={{
                  width: i === idx ? 28 : 8,
                  height: 8,
                  background: i === idx ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  border: 'none',
                  borderRadius: 4,
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 0.2s',
                }}
              />
            ))}
          </div>

          <button
            aria-label={paused ? '繼續輪播' : '暫停輪播'}
            onClick={() => setPaused((p) => !p)}
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
              fontFamily: 'inherit',
            }}
          >
            {paused ? '▶' : '❚❚'}
          </button>
        </>
      )}

      <style>{`
        @keyframes gov-fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

// ===== Split variant: 左圖右文 / 右圖左文 =====

function SplitHero({ slide }: { slide: HeroSlideData }) {
  if (!slide) return null;
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        minHeight: 'min(60vh, 480px)',
        background: 'var(--color-bg-alt, #F8FAFB)',
      }}
      className="gov-hero-split"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(32px, 6vw, 80px)',
          gap: 16,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            fontWeight: 700,
            lineHeight: 1.2,
            margin: 0,
            color: 'var(--color-text)',
          }}
        >
          {slide.title}
          {slide.subtitle && (
            <>
              <br />
              <span style={{ color: 'var(--color-brand-accent, var(--color-brand-primary))' }}>
                {slide.subtitle}
              </span>
            </>
          )}
        </h1>
        {slide.body && (
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 480,
            }}
          >
            {slide.body}
          </p>
        )}
        {slide.ctaLabel && (
          <a
            href={slide.ctaHref ?? '#'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '12px 28px',
              background: 'var(--color-brand-primary)',
              color: '#FFFFFF',
              textDecoration: 'none',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              width: 'fit-content',
            }}
          >
            {slide.ctaLabel} →
          </a>
        )}
      </div>
      <div
        style={{
          background: slide.imageUrl
            ? `url(${escapeUrl(slide.imageUrl)}) center/cover no-repeat`
            : `linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent, var(--color-brand-primary)))`,
        }}
        aria-hidden
      />
      <style>{`
        @media (max-width: 768px) {
          .gov-hero-split { grid-template-columns: 1fr !important; }
          .gov-hero-split > div:last-child { display: none; }
        }
      `}</style>
    </section>
  );
}

// ===== Minimal variant: 純文字 + CTA =====

function MinimalHero({ slide }: { slide: HeroSlideData }) {
  if (!slide) return null;
  return (
    <section
      style={{
        padding: 'clamp(64px, 10vw, 120px) 0',
        background: 'var(--color-bg)',
        textAlign: 'center',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Container>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            lineHeight: 1.2,
            margin: 0,
            color: 'var(--color-text)',
            letterSpacing: '0.04em',
          }}
        >
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
              fontWeight: 500,
              color: 'var(--color-brand-accent, var(--color-brand-primary))',
              marginTop: 12,
            }}
          >
            {slide.subtitle}
          </p>
        )}
        {slide.body && (
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--color-text-muted)',
              maxWidth: 600,
              margin: '20px auto 0',
              lineHeight: 1.7,
            }}
          >
            {slide.body}
          </p>
        )}
        {slide.ctaLabel && (
          <a
            href={slide.ctaHref ?? '#'}
            style={{
              display: 'inline-flex',
              marginTop: 28,
              padding: '12px 32px',
              background: 'var(--color-brand-primary)',
              color: '#FFFFFF',
              textDecoration: 'none',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {slide.ctaLabel} →
          </a>
        )}
      </Container>
    </section>
  );
}

function CarouselArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      aria-label={side === 'left' ? '上一張' : '下一張'}
      onClick={onClick}
      style={
        {
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
          fontFamily: 'inherit',
        } as React.CSSProperties
      }
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  );
}

function escapeUrl(u: string): string {
  return u.replace(/[\s"()]/g, encodeURIComponent);
}
