# 臺北市政府多租戶網站平台 (Taipei City Gov Multi-tenant Website Platform)

這是一個為臺北市政府設計的高效能、高安全性、多租戶網站管理平台。基於現代技術棧開發，支援多局處獨立管理、統一 API 介接與高效能的靜態頁面渲染。

## 特色功能

- **多租戶隔離 (Multi-tenancy)**：使用 PostgreSQL Schema 進行物理數據隔離，確保各處室資料安全。
- **現代化技術棧**：使用 Next.js 15, Hono, Drizzle ORM, 以及 Tailwind CSS。
- **完善的 CMS**：支援頁面版本管理、審核發布流程、媒體庫以及 RBAC 權限控制。
- **SEO 優化**：支援 SSG (靜態生成) 與 ISR (增量更新)，確保搜尋引擎友善且載入快速。
- **品牌化支援**：各局處可透過 Design Tokens 自定義外觀，同時保有統一的設計系統。

## 系統架構

本專案採用 Monorepo 結構：
- `packages/api`：後端 API 伺服器 (Hono)。
- `packages/admin`：CMS 後台管理系統 (Next.js)。
- `packages/db`：資料庫 Schema 與 Migration 管理 (Drizzle)。
- `packages/shared`：跨專案共用的型別與工具函數。

## 快速上手

### 環境需求
- Node.js >= 20
- Docker & Docker Compose

### 安裝與啟動
1. **複製環境設定**:
   ```bash
   cp .env.example .env
   ```
2. **啟動基礎設施 (DB, Redis, MinIO)**:
   ```bash
   docker-compose up -d
   ```
3. **安裝依賴**:
   ```bash
   npm install
   ```
4. **初始化資料庫**:
   ```bash
   npm run db:setup
   ```
5. **啟動開發伺服器**:
   ```bash
   # 啟動 API
   npm run dev:api
   # 啟動後台
   npm run dev:admin
   ```

## 文件

- [技術規格文件](gov-platform-spec.md)
- [API 介接指南](API_INTEGRATION.md)
- [部署指引](deploy/README.md)

## 授權條款

本專案採用 [MIT License](LICENSE) 授權。
