import { HomepageContent } from '@/components/HomepageContent';
import { getTenantSlug } from '@/lib/tenant';
import { fetchPages, fetchSite, fetchCategories } from '@/lib/api';

export const revalidate = 300;

export default async function HomePage() {
  const slug = await getTenantSlug();
  const [site, news, categories] = await Promise.all([
    fetchSite(slug),
    fetchPages(slug, { limit: 4 }),
    fetchCategories(slug),
  ]);

  return (
    <HomepageContent
      initialConfig={site?.homepageConfig ?? {}}
      newsItems={news.items}
      categories={categories ?? []}
    />
  );
}
