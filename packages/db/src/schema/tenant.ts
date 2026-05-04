import {
  pgTable,
  uuid,
  varchar,
  integer,
  bigint,
  boolean,
  jsonb,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ===== Tenant Content Layer (schema: tenant_{slug}) =====
// These table definitions are used as templates for each tenant schema.
// At runtime, the search_path is switched to the appropriate tenant schema.

export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 512 }).unique().notNull(),
    type: varchar('type', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('draft'),
    locale: varchar('locale', { length: 10 }).notNull().default('zh-TW'),
    authorId: uuid('author_id').notNull(),
    reviewerId: uuid('reviewer_id'),
    publishAt: timestamp('publish_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_pages_slug').on(table.slug),
    index('idx_pages_status_time').on(table.status, table.publishAt),
    index('idx_pages_type_status').on(table.type, table.status),
  ]
);

export const pageVersions = pgTable(
  'page_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pageId: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    title: varchar('title', { length: 512 }).notNull(),
    bodyJson: jsonb('body_json').notNull().$type<Record<string, unknown>>(),
    seoTitle: varchar('seo_title', { length: 512 }),
    seoDescription: varchar('seo_description', { length: 512 }),
    ogImageKey: varchar('og_image_key', { length: 512 }),
    changeSummary: varchar('change_summary', { length: 255 }),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_page_version').on(table.pageId, table.versionNumber),
    index('idx_versions_page_latest').on(table.pageId, table.versionNumber),
  ]
);

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const pageCategories = pgTable(
  'page_categories',
  {
    pageId: uuid('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.pageId, table.categoryId] })]
);

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 512 }).notNull(),
  storageKey: varchar('storage_key', { length: 1024 }).notNull(),
  cdnUrl: varchar('cdn_url', { length: 1024 }),
  mimeType: varchar('mime_type', { length: 128 }).notNull(),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
  width: integer('width'),
  height: integer('height'),
  altText: varchar('alt_text', { length: 512 }),
  uploadedBy: uuid('uploaded_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const navigationItems = pgTable('navigation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'),
  label: varchar('label', { length: 255 }).notNull(),
  url: varchar('url', { length: 1024 }),
  pageId: uuid('page_id'),
  sortOrder: integer('sort_order').default(0),
  openNewTab: boolean('open_new_tab').default(false),
  isVisible: boolean('is_visible').default(true),
});
