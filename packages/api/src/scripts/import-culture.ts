import { db } from '../../../../packages/db/src/index.ts';
import { pages, pageVersions } from '../../../../packages/db/src/schema/tenant.ts';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

async function run() {
  const dataPath = '/Users/zhangyongjun/.gemini/antigravity/brain/1ff50880-2e74-4018-920e-95e928509c8c/.system_generated/steps/672/content.md';
  const rawContent = fs.readFileSync(dataPath, 'utf-8');
  
  // 簡單解析 XML (因環境限制不使用額外 parser)
  const items = rawContent.split('<Data>').slice(1);
  console.log(`Found ${items.length} items to import.`);

  for (const item of items) {
    const titleMatch = item.match(/<Column_5 name="title">(.*?)<\/Column_5>/);
    const contentMatch = item.match(/<Column_6 name="內容">(.*?)<\/Column_6>/);
    const dateMatch = item.match(/<Column_7 name="日期時間">(.*?)<\/Column_7>/);
    const snMatch = item.match(/<Column_0 name="DataSN">(.*?)<\/Column_0>/);

    if (!titleMatch || !contentMatch) continue;

    const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const content = contentMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const slug = `news-${snMatch ? snMatch[1] : Date.now()}`;
    const date = dateMatch ? new Date(dateMatch[1]) : new Date();

    console.log(`Importing: ${title}`);

    try {
      // 切換至 tenant_culture schema (Drizzle 方式)
      // 注意：目前 schema 定義可能需要動態指定，這裡我們使用 sql 標籤直接操作
      const pageId = uuidv4();
      
      // 插入 pages
      await db.execute(`
        INSERT INTO tenant_culture.pages (id, slug, title, status, created_at, updated_at)
        VALUES ('${pageId}', '${slug}', '${title.substring(0, 255)}', 'published', '${date.toISOString()}', '${date.toISOString()}')
        ON CONFLICT (slug) DO NOTHING;
      `);

      // 插入 page_versions
      await db.execute(`
        INSERT INTO tenant_culture.page_versions (id, page_id, title, content, status, created_at)
        VALUES ('${uuidv4()}', '${pageId}', '${title.substring(0, 255)}', '${content.replace(/'/g, "''")}', 'published', '${date.toISOString()}');
      `);
    } catch (err) {
      console.error(`Failed to import ${title}:`, err);
    }
  }

  console.log('Import completed.');
  process.exit(0);
}

run();
