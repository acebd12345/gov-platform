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

  // ── 1. 確認 doit 租戶存在，沒有就建立 ──
  let tenantId: string;
  const tenantResult = rows(await db.execute(
    sql`SELECT id FROM public.tenants WHERE slug = 'doit' LIMIT 1`
  ));

  if (tenantResult.length > 0) {
    tenantId = tenantResult[0].id;
  } else {
    console.log('⚠️  找不到 doit 租戶，自動建立...');
    const insertResult = rows(await db.execute(sql`
      INSERT INTO public.tenants (slug, name, domain, brand_tokens, review_required)
      VALUES ('doit', '資訊局', 'doit.gov.taipei', '{}', true)
      ON CONFLICT (slug) DO UPDATE SET name = '資訊局'
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
