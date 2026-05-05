import { Container, Card, PageList } from '@gov/ui';
import { getTenantSlug } from '@/lib/tenant';
import { fetchPages } from '@/lib/api';

export const revalidate = 300;

export const metadata = {
  title: '便民服務',
};

export default async function ServicesPage() {
  const slug = await getTenantSlug();
  const result = await fetchPages(slug, { type: 'service', limit: 50 });

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
        便民服務
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
          hrefPrefix="/services"
          emptyText="目前尚無服務項目。"
        />
      </Card>
    </Container>
  );
}
