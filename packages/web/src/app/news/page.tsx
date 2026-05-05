import { Container, Card, PageList } from '@gov/ui';
import { getTenantSlug } from '@/lib/tenant';
import { fetchPages } from '@/lib/api';

export const revalidate = 300;

export const metadata = {
  title: '最新消息',
};

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const slug = await getTenantSlug();
  const params = await searchParams;
  const pageNum = Math.max(1, parseInt(params.page ?? '1') || 1);
  const result = await fetchPages(slug, { page: pageNum, limit: 20 });

  return (
    <Container>
      <h1
        style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          fontFamily: 'var(--font-heading)',
          borderBottom: '2px solid var(--color-brand-primary)',
          paddingBottom: 8,
          marginBottom: 24,
        }}
      >
        最新消息
      </h1>

      <Card padding="none" style={{ padding: '0 20px' }}>
        <PageList
          items={result.items.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            seoDescription: p.seoDescription,
            publishAt: p.publishAt,
          }))}
          hrefPrefix="/news"
        />
      </Card>

      {result.meta && result.meta.totalPages > 1 && (
        <Pagination meta={result.meta} basePath="/news" />
      )}
    </Container>
  );
}

function Pagination({
  meta,
  basePath,
}: {
  meta: { page: number; totalPages: number };
  basePath: string;
}) {
  const prev = meta.page > 1 ? meta.page - 1 : null;
  const next = meta.page < meta.totalPages ? meta.page + 1 : null;
  return (
    <nav
      aria-label="分頁"
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        marginTop: 24,
        fontSize: 14,
      }}
    >
      {prev && <a href={`${basePath}?page=${prev}`}>← 上一頁</a>}
      <span style={{ color: 'var(--color-text-muted)' }}>
        第 {meta.page} / {meta.totalPages} 頁
      </span>
      {next && <a href={`${basePath}?page=${next}`}>下一頁 →</a>}
    </nav>
  );
}
