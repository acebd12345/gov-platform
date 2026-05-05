import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container, Card, ArticleBody } from '@gov/ui';
import { getTenantSlug } from '@/lib/tenant';
import { fetchPage } from '@/lib/api';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: pageSlug } = await params;
  const tenantSlug = await getTenantSlug();
  const page = await fetchPage(tenantSlug, pageSlug);
  if (!page) return { title: '找不到頁面' };
  return {
    title: page.seoTitle ?? page.title ?? undefined,
    description: page.seoDescription ?? undefined,
  };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: pageSlug } = await params;
  const tenantSlug = await getTenantSlug();
  const page = await fetchPage(tenantSlug, pageSlug);
  if (!page) notFound();

  return (
    <Container width="narrow">
      <nav style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
        <Link href="/">首頁</Link> / <Link href="/news">最新消息</Link> /{' '}
        <span>{page.title ?? '(未命名)'}</span>
      </nav>

      <article>
        <header style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              margin: '0 0 12px',
              lineHeight: 1.4,
            }}
          >
            {page.title ?? '(未命名)'}
          </h1>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
            {page.publishAt && (
              <time dateTime={page.publishAt}>發布日期：{formatDate(page.publishAt)}</time>
            )}
            {page.categories.length > 0 && (
              <span>
                分類：
                {page.categories.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && '、'}
                    <Link href={`/news?category=${c.slug}`}>{c.name}</Link>
                  </span>
                ))}
              </span>
            )}
          </div>
        </header>

        <Card padding="lg">
          <ArticleBody body={page.bodyJson} />
        </Card>
      </article>
    </Container>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}
