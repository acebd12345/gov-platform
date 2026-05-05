import { Container } from '../components/Container';
import { SectionHeader } from '../components/SectionHeader';

export type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'threads' | 'twitter';

export interface SocialPost {
  platform: SocialPlatform;
  /** 連結到原始貼文 / 影片 / 帳號 */
  href: string;
  /** 縮圖 URL */
  imageUrl?: string;
  caption?: string;
  /** 相對時間，例如 "2 天前" 或 "2026/05/01" */
  meta?: string;
}

const PLATFORM_META: Record<SocialPlatform, { label: string; color: string; icon: string }> = {
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
  instagram: { label: 'Instagram', color: '#E4405F', icon: 'M16 2H8a6 6 0 0 0-6 6v8a6 6 0 0 0 6 6h8a6 6 0 0 0 6-6V8a6 6 0 0 0-6-6zm-4 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm5.5-1a1 1 0 1 1 0 2 1 1 0 0 1 0-2z' },
  youtube: { label: 'YouTube', color: '#FF0000', icon: 'M22 8s-.2-1.4-.8-2c-.7-.8-1.6-.8-2-.9C16.3 5 12 5 12 5s-4.3 0-7.2.1c-.4.1-1.3.1-2 .9C2.2 6.6 2 8 2 8S1.8 9.6 1.8 11.3v1.4c0 1.7.2 3.3.2 3.3s.2 1.4.8 2c.7.8 1.7.8 2.1.9 1.5.1 6.4.1 6.4.1s4.3 0 7.2-.1c.4-.1 1.3-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.3v-1.4C22.2 9.6 22 8 22 8z' },
  threads: { label: 'Threads', color: '#000000', icon: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm3 11.5a3.5 3.5 0 1 1-7 0c0-1.5 1-3 3-3' },
  twitter: { label: 'X', color: '#000000', icon: 'M18 4h3l-7 8 8 10h-6l-5-6-5 6H3l7-9-7-9h6l4 5z' },
};

export type SocialFeedVariant = 'card' | 'masonry' | 'list';

/** 社群動態牆，三種視覺：card（卡片網格）/ masonry（不規則高度）/ list（純連結列） */
export function SocialFeed({
  title = '社群動態',
  items,
  variant = 'card',
}: {
  title?: string;
  items: SocialPost[];
  variant?: SocialFeedVariant;
}) {
  if (items.length === 0) return null;
  if (variant === 'list') return <ListVariant title={title} items={items} />;
  if (variant === 'masonry') return <MasonryVariant title={title} items={items} />;
  // card (default)
  return (
    <section style={{ padding: '32px 0' }}>
      <Container>
        <SectionHeader title={title} />
        <div className="gov-social-grid">
          {items.map((post, idx) => {
            const meta = PLATFORM_META[post.platform];
            return (
              <a
                key={idx}
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'var(--color-text)',
                  minHeight: 280,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                <div
                  style={{
                    height: 180,
                    background: post.imageUrl
                      ? `url(${post.imageUrl}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${meta.color}88, ${meta.color})`,
                    position: 'relative',
                  }}
                >
                  <span
                    aria-label={meta.label}
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: meta.color,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d={meta.icon} />
                    </svg>
                  </span>
                </div>
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {post.caption && (
                    <div
                      style={{
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {post.caption}
                    </div>
                  )}
                  {post.meta && (
                    <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 'auto' }}>
                      {post.meta}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

// ===== List variant（純連結列） =====
function ListVariant({ title, items }: { title: string; items: SocialPost[] }) {
  return (
    <section style={{ padding: '32px 0' }}>
      <Container>
        <SectionHeader title={title} />
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 0,
          }}
        >
          {items.map((post, idx) => {
            const meta = PLATFORM_META[post.platform];
            return (
              <li
                key={idx}
                style={{ borderBottom: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}
              >
                <a
                  href={post.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                  }}
                >
                  <span
                    aria-label={meta.label}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: meta.color,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d={meta.icon} />
                    </svg>
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {post.caption ?? `查看 ${meta.label} 貼文`}
                  </span>
                  {post.meta && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {post.meta}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

// ===== Masonry variant（不規則高度，Pinterest 風） =====
function MasonryVariant({ title, items }: { title: string; items: SocialPost[] }) {
  return (
    <section style={{ padding: '32px 0' }}>
      <Container>
        <SectionHeader title={title} />
        <div
          style={{
            columnCount: 3,
            columnGap: 12,
          }}
          className="gov-masonry"
        >
          {items.map((post, idx) => {
            const meta = PLATFORM_META[post.platform];
            const heightVariation = [240, 320, 200, 280, 360, 220][idx % 6];
            return (
              <a
                key={idx}
                href={post.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  marginBottom: 12,
                  breakInside: 'avoid',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'var(--color-text)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                }}
              >
                <div
                  style={{
                    height: heightVariation,
                    background: post.imageUrl
                      ? `url(${post.imageUrl}) center/cover no-repeat`
                      : `linear-gradient(135deg, ${meta.color}88, ${meta.color})`,
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: meta.color,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d={meta.icon} />
                    </svg>
                  </span>
                </div>
                {(post.caption || post.meta) && (
                  <div style={{ padding: '10px 12px' }}>
                    {post.caption && (
                      <div
                        style={{
                          fontSize: 12.5,
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {post.caption}
                      </div>
                    )}
                    {post.meta && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        {post.meta}
                      </div>
                    )}
                  </div>
                )}
              </a>
            );
          })}
        </div>
        <style>{`
          @media (max-width: 900px) { .gov-masonry { column-count: 2; } }
          @media (max-width: 540px) { .gov-masonry { column-count: 1; } }
        `}</style>
      </Container>
    </section>
  );
}
