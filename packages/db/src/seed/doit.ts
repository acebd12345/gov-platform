/**
 * Seed script: doit 租戶測試資料（真實資訊局新聞）
 * 用法：npx tsx src/seed/doit.ts
 */
import { db, createTenantSchema } from '../connection.js';
import { sql } from 'drizzle-orm';

/** db.execute() 回傳陣列，統一取值 */
function rows(result: any): any[] {
  if (Array.isArray(result)) return result;
  if (result?.rows && Array.isArray(result.rows)) return result.rows;
  return [];
}

async function main() {
  console.log('🌱 開始 seed doit 租戶資料...\n');

  // ── 1. 確認 doit 租戶存在 + 注入 brand_tokens / homepage_config ──
  // 政府藍 + 簡潔 + 對外服務卡風格（對應 doit.gov.taipei）
  const brandTokens = JSON.stringify({
    '--color-brand-primary': '#0C5299',
    '--color-brand-secondary': '#E8F0F8',
    '--color-brand-accent': '#0C5299',
    '--color-bg': '#FFFFFF',
    '--color-bg-alt': '#F8FAFB',
    '--color-text': '#1A1D23',
    '--color-text-muted': '#6B7280',
    '--color-border': '#E2E8F0',
    '--color-link': '#0C5299',
    '--color-footer-bg': '#1F2937',
    '--color-footer-text': '#D1D5DB',
    '--color-tag-bg': '#0C5299',
    '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
    en_name: 'DEPARTMENT OF INFORMATION TECHNOLOGY',
    en_org: 'TAIPEI CITY GOVERNMENT',
    address: '11008 臺北市信義區市府路 1 號',
    phone: '(02) 2720-8889',
    service_hours: '週一至週五 08:30–17:30',
  });

  const homepageConfig = JSON.stringify({
    sections: {
      topUtility: true,
      hero: true,
      searchHero: true,
      news: true,
      events: false,         // 資訊局沒這區
      quickServices: false,  // 資訊局沒這區
      business: true,
      externalServices: true,
      map: false,
      progress: false,
      affiliates: false,
      satisfaction: true,
    },
    topUtility: {
      items: [
        { label: '網站導覽', href: '#' },
        { label: 'English', href: '#' },
        { label: '陳情系統', href: 'https://hello.gov.taipei', openNewTab: true },
        { label: '常見問答', href: '#' },
        { label: '台北通', href: 'https://id.gov.taipei', openNewTab: true, emphasized: true },
      ],
    },
    heroSlides: [
      {
        title: 'AI IS IN TAIPEI',
        subtitle: '智慧治理．資料驅動',
        body: '推動智慧城市應用、資料治理、開源協作，打造市民有感的數位服務',
        ctaLabel: '了解更多',
        ctaHref: '/news',
      },
    ],
    heroIntervalSec: 6,
    searchHero: {
      title: '搜尋資訊局服務',
      placeholder: '請輸入關鍵字',
      action: '/search',
      hotKeywords: ['資料大平臺', '智慧城市', '台北通', '開源', 'API'],
    },
    quickServices: [],
    businessCards: [
      { title: '數位策略中心', description: '城市數位轉型策略\n與政策規劃', href: '#', icon: 'creative' },
      { title: '資通安全中心', description: '市府資安治理\n與風險防護', href: '#', icon: 'heritage' },
      { title: '系統研發中心', description: '系統開發、整合\n與雲端基礎建設', href: '#', icon: 'film' },
      { title: '數據治理中心', description: '資料治理、開放資料\n與資料分析', href: '#', icon: 'book' },
      { title: '數位創新中心', description: 'PoC 試行、開源協作\n與創新實驗', href: '#', icon: 'arts' },
    ],
    externalServices: {
      title: '對外服務',
      items: [
        {
          title: '臺北城市儀表板',
          description: '市政指標即時視覺化',
          href: 'https://citydashboard.taipei',
          badge: 'DASHBOARD',
        },
        {
          title: '智慧支付',
          description: '繳費 ‧ 票證 ‧ 一站式',
          href: 'https://pay.taipei',
          badge: 'pay.taipei',
        },
        {
          title: '資料大平臺',
          description: '開放資料集 / API / 檔案',
          href: 'https://data.taipei',
          badge: 'OPEN DATA',
        },
        {
          title: 'TaipeiPASS',
          description: '台北通數位身分整合',
          href: 'https://id.gov.taipei',
          badge: '台北通',
        },
      ],
    },
    newsTabs: {
      tabs: [
        { label: '新聞稿', filterType: 'news', moreHref: '/news' },
        { label: '影音專區', filterType: 'custom', moreHref: '/news' },
        { label: '本府消息', filterType: 'about', moreHref: '/news' },
        { label: '本府活動', filterType: 'service', moreHref: '/news' },
      ],
    },
    satisfaction: {
      title: '滿意度調查',
      question: '您對本網站的整體滿意度為何？',
    },
    footer: {
      groups: [
        {
          items: [
            { label: '政府網站資料開放宣告', href: '#' },
            { label: '隱私權及資訊安全政策', href: '#' },
            { label: '聯絡我們', href: '#' },
            { label: '雙語辭彙', href: '#' },
          ],
        },
        {
          items: [
            { label: '我的E政府', href: 'https://www.gov.tw' },
            { label: '臺北市政府', href: 'https://www.gov.taipei' },
            { label: '無障礙檢測', href: '#' },
          ],
        },
      ],
      openData: {
        title: '開放資料',
        items: [
          { label: 'data.taipei', href: 'https://data.taipei' },
          { label: 'GitHub', href: 'https://github.com/' },
        ],
        ctaLabel: '查看更多',
        ctaHref: 'https://data.taipei',
      },
    },
  });

  let tenantId: string;
  const tenantResult = rows(await db.execute(
    sql`SELECT id FROM public.tenants WHERE slug = 'doit' LIMIT 1`
  ));

  if (tenantResult.length > 0) {
    tenantId = tenantResult[0].id;
    await db.execute(sql`
      UPDATE public.tenants
         SET name = '資訊局',
             domain = 'doit.gov.taipei',
             brand_tokens = ${brandTokens}::jsonb,
             homepage_config = ${homepageConfig}::jsonb
       WHERE id = ${tenantId}
    `);
  } else {
    console.log('⚠️  找不到 doit 租戶，自動建立...');
    const insertResult = rows(await db.execute(sql`
      INSERT INTO public.tenants (slug, name, domain, brand_tokens, homepage_config, review_required)
      VALUES ('doit', '資訊局', 'doit.gov.taipei',
              ${brandTokens}::jsonb, ${homepageConfig}::jsonb, true)
      ON CONFLICT (slug) DO UPDATE SET
        name = '資訊局',
        brand_tokens = ${brandTokens}::jsonb,
        homepage_config = ${homepageConfig}::jsonb
      RETURNING id
    `));
    tenantId = insertResult[0].id;
  }
  console.log(`✅ doit tenant id: ${tenantId}`);

  // ── 2. 取得任一使用者作為 author ──
  const userResult = rows(await db.execute(
    sql`SELECT id FROM public.users LIMIT 1`
  ));
  if (userResult.length === 0) {
    console.error('❌ 找不到任何使用者');
    process.exit(1);
  }
  const authorId = userResult[0].id;
  console.log(`✅ author id: ${authorId}`);

  // ── 3. 確保 tenant_doit schema + tables 都存在 ──
  console.log('\n📦 確保 tenant_doit schema 和表格存在...');
  try {
    await createTenantSchema('doit');
    console.log('✅ schema + tables 就緒');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('✅ schema + tables 已存在');
    } else {
      throw err;
    }
  }

  const schema = 'tenant_doit';

  // ── 4. 驗證 tables 確實存在 ──
  const tableCheck = rows(await db.execute(sql.raw(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = '${schema}'
    ORDER BY table_name
  `)));
  const tables = tableCheck.map((r: any) => r.table_name);
  console.log(`📋 tenant_doit 有 ${tables.length} 張表: ${tables.join(', ')}`);

  if (!tables.includes('pages')) {
    console.error('❌ pages 表不存在！');
    process.exit(1);
  }

  // ── 5. 清空舊資料 ──
  console.log('\n🗑  清空舊資料...');
  await db.execute(sql.raw(`DELETE FROM "${schema}".page_categories`));
  await db.execute(sql.raw(`DELETE FROM "${schema}".page_versions`));
  await db.execute(sql.raw(`DELETE FROM "${schema}".pages`));
  await db.execute(sql.raw(`DELETE FROM "${schema}".navigation_items`));
  await db.execute(sql.raw(`DELETE FROM "${schema}".categories`));
  console.log('✅ 清空完成');

  // ── 6. 新增分類 ──
  console.log('\n📂 新增分類...');
  await db.execute(sql.raw(`
    INSERT INTO "${schema}".categories (id, slug, name, sort_order)
    VALUES
      ('11111111-0000-0000-0000-000000000001', 'news', '最新消息', 1),
      ('11111111-0000-0000-0000-000000000002', 'service', '市民服務', 2),
      ('11111111-0000-0000-0000-000000000003', 'smart-city', '智慧城市', 3)
  `));
  console.log('✅ 3 筆分類');

  // ── 7. 新增已發布頁面 + 版本（真實資訊局新聞）──
  console.log('\n📰 新增頁面...');
  const now = new Date().toISOString();

  const pages = [
    {
      id: '22222222-0000-0000-0000-000000000001',
      slug: '2026-smart-city-expo',
      type: 'news',
      title: '2026智慧城市展圓滿落幕 北市府以「AI IS IN TAIPEI」為主題展現智慧治理成果',
      seoDesc: '臺北市政府於2026智慧城市展設立「臺北市政府願景館」，規劃「市民服務」、「城市安全」及「城市治理」三大展區，展現科技應用於市政運作與公共服務成果。',
      publishAt: '2026-03-28T08:00:00.000Z',
    },
    {
      id: '22222222-0000-0000-0000-000000000002',
      slug: 'ieee-smart-city-award-2025',
      type: 'news',
      title: '北市奪下2025 IEEE智慧城市首獎 開源治理登上國際舞台',
      seoDesc: '臺北市政府以「開源×開放資料」雙引擎策略，全面開放儀表板程式碼與資料標準，榮獲IEEE智慧城市首獎。',
      publishAt: '2025-11-27T08:00:00.000Z',
    },
    {
      id: '22222222-0000-0000-0000-000000000003',
      slug: 'data-taipei-2-beta',
      type: 'news',
      title: '臺北市資料開放新平台上線！Data.Taipei 2.0 Beta版邀您搶先體驗',
      seoDesc: 'Data.Taipei 2.0 Beta版新增自動搜尋建議、智慧圖表、數位儀表板及開放資料推薦功能，整合「台北通3.0」會員機制。',
      publishAt: '2025-09-15T08:00:00.000Z',
    },
  ];

  for (const p of pages) {
    const escapedTitle = p.title.replace(/'/g, "''");
    const escapedDesc = p.seoDesc.replace(/'/g, "''");

    await db.execute(sql.raw(`
      INSERT INTO "${schema}".pages
        (id, slug, type, status, locale, author_id, reviewer_id, publish_at, created_at, updated_at)
      VALUES
        ('${p.id}', '${p.slug}', '${p.type}', 'published', 'zh-TW',
         '${authorId}', '${authorId}', '${p.publishAt}', '${now}', '${now}')
    `));
    console.log(`  ✅ page: ${p.slug}`);

    await db.execute(sql.raw(`
      INSERT INTO "${schema}".page_versions
        (page_id, version_number, title, body_json, seo_description, change_summary, created_by)
      VALUES
        ('${p.id}', 1,
         '${escapedTitle}',
         '{}',
         '${escapedDesc}',
         '初始建立',
         '${authorId}')
    `));
    console.log(`  ✅ version: ${p.slug}`);
  }

  // ── 8. 新增導覽列 ──
  console.log('\n🧭 新增導覽列...');
  await db.execute(sql.raw(`
    INSERT INTO "${schema}".navigation_items
      (label, url, sort_order, is_visible, open_new_tab)
    VALUES
      ('認識本局', '/about', 1, true, false),
      ('本府消息', '/news', 2, true, false),
      ('業務職掌', '/services', 3, true, false),
      ('智慧城市', '/smart-city', 4, true, false),
      ('資料大平臺', '/open-data', 5, true, false),
      ('政府資訊公開', '/transparency', 6, true, false)
  `));
  console.log('✅ 6 筆導覽項目');

  // ── 9. 驗證 ──
  console.log('\n🔍 驗證...');
  const pc = rows(await db.execute(sql.raw(`SELECT count(*) as cnt FROM "${schema}".pages WHERE status = 'published'`)));
  const vc = rows(await db.execute(sql.raw(`SELECT count(*) as cnt FROM "${schema}".page_versions`)));
  const nc = rows(await db.execute(sql.raw(`SELECT count(*) as cnt FROM "${schema}".navigation_items`)));
  const cc = rows(await db.execute(sql.raw(`SELECT count(*) as cnt FROM "${schema}".categories`)));

  console.log(`  pages (published): ${pc[0]?.cnt}`);
  console.log(`  page_versions:     ${vc[0]?.cnt}`);
  console.log(`  navigation_items:  ${nc[0]?.cnt}`);
  console.log(`  categories:        ${cc[0]?.cnt}`);

  console.log('\n🎉 seed 完成！');
  console.log('👉 curl "http://localhost:4000/api/v1/open/pages" -H "X-Tenant-ID: doit"');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Seed 失敗：', err);
  process.exit(1);
});
