import Link from 'next/link';
import { Container, Card, PageList } from '@gov/ui';
import { getTenantSlug } from '@/lib/tenant';
import { fetchPages, fetchSite } from '@/lib/api';

export const revalidate = 300;

export default async function HomePage() {
  const slug = await getTenantSlug();
  const [site, news] = await Promise.all([
    fetchSite(slug),
    fetchPages(slug, { limit: 5 }),
  ]);

  return (
    <Container>
      <section style={{ marginBottom: 48 }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            margin: '0 0 12px',
          }}
        >
          {site?.name ?? '歡迎'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
          歡迎光臨。本站提供本局處最新消息、便民服務與相關公告。
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: '2px solid var(--color-brand-primary)',
            paddingBottom: 8,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
            最新消息
          </h2>
          <Link href="/news" style={{ fontSize: 14 }}>
            查看全部 →
          </Link>
        </header>
        <Card padding="none" style={{ padding: '0 20px' }}>
          <PageList
            items={news.items.map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              seoDescription: p.seoDescription,
              publishAt: p.publishAt,
            }))}
            hrefPrefix="/news"
            emptyText="目前尚無最新消息。"
          />
        </Card>
      </section>
    </Container>
  );
}
