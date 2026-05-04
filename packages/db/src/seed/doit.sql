-- doit 租戶 seed（純 SQL，直接用 psql 執行）
-- 用法：psql -d gov_platform -f src/seed/doit.sql

BEGIN;

-- 確保租戶存在
INSERT INTO public.tenants (slug, name, domain, brand_tokens, review_required)
VALUES ('doit', '資訊局', 'doit.gov.taipei', '{}', true)
ON CONFLICT (slug) DO UPDATE SET name = '資訊局';

-- 取得 author（任一使用者）
DO $$
DECLARE
  v_author_id UUID;
BEGIN
  SELECT id INTO v_author_id FROM public.users LIMIT 1;
  IF v_author_id IS NULL THEN
    RAISE EXCEPTION '找不到任何使用者，請先建立使用者';
  END IF;

  RAISE NOTICE 'author_id: %', v_author_id;

  -- 清空舊資料
  DELETE FROM tenant_doit.page_categories;
  DELETE FROM tenant_doit.page_versions;
  DELETE FROM tenant_doit.pages;
  DELETE FROM tenant_doit.navigation_items;
  DELETE FROM tenant_doit.categories;

  -- 分類
  INSERT INTO tenant_doit.categories (id, slug, name, sort_order) VALUES
    ('11111111-0000-0000-0000-000000000001', 'news', '最新消息', 1),
    ('11111111-0000-0000-0000-000000000002', 'service', '市民服務', 2),
    ('11111111-0000-0000-0000-000000000003', 'smart-city', '智慧城市', 3);

  -- 頁面 1: 2026智慧城市展
  INSERT INTO tenant_doit.pages (id, slug, type, status, locale, author_id, reviewer_id, publish_at)
  VALUES ('22222222-0000-0000-0000-000000000001', '2026-smart-city-expo', 'news', 'published', 'zh-TW',
          v_author_id, v_author_id, '2026-03-28T08:00:00Z');
  INSERT INTO tenant_doit.page_versions (page_id, version_number, title, body_json, seo_description, change_summary, created_by)
  VALUES ('22222222-0000-0000-0000-000000000001', 1,
          '2026智慧城市展圓滿落幕 北市府以「AI IS IN TAIPEI」為主題展現智慧治理成果',
          '{}',
          '臺北市政府於2026智慧城市展設立「臺北市政府願景館」，規劃「市民服務」、「城市安全」及「城市治理」三大展區。',
          '初始建立', v_author_id);

  -- 頁面 2: IEEE 智慧城市首獎
  INSERT INTO tenant_doit.pages (id, slug, type, status, locale, author_id, reviewer_id, publish_at)
  VALUES ('22222222-0000-0000-0000-000000000002', 'ieee-smart-city-award-2025', 'news', 'published', 'zh-TW',
          v_author_id, v_author_id, '2025-11-27T08:00:00Z');
  INSERT INTO tenant_doit.page_versions (page_id, version_number, title, body_json, seo_description, change_summary, created_by)
  VALUES ('22222222-0000-0000-0000-000000000002', 1,
          '北市奪下2025 IEEE智慧城市首獎 開源治理登上國際舞台',
          '{}',
          '臺北市政府以「開源×開放資料」雙引擎策略，全面開放儀表板程式碼與資料標準，榮獲IEEE智慧城市首獎。',
          '初始建立', v_author_id);

  -- 頁面 3: Data.Taipei 2.0
  INSERT INTO tenant_doit.pages (id, slug, type, status, locale, author_id, reviewer_id, publish_at)
  VALUES ('22222222-0000-0000-0000-000000000003', 'data-taipei-2-beta', 'news', 'published', 'zh-TW',
          v_author_id, v_author_id, '2025-09-15T08:00:00Z');
  INSERT INTO tenant_doit.page_versions (page_id, version_number, title, body_json, seo_description, change_summary, created_by)
  VALUES ('22222222-0000-0000-0000-000000000003', 1,
          '臺北市資料開放新平台上線！Data.Taipei 2.0 Beta版邀您搶先體驗',
          '{}',
          'Data.Taipei 2.0 Beta版新增自動搜尋建議、智慧圖表、數位儀表板及開放資料推薦功能。',
          '初始建立', v_author_id);

  -- 導覽列
  INSERT INTO tenant_doit.navigation_items (label, url, sort_order, is_visible, open_new_tab) VALUES
    ('認識本局', '/about', 1, true, false),
    ('本府消息', '/news', 2, true, false),
    ('業務職掌', '/services', 3, true, false),
    ('智慧城市', '/smart-city', 4, true, false),
    ('資料大平臺', '/open-data', 5, true, false),
    ('政府資訊公開', '/transparency', 6, true, false);

END $$;

COMMIT;

-- 驗證
SELECT 'pages' as tbl, count(*) as cnt FROM tenant_doit.pages WHERE status = 'published'
UNION ALL
SELECT 'versions', count(*) FROM tenant_doit.page_versions
UNION ALL
SELECT 'nav', count(*) FROM tenant_doit.navigation_items
UNION ALL
SELECT 'categories', count(*) FROM tenant_doit.categories;
