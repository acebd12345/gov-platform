/**
 * Seed script: culture 租戶測試資料（文化局示範新聞）
 * 用法：npx tsx src/seed/culture.ts
 */
import { db, createTenantSchema } from '../connection.js';
import { sql } from 'drizzle-orm';

function rows(result: any): any[] {
  if (Array.isArray(result)) return result;
  if (result?.rows && Array.isArray(result.rows)) return result.rows;
  return [];
}

async function main() {
  console.log('🌱 開始 seed culture 租戶資料...\n');

  // ── 1. 確認 culture 租戶存在，沒有就建立（順便注入文化局風格 brand tokens） ──
  let tenantId: string;
  const tenantResult = rows(
    await db.execute(sql`SELECT id FROM public.tenants WHERE slug = 'culture' LIMIT 1`)
  );

  // 文化局視覺：金茶 + 米色 + 深墨綠頁尾（依設計稿）
  const brandTokens = JSON.stringify({
    '--color-brand-primary': '#B89968',
    '--color-brand-secondary': '#EFE6D6',
    '--color-brand-accent': '#A88A4F',
    '--color-bg': '#F8F2E8',
    '--color-bg-alt': '#FFFFFF',
    '--color-surface': '#FFFFFF',
    '--color-text': '#2D2A24',
    '--color-text-muted': '#7A6F5E',
    '--color-border': '#E5DDD0',
    '--color-link': '#A88A4F',
    '--color-footer-bg': '#2C3D33',
    '--color-footer-text': '#D6CFC2',
    '--color-footer-heading': '#FFFFFF',
    '--color-date-badge': '#A02C2C',
    '--color-tag-bg': '#B89968',
    '--font-heading': "'Noto Serif TC', 'Noto Sans TC', serif",
    en_name: 'DEPARTMENT OF CULTURAL AFFAIRS',
    en_org: 'TAIPEI CITY GOVERNMENT',
    address: '11008 臺北市信義區市府路 1 號 4 樓北區',
    phone: '(02) 2720-8889',
    service_hours: '週一至週五 08:30–17:30',
    email: 'culture@gov.taipei',
  });

  // 首頁模組預設設定（後台「首頁模組」可改）
  const homepageConfig = JSON.stringify({
    sections: {
      hero: true,
      news: true,
      events: true,
      quickServices: true,
      business: true,
      map: true,
      progress: true,
      affiliates: true,
      satisfaction: true,
    },
    heroSlides: [
      {
        title: '文化．臺北',
        subtitle: '藝述城市的日常',
        body: '探索城市文化底蘊，感受臺北的藝文能量',
        ctaLabel: '探索更多',
        ctaHref: '/news',
      },
      {
        title: '2026 兒童藝術節',
        subtitle: '玩出藝術新想像',
        body: '8 月份國父紀念館登場，免費入場',
        ctaLabel: '查看活動',
        ctaHref: '/news',
      },
      {
        title: '老屋新生大獎',
        subtitle: '徵件開跑',
        body: '首獎獎金 50 萬元，6 月 30 日截止',
        ctaLabel: '了解更多',
        ctaHref: '/news/old-city-renewal-grant-2026',
      },
    ],
    heroIntervalSec: 6,
    affiliates: [
      { name: '中山堂', href: '#', abbr: '堂' },
      { name: '臺北市文獻館', href: '#', abbr: '獻' },
      { name: '臺北市立交響樂團', href: '#', abbr: '響' },
      { name: '臺北市立美術館', href: '#', abbr: '美' },
      { name: '臺北市立國樂團', href: '#', abbr: '國' },
      { name: '藝文推廣處', href: '#', abbr: '藝' },
    ],
    quickServices: [
      { label: '線上申辦', href: '#', icon: 'apply' },
      { label: '進度查詢', href: '#', icon: 'status' },
      { label: '場地租借', href: '#', icon: 'venue' },
      { label: '街頭藝人登記', href: '#', icon: 'street-artist' },
      { label: '補助專區', href: '#', icon: 'money' },
      { label: '常見問答', href: '#', icon: 'chat' },
    ],
    businessCards: [
      { title: '文化資產', description: '古蹟、歷史建築、文化景觀\n保存與活化', href: '#', icon: 'heritage' },
      { title: '藝術發展', description: '視覺藝術、表演藝術\n及藝文推廣', href: '#', icon: 'arts' },
      { title: '文創產業', description: '文創輔導、品牌發展\n與產業媒合', href: '#', icon: 'creative' },
      { title: '圖書館與閱讀', description: '城市閱讀．推廣與\n圖書館服務', href: '#', icon: 'book' },
      { title: '影視音發展', description: '影視協拍、拍片支援\n與產業發展', href: '#', icon: 'film' },
      { title: '文化交流', description: '國際交流、城市合作\n與駐村計畫', href: '#', icon: 'exchange' },
      { title: '補助申請', description: '藝文補助、活動補助\n線上申辦', href: '#', icon: 'subsidy' },
    ],
    events: {
      featured: {
        title: '2026 臺北電影節',
        dateRange: '06.01 — 06.30',
        venue: '臺北市中山堂、光點華山電影館',
      },
      items: [
        { title: '市民講座系列\n文化資產保存新思維', dateRange: '06.15', venue: '臺北市立圖書館總館' },
        { title: '當代藝術展覽\n邊界 ／ 無限', dateRange: '06.22 — 07.14', venue: '臺北當代藝術館' },
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
            { label: '網站導覽', href: '#' },
            { label: '隱私權宣告', href: '#' },
            { label: '資訊安全政策', href: '#' },
            { label: '政府網站資料開放宣告', href: '#' },
          ],
        },
        {
          items: [
            { label: '無障礙服務專區', href: '#' },
            { label: '意見信箱', href: '#' },
            { label: '雙語詞彙', href: '#' },
            { label: '相關連結', href: '#' },
          ],
        },
      ],
      openData: {
        title: '開放資料',
        items: [
          { label: 'API 介接說明 (JSON)', href: '#' },
          { label: '資料集下載', href: '#' },
        ],
        ctaLabel: '了解更多',
        ctaHref: '#',
      },
    },
  });

  if (tenantResult.length > 0) {
    tenantId = tenantResult[0].id;
    await db.execute(sql`
      UPDATE public.tenants
         SET name = '文化局',
             domain = 'culture.gov.taipei',
             brand_tokens = ${brandTokens}::jsonb,
             homepage_config = ${homepageConfig}::jsonb
       WHERE id = ${tenantId}
    `);
  } else {
    console.log('⚠️  找不到 culture 租戶，自動建立...');
    const insertResult = rows(
      await db.execute(sql`
        INSERT INTO public.tenants (slug, name, domain, brand_tokens, homepage_config, review_required)
        VALUES ('culture', '文化局', 'culture.gov.taipei',
                ${brandTokens}::jsonb, ${homepageConfig}::jsonb, true)
        ON CONFLICT (slug) DO UPDATE SET
          name = '文化局',
          domain = 'culture.gov.taipei',
          brand_tokens = ${brandTokens}::jsonb,
          homepage_config = ${homepageConfig}::jsonb
        RETURNING id
      `)
    );
    tenantId = insertResult[0].id;
  }
  console.log(`✅ culture tenant id: ${tenantId}`);

  // ── 2. 取得任一使用者作為 author ──
  const userResult = rows(await db.execute(sql`SELECT id FROM public.users LIMIT 1`));
  if (userResult.length === 0) {
    console.error('❌ 找不到任何使用者（請先 seed users）');
    process.exit(1);
  }
  const authorId = userResult[0].id;
  console.log(`✅ author id: ${authorId}`);

  // ── 3. 確保 tenant_culture schema + tables 存在 ──
  console.log('\n📦 確保 tenant_culture schema 和表格存在...');
  try {
    await createTenantSchema('culture');
    console.log('✅ schema + tables 就緒');
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      console.log('✅ schema + tables 已存在');
    } else {
      throw err;
    }
  }

  const schema = 'tenant_culture';

  // ── 4. 清空舊資料 ──
  console.log('\n🗑  清空舊資料...');
  await db.execute(sql.raw(`DELETE FROM "${schema}".page_categories`));
  await db.execute(sql.raw(`DELETE FROM "${schema}".page_versions`));
  await db.execute(sql.raw(`DELETE FROM "${schema}".pages`));
  await db.execute(sql.raw(`DELETE FROM "${schema}".navigation_items`));
  await db.execute(sql.raw(`DELETE FROM "${schema}".categories`));
  console.log('✅ 清空完成');

  // ── 5. 分類（業務專區的 7 個區塊）──
  console.log('\n📂 新增分類...');
  await db.execute(sql.raw(`
    INSERT INTO "${schema}".categories (id, slug, name, sort_order)
    VALUES
      ('33333333-0000-0000-0000-000000000001', 'cultural-heritage', '文化資產', 1),
      ('33333333-0000-0000-0000-000000000002', 'arts-development', '藝術發展', 2),
      ('33333333-0000-0000-0000-000000000003', 'creative-industry', '文創產業', 3),
      ('33333333-0000-0000-0000-000000000004', 'library', '圖書館與閱讀', 4),
      ('33333333-0000-0000-0000-000000000005', 'media-arts', '影視音發展', 5),
      ('33333333-0000-0000-0000-000000000006', 'cultural-exchange', '文化交流', 6),
      ('33333333-0000-0000-0000-000000000007', 'subsidy', '補助申請', 7)
  `));
  console.log('✅ 7 筆分類');

  // ── 6. 頁面 + 版本 ──
  console.log('\n📰 新增頁面...');
  const now = new Date().toISOString();

  const pages = [
    {
      id: '44444444-0000-0000-0000-000000000001',
      slug: '2026-taipei-lantern-festival',
      type: 'news',
      title: '2026 臺北燈節「光耀城北」開展　逾 200 件燈飾照亮中山堂周邊',
      seoDesc:
        '臺北市文化局公布 2026 臺北燈節主題「光耀城北」，主燈以代表城市再生的鳳凰意象呈現，展期自 2 月 14 日至 2 月 25 日。',
      publishAt: '2026-02-13T10:00:00.000Z',
      body: [
        '臺北市文化局今日公布 2026 臺北燈節主題為「光耀城北」，將於中山堂、北門、撫臺街洋樓等城北歷史街區設置 200 餘件燈飾。',
        '主燈以鳳凰為意象，象徵城市再生與文化傳承。展期自 2 月 14 日起至 2 月 25 日，每日下午 5 時至晚間 10 時亮燈。',
        '今年燈節首度結合 AR 互動導覽，民眾可透過手機掃描燈飾旁 QR Code，聆聽藝術家親自介紹創作理念。',
      ],
    },
    {
      id: '44444444-0000-0000-0000-000000000002',
      slug: 'taipei-music-center-anniversary',
      type: 'news',
      title: '臺北流行音樂中心歡慶五週年　推出「世代．聲線」特展',
      seoDesc:
        '北流五週年特展以「世代．聲線」為題，回顧 1980 年代以降的臺灣流行音樂史，展出珍貴手稿、母帶與舞台服裝等百餘件展品。',
      publishAt: '2026-04-22T08:00:00.000Z',
      body: [
        '臺北流行音樂中心（北流）今年迎來開幕五週年，自 5 月 1 日起推出「世代．聲線」常設特展。',
        '特展以三個世代為脈絡：民歌時期、解嚴後的搖滾浪潮、與當代獨立音樂場景，呈現臺灣流行音樂四十年來的軌跡。',
        '展品涵蓋羅大佑、伍佰、滅火器等樂人捐贈的手稿與母帶共百餘件，並設置互動聆聽區供民眾體驗經典作品。',
      ],
    },
    {
      id: '44444444-0000-0000-0000-000000000003',
      slug: 'old-city-renewal-grant-2026',
      type: 'news',
      title: '老屋新生大獎徵件開跑　首獎獎金提高至 50 萬元',
      seoDesc:
        '2026 年「臺北老屋新生大獎」即日起至 6 月 30 日受理報名，鼓勵屋齡 30 年以上建築改造再利用，首獎獎金提高至新臺幣 50 萬元。',
      publishAt: '2026-04-10T09:00:00.000Z',
      body: [
        '為鼓勵老屋活化再利用，文化局自 4 月 15 日起辦理「2026 臺北老屋新生大獎」徵件。',
        '凡屋齡滿 30 年、座落於臺北市轄內並完成修繕之建築物均可參賽，分為居住類、商業類、公共類三組。',
        '今年首獎獎金提高至新臺幣 50 萬元，截止日期為 2026 年 6 月 30 日。詳情請洽文化局網站或撥打諮詢專線。',
      ],
    },
  ];

  for (const p of pages) {
    const tEsc = p.title.replace(/'/g, "''");
    const dEsc = p.seoDesc.replace(/'/g, "''");
    const bodyJson = JSON.stringify({
      type: 'doc',
      content: p.body.map((paragraph) => ({
        type: 'paragraph',
        content: [{ type: 'text', text: paragraph }],
      })),
    }).replace(/'/g, "''");

    await db.execute(sql.raw(`
      INSERT INTO "${schema}".pages
        (id, slug, type, status, locale, author_id, reviewer_id, publish_at, created_at, updated_at)
      VALUES
        ('${p.id}', '${p.slug}', '${p.type}', 'published', 'zh-TW',
         '${authorId}', '${authorId}', '${p.publishAt}', '${now}', '${now}')
    `));

    await db.execute(sql.raw(`
      INSERT INTO "${schema}".page_versions
        (page_id, version_number, title, body_json, seo_description, change_summary, created_by)
      VALUES
        ('${p.id}', 1,
         '${tEsc}',
         '${bodyJson}'::jsonb,
         '${dEsc}',
         '初始建立',
         '${authorId}')
    `));
    console.log(`  ✅ page+version: ${p.slug}`);
  }

  // ── 7. 導覽列（5 大類 mega menu，原 11 項合併為子選單）──
  console.log('\n🧭 新增導覽列...');

  const mainMenus: Array<{ label: string; url: string; children: string[] }> = [
    {
      label: '公告資訊',
      url: '/news',
      children: [
        '新聞稿',
        '最新消息',
        '轉知訊息',
        '招標資訊',
        '檔案應用',
        '影音專區',
        '歷年文化節慶',
        '臺北文化獎',
        '白晝之夜',
        '電影節',
        '藝穗節',
        '文學季',
      ],
    },
    {
      label: '業務專區',
      url: '/services',
      children: [
        '文化資產',
        '藝術發展',
        '文創產業',
        '圖書館與閱讀',
        '影視音發展',
        '文化交流',
        '臺北藝文空間',
        '表演空間',
        '展覽空間',
        '街頭藝人',
        '文創徒步區',
        '有形文化資產',
        '無形文化資產',
        '老房子文化運動',
        '受保護樹木',
        '公共藝術',
      ],
    },
    {
      label: '服務申辦',
      url: '/services',
      children: ['補助申請', '空間申請', '各項申辦', '聯絡科室電話', '交通位置', '意見信箱'],
    },
    {
      label: '資訊公開',
      url: '/about',
      children: [
        '廉政專區',
        '陽光法案',
        '遊說法',
        '檢舉管道',
        '公益揭弊者保護法',
        '法令公告',
        '預算與決算',
        '業務統計',
        '人事室公告',
        '局務會議',
      ],
    },
    {
      label: '關於本局',
      url: '/about',
      children: [
        '組織架構',
        '首長介紹',
        '業務職掌',
        '附屬機關／法人',
        '大事紀',
        '聯絡資訊',
      ],
    },
  ];

  for (let i = 0; i < mainMenus.length; i++) {
    const m = mainMenus[i];
    const labelEsc = m.label.replace(/'/g, "''");

    // root（用 RETURNING 拿 id，避免欄位假設）
    const inserted = rows(await db.execute(sql.raw(`
      INSERT INTO "${schema}".navigation_items (label, url, sort_order, is_visible, open_new_tab)
      VALUES ('${labelEsc}', '${m.url}', ${i + 1}, true, false)
      RETURNING id
    `)));
    const parentId = inserted[0]?.id;
    if (!parentId || m.children.length === 0) continue;

    for (let j = 0; j < m.children.length; j++) {
      const childLabel = m.children[j].replace(/'/g, "''");
      await db.execute(sql.raw(`
        INSERT INTO "${schema}".navigation_items (parent_id, label, url, sort_order, is_visible, open_new_tab)
        VALUES ('${parentId}', '${childLabel}', '${m.url}', ${j + 1}, true, false)
      `));
    }
  }

  const navTotal = rows(await db.execute(sql.raw(
    `SELECT count(*) as cnt FROM "${schema}".navigation_items`
  )));
  console.log(`✅ ${navTotal[0]?.cnt} 筆導覽項目（含子選單）`);

  // ── 8. 驗證 ──
  console.log('\n🔍 驗證...');
  const pc = rows(await db.execute(sql.raw(
    `SELECT count(*) as cnt FROM "${schema}".pages WHERE status = 'published'`
  )));
  const vc = rows(await db.execute(sql.raw(
    `SELECT count(*) as cnt FROM "${schema}".page_versions`
  )));
  const nc = rows(await db.execute(sql.raw(
    `SELECT count(*) as cnt FROM "${schema}".navigation_items`
  )));

  console.log(`  pages (published): ${pc[0]?.cnt}`);
  console.log(`  page_versions:     ${vc[0]?.cnt}`);
  console.log(`  navigation_items:  ${nc[0]?.cnt}`);

  console.log('\n🎉 seed 完成！');
  console.log('👉 前台：http://localhost:3002/?tenant=culture');
  console.log('👉 API： curl "http://localhost:4000/api/v1/open/pages" -H "X-Tenant-ID: culture"');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Seed 失敗：', err);
  process.exit(1);
});
