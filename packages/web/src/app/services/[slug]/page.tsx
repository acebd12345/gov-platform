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

export default async function ServiceDetailPage({
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
        <Link href="/">首頁</Link> / <Link href="/services">便民服務</Link> /{' '}
        <span>{page.title ?? '(未命名)'}</span>
      </nav>

      <article>
        <header style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {page.title ?? '(未命名)'}
          </h1>
        </header>

        <Card padding="lg">
          <ArticleBody body={page.bodyJson} />
        </Card>
      </article>
    </Container>
  );
}
