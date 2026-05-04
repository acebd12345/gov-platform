# 臺北市政府多租戶網站平台 — 技術規格文件

**版本** v0.1  
**狀態** 草稿  
**適用範圍** gov.taipei、doit.gov.taipei 及所有局處子站

---

## 目錄

1. [專案背景與目標](#1-專案背景與目標)
2. [系統架構總覽](#2-系統架構總覽)
3. [技術選型](#3-技術選型)
4. [多租戶設計](#4-多租戶設計)
5. [資料庫 Schema](#5-資料庫-schema)
6. [API 設計與路由規劃](#6-api-設計與路由規劃)
7. [後台 CMS 功能規格](#7-後台-cms-功能規格)
8. [權限設計（RBAC）](#8-權限設計rbac)
9. [前台路由與 SSG 策略](#9-前台路由與-ssg-策略)
10. [設計系統與品牌化](#10-設計系統與品牌化)
11. [外部系統整合](#11-外部系統整合)
12. [非功能性需求](#12-非功能性需求)
13. [部署與 DevOps 概覽](#13-部署與-devops-概覽)
14. [里程碑規劃](#14-里程碑規劃)

---

## 1. 專案背景與目標

### 現況痛點

現有 gov.taipei 與各局處網站（如 doit.gov.taipei）皆採用 ASP.NET Web Forms 框架，存在以下問題：

- URL 採查詢字串格式（`?n=hash&sms=hash`），不利 SEO 與分享
- 各局處各自維護，無法共用元件與後台
- 內容與版型強耦合，難以多管道輸出（網站、APP、LINE Bot）
- 技術棧老舊，無法支援靜態生成、Edge Runtime 等現代架構

### 目標

| 目標 | 說明 |
|---|---|
| 一套後台，N 個局處 | 超級管理員統一管理，各局處獨立操作 |
| 共用 API | 所有局處讀寫同一套 RESTful API |
| 前台品牌化 | 各局處外觀獨立，底層共用元件庫 |
| 語意化 URL | `/news/2026-lantern-festival` 取代 `?n=xxx` |
| 高效能 | 公開頁面 CDN 靜態快取，後端 API 低壓力 |
| 資料安全 | Schema 層級隔離，局處間資料不可互竄 |

---

## 2. 系統架構總覽

```
┌─────────────────────────────────────────────────────────┐
│  前台展示層（各局處獨立 Next.js，共用 Design System）     │
│  gov.taipei │ doit.gov.taipei │ dep3.taipei │ dep4...   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
              ┌────────▼────────┐
              │   CDN / Edge    │  靜態頁快取命中 → 直接回傳
              └────────┬────────┘
                       │ cache miss
              ┌────────▼────────────────────────────────┐
              │            API Gateway                   │
              │  Tenant 識別 · JWT 驗證 · Rate Limit     │
              └──┬──────┬──────┬──────┬──────┬──────────┘
                 │      │      │      │      │
           Content  Tenant  Auth  Search  Form
           Service Service  Svc   Svc    Svc
                 │      │      │      │      │
              ┌──▼──────▼──────▼──────▼──────▼──────────┐
              │              資料層                       │
              │  PostgreSQL │ Redis │ S3 │ Elasticsearch  │
              └────────────────────────────────────────  ┘
              ┌─────────────────────────────────────────┐
              │  後台管理系統（統一登入，RBAC）           │
              └─────────────────────────────────────────┘
```

---

## 3. 技術選型

### 前台
| 項目 | 選型 | 理由 |
|---|---|---|
| 框架 | Next.js 15（App Router） | SSG/ISR/SSR 靈活搭配，Edge Middleware |
| 語言 | TypeScript | 型別安全，適合多人協作 |
| 樣式 | Tailwind CSS + CSS Variables | Design Token 支援品牌化覆蓋 |
| 元件庫 | 自建 Design System（基於 Radix UI） | 政府無障礙規範（WCAG AA）客製化需求 |

### 後端
| 項目 | 選型 | 理由 |
|---|---|---|
| 框架 | Node.js + Hono / Fastify | 輕量、TypeScript 原生支援、Edge 相容 |
| ORM | Drizzle ORM | 型別安全、支援 search_path 動態切換 |
| 資料庫 | PostgreSQL 16 | Schema 隔離原生支援、Row Level Security |
| 快取 | Redis 7 | Session、API 快取、rate limit |
| 搜尋 | Elasticsearch 8 | 中文分詞、跨租戶聚合搜尋 |
| 媒體儲存 | S3 相容物件儲存（MinIO self-hosted 或 AWS S3） | 媒體檔案與資料庫分離 |

### 基礎設施
| 項目 | 選型 |
|---|---|
| 容器化 | Docker + Kubernetes |
| CI/CD | GitHub Actions |
| 監控 | Grafana + Prometheus |
| 日誌 | Loki |

---

## 4. 多租戶設計

### 隔離策略：PostgreSQL Schema 隔離（方案 B）

**選擇理由：**
- Schema 邊界天然隔離，即使 Service 層有 bug 也不會洩露跨局處資料
- 支援獨立備份/還原單一局處
- 共用 PostgreSQL 連線池，成本低於 DB 隔離
- 跨局處搜尋透過 Elasticsearch 聚合，不依賴 DB JOIN

**物理結構：**
```
PostgreSQL 單一叢集
├── schema: public          ← 平台層：tenants, users, audit_logs
├── schema: tenant_portal   ← gov.taipei 內容資料
├── schema: tenant_doit     ← 資訊局內容資料
├── schema: tenant_police   ← 警察局內容資料
└── schema: tenant_{slug}   ← 新局處自動建立
```

### Tenant 識別流程

請求進入 API Gateway 時，依以下優先順序識別 tenant：

1. **Subdomain**（最優先）：`doit.gov.taipei` → `tenant_slug = doit`
2. **Header**（內部服務呼叫）：`X-Tenant-ID: doit`
3. **JWT Claim**：token payload 中的 `tenant_id` 欄位

Slug 格式限制：`/^[a-z0-9_]+$/`，防止 SQL Injection。

### 新增局處流程

```
超級管理員 POST /api/v1/tenants
  → 驗證 slug 格式與唯一性
  → CREATE SCHEMA tenant_{slug}
  → 執行 baseline migration（建立所有表與 index）
  → ALTER TABLE ... ENABLE ROW LEVEL SECURITY（雙保險）
  → 建立初始局處管理員帳號
  → 回傳 201 Created
```

### Service 層 Schema 切換

```typescript
// 每個 DB 操作前呼叫，使用 SET LOCAL 確保不污染連線池
async function withTenantSchema<T>(
  tenantSlug: string,
  fn: (db: Db) => Promise<T>
): Promise<T> {
  if (!/^[a-z0-9_]+$/.test(tenantSlug)) {
    throw new Error('Invalid tenant slug');
  }
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SET LOCAL search_path TO ${sql.identifier('tenant_' + tenantSlug)}, public`
    );
    return fn(tx);
  });
}
```

---

## 5. 資料庫 Schema

### 5.1 平台層（schema: public）

#### `tenants`
```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(64) UNIQUE NOT NULL,  -- 對應 schema 名稱
  name            VARCHAR(255) NOT NULL,
  domain          VARCHAR(255) UNIQUE,           -- 自訂網域
  brand_tokens    JSONB DEFAULT '{}',            -- CSS Design Token 覆蓋
  feature_flags   JSONB DEFAULT '{}',            -- 功能開關
  review_required BOOLEAN DEFAULT true,          -- 是否啟用審核流程
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

#### `users`
```sql
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) UNIQUE NOT NULL,
  hashed_password  VARCHAR(255),                 -- NULL 表示僅 SSO 登入
  taipei_pass_id   VARCHAR(255) UNIQUE,          -- 台北通 OAuth 綁定
  is_super_admin   BOOLEAN DEFAULT false,
  last_login_at    TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

#### `tenant_members`（多對多：user ↔ tenant，含角色）
```sql
CREATE TABLE tenant_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        VARCHAR(32) NOT NULL
              CHECK (role IN ('admin','editor_in_chief','editor','viewer')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user   ON tenant_members(user_id);
```

#### `audit_logs`（稽核日誌，法規遵循必備）
```sql
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  actor_id        UUID NOT NULL REFERENCES users(id),
  action          VARCHAR(64) NOT NULL,  -- create|update|publish|delete|login
  resource_type   VARCHAR(64) NOT NULL,  -- page|media|tenant_config|user
  resource_id     UUID,
  before_snapshot JSONB,
  after_snapshot  JSONB,
  ip_address      INET,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_actor       ON audit_logs(actor_id, created_at DESC);
```

---

### 5.2 租戶內容層（schema: tenant_{slug}）

每個局處的 schema 結構完全相同，以下以 `tenant_doit` 為例。

#### `pages`（所有頁面的主表）
```sql
CREATE TABLE pages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         VARCHAR(512) UNIQUE NOT NULL,  -- URL 路徑片段
  type         VARCHAR(64) NOT NULL
               CHECK (type IN ('news','service','about','custom')),
  status       VARCHAR(32) NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','pending','approved','published','archived')),
  locale       VARCHAR(10) NOT NULL DEFAULT 'zh-TW',
  author_id    UUID NOT NULL,    -- ref: public.users（無 FK constraint，跨 schema）
  reviewer_id  UUID,             -- ref: public.users
  publish_at   TIMESTAMPTZ,      -- NULL = 立即發布；未來時間 = 排程
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pages_slug        ON pages(slug);
CREATE INDEX idx_pages_status_time ON pages(status, publish_at DESC);
CREATE INDEX idx_pages_type_status ON pages(type, status);
```

#### `page_versions`（版本歷史）
```sql
CREATE TABLE page_versions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id        UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title          VARCHAR(512) NOT NULL,
  body_json      JSONB NOT NULL,    -- Tiptap/ProseMirror JSON 格式
  seo_title      VARCHAR(512),
  seo_description VARCHAR(512),
  og_image_key   VARCHAR(512),      -- S3 object key
  change_summary VARCHAR(255),
  created_by     UUID NOT NULL,     -- ref: public.users
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (page_id, version_number)
);
CREATE INDEX idx_versions_page_latest ON page_versions(page_id, version_number DESC);
```

#### `categories`（分類，支援無限層級）
```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID REFERENCES categories(id),
  slug        VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE page_categories (
  page_id     UUID REFERENCES pages(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, category_id)
);
```

#### `media`（媒體檔案）
```sql
CREATE TABLE media (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename         VARCHAR(512) NOT NULL,
  storage_key      VARCHAR(1024) NOT NULL,  -- S3 object key
  cdn_url          VARCHAR(1024),
  mime_type        VARCHAR(128) NOT NULL,
  file_size_bytes  BIGINT NOT NULL,
  width            INT,
  height           INT,
  alt_text         VARCHAR(512),
  uploaded_by      UUID NOT NULL,            -- ref: public.users
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

#### `navigation_items`（前台導覽樹）
```sql
CREATE TABLE navigation_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID REFERENCES navigation_items(id),
  label        VARCHAR(255) NOT NULL,
  url          VARCHAR(1024),       -- 外部連結
  page_id      UUID,                -- 內部頁面（ref: pages.id，無 FK）
  sort_order   INT DEFAULT 0,
  open_new_tab BOOLEAN DEFAULT false,
  is_visible   BOOLEAN DEFAULT true
);
```

---

## 6. API 設計與路由規劃

### 基本規範

- 版本前綴：`/api/v1/`
- 所有回應格式：
  ```json
  { "data": ..., "meta": { "tenant": "doit", "pagination": {...} } }
  { "error": { "code": "NOT_FOUND", "message": "..." } }
  ```
- 錯誤訊息永不洩露跨租戶資訊
- Breaking change 發新版本，舊版維護 6 個月

### 內容服務 `/api/v1/content`

| Method | Path | 權限 | 快取 | 說明 |
|---|---|---|---|---|
| GET | `/pages` | 公開 | CDN 300s | 列表，支援 `?type&category&locale&page&limit` |
| GET | `/pages/:slug` | 公開 | CDN 300s | 單頁，回傳含 meta/body/breadcrumb |
| GET | `/navigation` | 公開 | CDN 600s | 當前租戶導覽樹 |
| POST | `/pages` | editor+ | — | 新增草稿 |
| PATCH | `/pages/:id` | editor（限自己）+ | — | 更新草稿 |
| PUT | `/pages/:id/submit` | editor+ | — | 送審 |
| PUT | `/pages/:id/approve` | editor_in_chief+ | — | 核准 |
| PUT | `/pages/:id/publish` | editor_in_chief+ | — | 發布（觸發 ISR） |
| PUT | `/pages/:id/unpublish` | editor_in_chief+ | — | 下線 |
| DELETE | `/pages/:id` | editor_in_chief+ | — | 刪除（草稿才能刪） |
| GET | `/pages/:id/versions` | editor+ | — | 版本歷史列表 |
| POST | `/pages/:id/revert/:versionId` | editor_in_chief+ | — | 回溯版本 |
| POST | `/media/upload` | editor+ | — | 上傳媒體（multipart） |
| GET | `/media` | editor+ | — | 媒體庫列表 |
| DELETE | `/media/:id` | editor_in_chief+ | — | 刪除媒體 |

### 租戶服務 `/api/v1/tenant`

| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/config` | 公開 | 前台品牌設定（tokens、logo、GA） |
| PUT | `/config` | admin+ | 更新設定 |
| GET | `/services` | 公開 | 市民服務列表（gov.taipei 首頁用） |
| GET | `/members` | admin+ | 成員列表 |
| POST | `/members` | admin+ | 新增成員 |
| PATCH | `/members/:userId/role` | admin+ | 變更角色 |
| DELETE | `/members/:userId` | admin+ | 移除成員 |

### 搜尋服務 `/api/v1/search`

| Method | Path | 說明 |
|---|---|---|
| GET | `?q=捷運&scope=current` | `scope=current`：本站；`scope=all`：全站（僅 portal 租戶允許） |

`scope=all` 在 API Gateway 層攔截：非 `portal` 租戶返回 403。

### 認證服務 `/api/v1/auth`

| Method | Path | 說明 |
|---|---|---|
| GET | `/taipei-pass/authorize` | 跳轉台北通 OAuth2 |
| GET | `/taipei-pass/callback` | 換發 JWT |
| POST | `/admin/login` | 後台人員登入（帳密 + OTP） |
| POST | `/admin/refresh` | 刷新 JWT |
| POST | `/admin/logout` | 登出（廢止 refresh token） |

JWT Payload：
```json
{
  "sub": "user-uuid",
  "tenant_id": "doit",
  "role": "editor",
  "is_super_admin": false,
  "exp": 1234567890
}
```
Access token 有效期：1 小時；Refresh token：7 天。

### Webhook `/api/v1/webhooks`

| Method | Path | 說明 |
|---|---|---|
| POST | `/revalidate` | CMS 發布時觸發 Next.js ISR，帶 HMAC-SHA256 簽名驗證 |

---

## 7. 後台 CMS 功能規格

### 功能模組

| 模組 | 功能 |
|---|---|
| 儀表板 | 近期發布、待審件數、媒體使用量統計 |
| 頁面管理 | 建立/編輯/送審/發布/下線/刪除；版本比對；排程發布 |
| 富文字編輯器 | 基於 Tiptap：標題、段落、表格、圖片插入、超連結、內嵌媒體 |
| 媒體庫 | 上傳（拖曳/剪貼簿）、圖片裁切、搜尋、刪除 |
| 分類管理 | 樹狀分類、拖曳排序、slug 管理 |
| 導覽管理 | 前台主選單拖曳編輯 |
| 成員管理 | 新增/移除/角色變更 |
| 版型設定 | Brand Token 編輯（主色、Logo、頁尾資訊） |
| 稽核日誌 | 所有操作記錄，可篩選操作者/時間/類型 |
| 搜尋設定 | 關鍵字同義詞管理、搜尋結果排序 |

### 內容生命週期

```
草稿 ──[送審]──▶ 待審 ──[核准]──▶ 已核准 ──[發布]──▶ 已發布
  ▲                │                                      │
  └──────[退回]────┘                         [下線]──▶ 已下線
```

若 `tenant.review_required = false`，「編輯」角色可直接發布，跳過送審/核准步驟。

---

## 8. 權限設計（RBAC）

### 角色定義

| 角色 | 範圍 | 說明 |
|---|---|---|
| `super_admin` | 全平台 | 跨局處，建立/刪除租戶，最高權限 |
| `admin` | 單一局處 | 局處設定、成員管理、版型 |
| `editor_in_chief` | 單一局處 | 審核、發布、分類/導覽管理 |
| `editor` | 單一局處 | 新增/編輯草稿、送審、上傳媒體 |
| `viewer` | 單一局處 | 後台唯讀 |

角色採累積制：上層包含下層所有權限。

### 關鍵業務規則

- 「編輯」只能修改自己建立的草稿（`author_id = current_user_id`），由 Service 層強制
- 超級管理員操作他局處需在 Header 明確帶 `X-Target-Tenant: doit`，介面上也需先選擇局處
- 已發布的頁面不可直接刪除，必須先下線再封存
- 角色變更會記錄在 `audit_logs`，包含 before/after snapshot

---

## 9. 前台路由與 SSG 策略

### URL 結構

| 頁面類型 | URL 格式 | 渲染策略 | CDN TTL |
|---|---|---|---|
| 首頁 | `/` | SSG + ISR | 300s |
| 新聞列表 | `/news` | SSG + ISR | 300s |
| 新聞內文 | `/news/:slug` | SSG + ISR | 300s |
| 服務總覽 | `/services` | SSG + ISR | 300s |
| 服務分類 | `/services/:category` | SSG + ISR | 300s |
| 靜態說明頁 | `/about/[...slug]` | SSG | 3600s |
| 搜尋結果 | `/search?q=...` | CSR | no-cache |
| 後台 | `/admin/...` | SSR / CSR | private |

### 舊路徑 301 Redirect（向下相容）

```javascript
// next.config.js
async redirects() {
  return [
    { source: '/News.aspx', destination: '/news', permanent: true },
    { source: '/News_Services.aspx', destination: '/services', permanent: true },
    { source: '/Content_List.aspx', destination: '/services', permanent: true },
    // 需要 hash → slug 的對應表，由 migration script 產生
  ]
}
```

### ISR Revalidation 流程

```
CMS 發布 → POST /api/v1/webhooks/revalidate
  → HMAC-SHA256 驗證
  → Next.js revalidatePath('/news/2026-lantern-festival')
  → CDN 快取清除
  → 下一個請求重新生成靜態頁（< 3 秒）
```

### Tenant 識別 Middleware

```typescript
// middleware.ts（Edge Runtime，每個請求最前端執行）
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const slug = hostname.replace(/\.gov\.taipei$/, '').replace(/\.taipei$/, '');
  
  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', slug);
  return response;
}
```

---

## 10. 設計系統與品牌化

### 架構

```
Design System（npm package）
├── tokens/          ← 基礎 CSS Variables（顏色、字型、間距）
├── components/      ← 共用元件（Button, Card, Nav, Footer...）
└── templates/       ← 頁面版型（首頁、列表頁、內文頁）
```

### 品牌化機制

每個局處在 `tenant.brand_tokens` 存放 JSON，前台 `layout.tsx` 在 `<head>` 注入對應 CSS Variables：

```json
{
  "--color-brand-primary": "#0C5299",
  "--color-brand-secondary": "#E8F0F8",
  "--font-heading": "'Noto Sans TC', sans-serif",
  "logo_url": "https://cdn.../doit-logo.svg",
  "favicon_url": "https://cdn.../doit-favicon.ico"
}
```

元件庫統一使用 `var(--color-brand-primary)` 等 token，不 hardcode 顏色，局處只需覆蓋 token 值即可改變外觀，不需要 fork 元件。

### 無障礙規範

- 符合 WCAG 2.1 AA 標準（依政府資訊無障礙規定）
- 色彩對比度 ≥ 4.5:1（一般文字）、3:1（大文字）
- 所有互動元素鍵盤可操作
- ARIA 標籤完整
- 支援字級調整（`font-size` 不以 px 固定）

---

## 11. 外部系統整合

| 系統 | 整合方式 | 說明 |
|---|---|---|
| 台北通（TaipeiPASS） | OAuth 2.0 PKCE | 市民登入；後台人員亦可用台北通 SSO |
| 1999 陳情系統 | Webhook / API | 表單提交後轉入 1999，或直接呼叫其 API |
| pay.taipei | 外連 + Deep Link | 繳費服務跳轉，不在本平台處理金流 |
| data.taipei | 資料引用 | 可嵌入開放資料集的查詢元件 |
| Google Analytics 4 | 前台注入 gtag.js | GA ID 存在 `tenant.brand_tokens` |
| 各局處既有系統 | Webhook / iFrame | 特殊業務系統嵌入，不強制遷移 |

---

## 12. 非功能性需求

### 效能
- 首頁 LCP（Largest Contentful Paint）< 2.5 秒（CDN 命中情況）
- API P99 回應時間 < 300ms（非搜尋 endpoint）
- 靜態頁面 CDN 命中率目標 > 90%

### 可靠性
- API 可用性 SLA：99.9%（月停機 < 43 分鐘）
- 資料庫每日備份，保留 30 天
- 跨可用區部署，單一節點故障不影響服務

### 安全性
- 所有 API 傳輸強制 HTTPS（HSTS）
- JWT 使用 RS256 非對稱簽名
- 後台管理員登入要求 OTP（TOTP）
- 稽核日誌不可刪除，保存 7 年（法規遵循）
- API Rate Limit：公開 API 100 req/min，後台 API 30 req/min
- SQL Injection 防護：slug/path 輸入嚴格白名單驗證
- 上傳媒體：病毒掃描、MIME 類型白名單（`image/*`, `application/pdf`）

### 可觀測性
- 結構化日誌（JSON），送往 Loki
- API 錯誤率、P99 延遲、流量監控（Grafana Dashboard）
- 前台 Core Web Vitals 監控

---

## 13. 部署與 DevOps 概覽

### 環境

| 環境 | 說明 |
|---|---|
| development | 本機 Docker Compose（PostgreSQL + Redis + MinIO） |
| staging | 完整的 Kubernetes 部署，使用生產資料匿名化複本 |
| production | Kubernetes，多可用區，Auto Scaling |

### CI/CD 流程（GitHub Actions）

```
Push to feature branch
  → Lint + TypeScript check
  → Unit tests
  → Integration tests（測試用 DB）

PR merge to main
  → Build Docker image
  → Push to Container Registry
  → 自動部署到 staging
  → E2E tests（Playwright）

手動觸發 / tag
  → 部署到 production
  → 執行 DB migration（新增 tenant schema 結構變更）
  → Smoke tests
  → 若失敗自動 rollback
```

### Migration 策略

- 使用 Drizzle Kit 管理 migration 檔案
- 每次部署前先跑 `public` schema migration
- 再對每個 `tenant_*` schema 執行相同 migration（批次並行，降低停機時間）

---

## 14. 里程碑規劃

### Phase 1 — 平台基礎（約 8 週）
- [V] PostgreSQL schema 設計與 baseline migration
- [V] API Gateway + Tenant 識別機制
- [V] Content Service CRUD API
- [V] Auth Service（帳密登入 + JWT）
- [V] 後台基礎框架（登入、文章列表、簡易編輯器）

### Phase 2 — 完整 CMS（約 6 週）
- [V] 完整 RBAC 權限（含 audit log）
- [V] 審核流程（送審/核准/發布）
- [V] 版本歷史與比對
- [V] 媒體庫
- [V] 分類/導覽管理

### Phase 3 — 前台重建（約 6 週）
- [/] Design System 元件庫
- [ ] Next.js 前台（SSG + ISR）
- [ ] Tenant Middleware（subdomain 識別）
- [ ] 品牌化 Token 注入
- [ ] 舊路徑 301 Redirect

### Phase 4 — 整合與上線（約 4 週）
- [ ] 台北通 SSO 整合
- [ ] Elasticsearch 搜尋服務
- [ ] ISR Webhook
- [ ] 效能測試與調優
- [ ] 資料遷移（舊站內容匯入）
- [ ] Staging 驗收 → Production 上線

---

*文件最後更新：2026-04-09*  
*下一步：確認技術選型後，由 Phase 1 開始進行詳細的 task breakdown*
