# 臺北市政府多租戶網站平台 — API 介接指南

本文件旨在提供外部系統或局處子站介接本平台 API 的技術說明與範例。

## 1. 基礎資訊

- **Base URL**: `http://localhost:4000/api/v1` (開發環境)
- **Content-Type**: `application/json`
- **編碼**: `UTF-8`

## 2. 租戶識別 (Tenant Identification)

平台採用多租戶架構，所有請求必須明確指定所屬局處（租戶）。

### 方法 A：使用 HTTP Header (推薦用於後端介接)
在所有 API 請求中加入 `X-Tenant-ID` 標頭。
- **範例**: `X-Tenant-ID: doit` (資訊局)

### 方法 B：子網域識別 (自動識別)
若請求來自預先設定的子網域，平台會自動識別租戶。
- **範例**: `https://doit.gov.taipei/api/v1/...` → 自動識別為 `doit`

---

## 3. 認證流程

多數內容讀取 API 為公開，但管理、送審或讀取草稿等操作需要 JWT 認證。

### 登入獲取 Token
**Endpoint**: `POST /auth/admin/login`

**Request Payload**:
```json
{
  "email": "admin@doit.gov.taipei",
  "password": "your-password"
}
```

**Response**:
```json
{
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "...",
    "user": { "id": "...", "email": "...", "role": "admin" }
  }
}
```

**使用 Token**: 在後續請求的 Header 中加入 `Authorization: Bearer <accessToken>`。

---

## 4. 內容介接 API (Content API)

### 4.1 獲取頁面列表
**Endpoint**: `GET /content/pages`

**查詢參數**:
- `type`: `news` | `service` | `about` | `custom`
- `page`: 分頁頁碼 (預設 1)
- `limit`: 每頁數量 (預設 20)
- `locale`: 語系 (預設 `zh-TW`)

**範例**: `GET /content/pages?type=news&limit=5`

### 4.2 獲取單一頁面內文
**Endpoint**: `GET /content/pages/:id_or_slug`

**回應資料結構**:
```json
{
  "data": {
    "id": "...",
    "slug": "2026-lantern-festival",
    "status": "published",
    "currentVersion": {
      "title": "2026 台北燈節活動資訊",
      "bodyJson": { ... },
      "seoTitle": "...",
      "seoDescription": "..."
    }
  }
}
```

### 4.3 獲取導覽選單
**Endpoint**: `GET /content/navigation`

**說明**: 回傳當前租戶的樹狀導覽結構，適合用於渲染 Header 選單。

---

## 5. cURL 介接範例

### 範例：讀取資訊局 (doit) 的最新消息
```bash
curl -X GET "http://localhost:4000/api/v1/content/pages?type=news" \
     -H "X-Tenant-ID: doit" \
     -H "Accept: application/json"
```

### 範例：新增一則草稿 (需 Auth)
```bash
curl -X POST "http://localhost:4000/api/v1/content/pages" \
     -H "X-Tenant-ID: doit" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "slug": "test-news-001",
       "type": "news",
       "title": "測試新聞標題",
       "bodyJson": { "type": "doc", "content": [...] }
     }'
```

---

## 6. 常見錯誤碼

| 狀態碼 | 代碼 | 說明 |
|---|---|---|
| 400 | `BAD_REQUEST` | 請求格式錯誤或參數缺失 |
| 401 | `UNAUTHORIZED` | 未提供有效的 Token |
| 403 | `FORBIDDEN` | 權限不足（例如：Editor 試圖刪除已發布頁面） |
| 404 | `NOT_FOUND` | 找不到資源或租戶識別錯誤 |
| 500 | `INTERNAL_ERROR` | 伺服器內部錯誤 |
