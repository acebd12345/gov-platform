/**
 * Bulk seed: 臺北市政府一級機關（局、處、委員會）32 個 tenant。
 *
 * 用法：npx tsx src/seed/all-tenants.ts
 *
 * 行為：
 *   - 每個機關建立 / 更新 public.tenants 一筆（含 brand_tokens / homepage_config）
 *   - createTenantSchema(slug) 建 tenant_<slug> schema 與表
 *   - 把現存的超級管理員加為 tenant admin（沒有就跳過）
 *   - 不灌新聞/導覽，留待 per-tenant seed（doit.ts / culture.ts）做
 *
 * 安全：用 ON CONFLICT (slug) DO UPDATE，重跑不會炸。已存在的 schema 也跳過。
 */
import { db, createTenantSchema } from '../connection.js';
import { sql } from 'drizzle-orm';

function rows(result: any): any[] {
  if (Array.isArray(result)) return result;
  if (result?.rows && Array.isArray(result.rows)) return result.rows;
  return [];
}

// ===== 8 套主題（對應 admin /settings 預設主題） =====

type ThemeId =
  | 'gov-blue'
  | 'culture-gold'
  | 'eco-green'
  | 'social-pink'
  | 'health-teal'
  | 'tech-purple'
  | 'youth-vibrant'
  | 'legal-navy';

const THEMES: Record<ThemeId, Record<string, string>> = {
  'gov-blue': {
    '--color-brand-primary': '#0C5299', '--color-brand-secondary': '#E8F0F8', '--color-brand-accent': '#083B6E',
    '--color-bg': '#FFFFFF', '--color-bg-alt': '#F8FAFB', '--color-surface': '#FFFFFF',
    '--color-text': '#1A1D23', '--color-text-muted': '#6B7280', '--color-border': '#E2E8F0', '--color-link': '#0C5299',
    '--color-footer-bg': '#1F2937', '--color-footer-text': '#D1D5DB', '--color-footer-heading': '#FFFFFF',
    '--color-tag-bg': '#0C5299', '--color-date-badge': '#A02C2C',
    '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
  },
  'culture-gold': {
    '--color-brand-primary': '#B89968', '--color-brand-secondary': '#EFE6D6', '--color-brand-accent': '#A88A4F',
    '--color-bg': '#F8F2E8', '--color-bg-alt': '#FFFFFF', '--color-surface': '#FFFFFF',
    '--color-text': '#2D2A24', '--color-text-muted': '#7A6F5E', '--color-border': '#E5DDD0', '--color-link': '#A88A4F',
    '--color-footer-bg': '#2C3D33', '--color-footer-text': '#D6CFC2', '--color-footer-heading': '#FFFFFF',
    '--color-tag-bg': '#B89968', '--color-date-badge': '#A02C2C',
    '--font-heading': "'Noto Serif TC', 'Noto Sans TC', serif",
  },
  'eco-green': {
    '--color-brand-primary': '#0F7B3F', '--color-brand-secondary': '#DAEDDA', '--color-brand-accent': '#0A5C2E',
    '--color-bg': '#FFFFFF', '--color-bg-alt': '#F4F9F4', '--color-surface': '#FFFFFF',
    '--color-text': '#1A2E1F', '--color-text-muted': '#5B6B5F', '--color-border': '#D8E5D8', '--color-link': '#0F7B3F',
    '--color-footer-bg': '#1A2E1F', '--color-footer-text': '#C9DACA', '--color-footer-heading': '#FFFFFF',
    '--color-tag-bg': '#0F7B3F', '--color-date-badge': '#D97706',
    '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
  },
  'social-pink': {
    '--color-brand-primary': '#D6336C', '--color-brand-secondary': '#FCE4EC', '--color-brand-accent': '#B02A55',
    '--color-bg': '#FFFFFF', '--color-bg-alt': '#FFF8FA', '--color-surface': '#FFFFFF',
    '--color-text': '#2A1E24', '--color-text-muted': '#7A5C66', '--color-border': '#F0DCE2', '--color-link': '#D6336C',
    '--color-footer-bg': '#3A2530', '--color-footer-text': '#E8D2D8', '--color-footer-heading': '#FFFFFF',
    '--color-tag-bg': '#D6336C', '--color-date-badge': '#A02C2C',
    '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
  },
  'health-teal': {
    '--color-brand-primary': '#0E8388', '--color-brand-secondary': '#DCF1F3', '--color-brand-accent': '#0A6B6F',
    '--color-bg': '#FFFFFF', '--color-bg-alt': '#F4FAFB', '--color-surface': '#FFFFFF',
    '--color-text': '#0F2A30', '--color-text-muted': '#5B7480', '--color-border': '#D5E5E7', '--color-link': '#0E8388',
    '--color-footer-bg': '#1A3742', '--color-footer-text': '#C9DEDC', '--color-footer-heading': '#FFFFFF',
    '--color-tag-bg': '#0E8388', '--color-date-badge': '#C92127',
    '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
  },
  'tech-purple': {
    '--color-brand-primary': '#6D28D9', '--color-brand-secondary': '#EDE9FE', '--color-brand-accent': '#5B21B6',
    '--color-bg': '#FFFFFF', '--color-bg-alt': '#FAF8FF', '--color-surface': '#FFFFFF',
    '--color-text': '#1A1632', '--color-text-muted': '#6B6477', '--color-border': '#E0DCEC', '--color-link': '#6D28D9',
    '--color-footer-bg': '#1E1B4B', '--color-footer-text': '#C7C2E0', '--color-footer-heading': '#FFFFFF',
    '--color-tag-bg': '#6D28D9', '--color-date-badge': '#DC2626',
    '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
  },
  'youth-vibrant': {
    '--color-brand-primary': '#F59E0B', '--color-brand-secondary': '#FEF3C7', '--color-brand-accent': '#D97706',
    '--color-bg': '#FFFFFF', '--color-bg-alt': '#FFFBF0', '--color-surface': '#FFFFFF',
    '--color-text': '#18181B', '--color-text-muted': '#6B6B70', '--color-border': '#EFE5D2', '--color-link': '#D97706',
    '--color-footer-bg': '#18181B', '--color-footer-text': '#D1D1D6', '--color-footer-heading': '#FFFFFF',
    '--color-tag-bg': '#F59E0B', '--color-date-badge': '#DC2626',
    '--font-heading': "'Noto Sans TC', system-ui, sans-serif",
  },
  'legal-navy': {
    '--color-brand-primary': '#1E3A5F', '--color-brand-secondary': '#DDE6F0', '--color-brand-accent': '#152844',
    '--color-bg': '#FFFFFF', '--color-bg-alt': '#F6F8FB', '--color-surface': '#FFFFFF',
    '--color-text': '#0F1F33', '--color-text-muted': '#5C6E80', '--color-border': '#D8DEE6', '--color-link': '#1E3A5F',
    '--color-footer-bg': '#0F1F33', '--color-footer-text': '#C0CCD8', '--color-footer-heading': '#FFFFFF',
    '--color-tag-bg': '#1E3A5F', '--color-date-badge': '#A02C2C',
    '--font-heading': "'Noto Serif TC', 'Noto Sans TC', serif",
  },
};

// ===== 32 個一級機關 =====

interface TenantDef {
  slug: string;
  name: string;
  domain: string;
  theme: ThemeId;
  enName?: string;
  category: 'bureau' | 'office'; // 局 vs 處／委員會
}

const TENANTS: TenantDef[] = [
  // 一級機關（局）
  { slug: 'ca',           name: '民政局',           domain: 'ca.gov.taipei',           theme: 'gov-blue',     enName: 'CIVIL AFFAIRS BUREAU',                    category: 'bureau' },
  { slug: 'dof',          name: '財政局',           domain: 'dof.gov.taipei',          theme: 'legal-navy',   enName: 'DEPARTMENT OF FINANCE',                   category: 'bureau' },
  { slug: 'doe',          name: '教育局',           domain: 'doe.gov.taipei',          theme: 'gov-blue',     enName: 'DEPARTMENT OF EDUCATION',                 category: 'bureau' },
  { slug: 'doed',         name: '產業發展局',       domain: 'doed.gov.taipei',         theme: 'tech-purple',  enName: 'DEPARTMENT OF ECONOMIC DEVELOPMENT',      category: 'bureau' },
  { slug: 'pwd',          name: '工務局',           domain: 'pwd.gov.taipei',          theme: 'gov-blue',     enName: 'PUBLIC WORKS DEPARTMENT',                 category: 'bureau' },
  { slug: 'dot',          name: '交通局',           domain: 'dot.gov.taipei',          theme: 'gov-blue',     enName: 'DEPARTMENT OF TRANSPORTATION',            category: 'bureau' },
  { slug: 'dosw',         name: '社會局',           domain: 'dosw.gov.taipei',         theme: 'social-pink',  enName: 'DEPARTMENT OF SOCIAL WELFARE',            category: 'bureau' },
  { slug: 'bola',         name: '勞動局',           domain: 'bola.gov.taipei',         theme: 'gov-blue',     enName: 'BUREAU OF LABOR AFFAIRS',                 category: 'bureau' },
  { slug: 'police',       name: '警察局',           domain: 'police.gov.taipei',       theme: 'legal-navy',   enName: 'POLICE DEPARTMENT',                       category: 'bureau' },
  { slug: 'health',       name: '衛生局',           domain: 'health.gov.taipei',       theme: 'health-teal',  enName: 'DEPARTMENT OF HEALTH',                    category: 'bureau' },
  { slug: 'dep',          name: '環境保護局',       domain: 'dep.gov.taipei',          theme: 'eco-green',    enName: 'DEPARTMENT OF ENVIRONMENTAL PROTECTION',  category: 'bureau' },
  { slug: 'udd',          name: '都市發展局',       domain: 'udd.gov.taipei',          theme: 'gov-blue',     enName: 'DEPARTMENT OF URBAN DEVELOPMENT',         category: 'bureau' },
  { slug: 'culture',      name: '文化局',           domain: 'culture.gov.taipei',      theme: 'culture-gold', enName: 'DEPARTMENT OF CULTURAL AFFAIRS',          category: 'bureau' },
  { slug: 'fire',         name: '消防局',           domain: '119.gov.taipei',          theme: 'health-teal',  enName: 'TAIPEI CITY FIRE DEPARTMENT',             category: 'bureau' },
  { slug: 'dorts',        name: '捷運工程局',       domain: 'dorts.gov.taipei',        theme: 'gov-blue',     enName: 'DEPARTMENT OF RAPID TRANSIT SYSTEMS',     category: 'bureau' },
  { slug: 'feitsui',      name: '翡翠水庫管理局',   domain: 'feitsui.gov.taipei',      theme: 'eco-green',    enName: 'FEITSUI RESERVOIR ADMINISTRATION',        category: 'bureau' },
  { slug: 'tpedoit',      name: '觀光傳播局',       domain: 'tpedoit.gov.taipei',      theme: 'tech-purple',  enName: 'DEPARTMENT OF INFORMATION AND TOURISM',   category: 'bureau' },
  { slug: 'land',         name: '地政局',           domain: 'land.gov.taipei',         theme: 'gov-blue',     enName: 'DEPARTMENT OF LAND ADMINISTRATION',       category: 'bureau' },
  { slug: 'docms',        name: '兵役局',           domain: 'docms.gov.taipei',        theme: 'legal-navy',   enName: 'CONSCRIPTION DEPARTMENT',                 category: 'bureau' },
  { slug: 'sports',       name: '體育局',           domain: 'sports.gov.taipei',       theme: 'youth-vibrant',enName: 'SPORTS DEPARTMENT',                       category: 'bureau' },
  { slug: 'doit',         name: '資訊局',           domain: 'doit.gov.taipei',         theme: 'gov-blue',     enName: 'DEPARTMENT OF INFORMATION TECHNOLOGY',    category: 'bureau' },
  { slug: 'legalaffairs', name: '法務局',           domain: 'legalaffairs.gov.taipei', theme: 'legal-navy',   enName: 'DEPARTMENT OF LEGAL AFFAIRS',             category: 'bureau' },
  { slug: 'tpyd',         name: '青年局',           domain: 'tpyd.gov.taipei',         theme: 'youth-vibrant',enName: 'DEPARTMENT OF YOUTH DEVELOPMENT',         category: 'bureau' },

  // 一級機關（處、委員會）
  { slug: 'sec',          name: '秘書處',           domain: 'sec.gov.taipei',          theme: 'gov-blue',     enName: 'SECRETARIAT',                             category: 'office' },
  { slug: 'dbas',         name: '主計處',           domain: 'dbas.gov.taipei',         theme: 'legal-navy',   enName: 'BUDGET, ACCOUNTING AND STATISTICS',       category: 'office' },
  { slug: 'dop',          name: '人事處',           domain: 'dop.gov.taipei',          theme: 'gov-blue',     enName: 'DEPARTMENT OF PERSONNEL',                 category: 'office' },
  { slug: 'doge',         name: '政風處',           domain: 'doge.gov.taipei',         theme: 'legal-navy',   enName: 'DEPARTMENT OF GOVERNMENT ETHICS',         category: 'office' },
  { slug: 'dct',          name: '公務人員訓練處',   domain: 'dct.gov.taipei',          theme: 'gov-blue',     enName: 'CIVIL SERVANT DEVELOPMENT INSTITUTE',     category: 'office' },
  { slug: 'rdec',         name: '研究發展考核委員會', domain: 'rdec.gov.taipei',       theme: 'legal-navy',   enName: 'RESEARCH, DEVELOPMENT AND EVALUATION COMMISSION', category: 'office' },
  { slug: 'ipc',          name: '原住民族事務委員會', domain: 'ipc.gov.taipei',        theme: 'culture-gold', enName: 'INDIGENOUS PEOPLES COMMISSION',           category: 'office' },
  { slug: 'hac',          name: '客家事務委員會',   domain: 'hac.gov.taipei',          theme: 'eco-green',    enName: 'HAKKA AFFAIRS COMMISSION',                category: 'office' },
];

// ===== 共用首頁模組預設 =====

function defaultHomepageConfig(t: TenantDef): Record<string, unknown> {
  return {
    sections: {
      topUtility: true,
      hero: true,
      searchHero: false,
      news: true,
      events: false,
      quickServices: false,
      business: true,
      externalServices: false,
      map: false,
      progress: false,
      affiliates: false,
      satisfaction: true,
      liveData: false,
      stats: false,
      audienceSegments: false,
      socialFeed: false,
    },
    heroSlides: [
      {
        title: t.name,
        subtitle: '為市民服務',
        body: '本站提供本機關業務資訊、最新消息與便民服務。',
        ctaLabel: '了解更多',
        ctaHref: '/about',
      },
    ],
    heroIntervalSec: 6,
    topUtility: {
      items: [
        { label: '網站導覽', href: '#' },
        { label: 'English', href: '#' },
        { label: '陳情系統', href: 'https://hello.gov.taipei', openNewTab: true },
        { label: '常見問答', href: '#' },
        { label: '台北通', href: 'https://id.gov.taipei', openNewTab: true, emphasized: true },
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
    },
  };
}

function brandTokensFor(t: TenantDef): Record<string, string> {
  return {
    ...THEMES[t.theme],
    en_name: t.enName ?? '',
    en_org: 'TAIPEI CITY GOVERNMENT',
    address: '臺北市市府路 1 號',
    phone: '(02) 2720-8889',
    service_hours: '週一至週五 08:30–17:30',
  };
}

// ===== Main =====

async function main() {
  console.log(`🌱 開始 seed ${TENANTS.length} 個一級機關...\n`);

  // 取得 super admin（如果有）
  const adminResult = rows(
    await db.execute(sql`SELECT id FROM public.users WHERE is_super_admin = true LIMIT 1`)
  );
  const adminId: string | undefined = adminResult[0]?.id;
  if (adminId) {
    console.log(`✅ 使用 super admin: ${adminId} 自動加為各 tenant 成員\n`);
  } else {
    console.log(`⚠️  找不到 super admin（先跑 npm run db:seed 建立）。會跳過 tenant_members\n`);
  }

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < TENANTS.length; i++) {
    const t = TENANTS[i];
    const idx = `[${i + 1}/${TENANTS.length}]`;
    try {
      const tokens = JSON.stringify(brandTokensFor(t));
      const homepage = JSON.stringify(defaultHomepageConfig(t));

      // upsert public.tenants
      const inserted = rows(
        await db.execute(sql`
          INSERT INTO public.tenants (slug, name, domain, brand_tokens, homepage_config, review_required)
          VALUES (${t.slug}, ${t.name}, ${t.domain}, ${tokens}::jsonb, ${homepage}::jsonb, true)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            domain = EXCLUDED.domain,
            brand_tokens = EXCLUDED.brand_tokens,
            homepage_config = EXCLUDED.homepage_config
          RETURNING id
        `)
      );
      const tenantId: string = inserted[0].id;

      // schema + tables
      try {
        await createTenantSchema(t.slug);
      } catch (err: any) {
        if (!err.message?.includes('already exists')) throw err;
      }

      // 把 super admin 加為 tenant admin
      if (adminId) {
        await db.execute(sql`
          INSERT INTO public.tenant_members (tenant_id, user_id, role)
          VALUES (${tenantId}, ${adminId}, 'admin')
          ON CONFLICT (tenant_id, user_id) DO NOTHING
        `);
      }

      console.log(`${idx} ✅ ${t.name.padEnd(8, '　')} (${t.slug.padEnd(13)}) → ${t.theme}`);
      ok++;
    } catch (err: any) {
      console.error(`${idx} ❌ ${t.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n🎉 完成：${ok} 成功 / ${failed} 失敗`);
  console.log(`\n試試看（用 ?tenant=<slug> 切換）：`);
  console.log(`  http://localhost:3002/?tenant=culture   ← 文化金茶`);
  console.log(`  http://localhost:3002/?tenant=dep       ← 環保綠`);
  console.log(`  http://localhost:3002/?tenant=dosw      ← 社福粉`);
  console.log(`  http://localhost:3002/?tenant=health    ← 健康藍綠`);
  console.log(`  http://localhost:3002/?tenant=tpyd      ← 青年活力`);
  console.log(`  http://localhost:3002/?tenant=police    ← 司法莊重`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\n❌ Seed 失敗：', err);
  process.exit(1);
});
