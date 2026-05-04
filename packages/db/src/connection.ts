import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as publicSchema from './schema/public.js';
import * as tenantSchema from './schema/tenant.js';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/gov_platform';

// Connection pool for queries
const queryClient = postgres(DATABASE_URL, { max: 20 });
export const db = drizzle(queryClient, { schema: { ...publicSchema, ...tenantSchema } });

// ===== Tenant Schema Switching =====

const SLUG_REGEX = /^[a-z0-9_]+$/;

/**
 * Execute a function within a specific tenant's schema context.
 * Uses SET LOCAL to ensure search_path is transaction-scoped and won't leak.
 */
export async function withTenantSchema<T>(
  tenantSlug: string,
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  if (!SLUG_REGEX.test(tenantSlug)) {
    throw new Error(`Invalid tenant slug: ${tenantSlug}`);
  }

  const schemaName = `tenant_${tenantSlug}`;

  return db.transaction(async (tx) => {
    await tx.execute(
      sql.raw(`SET LOCAL search_path TO "${schemaName}", public`)
    );
    return fn(tx as unknown as typeof db);
  });
}

/**
 * Create a new tenant schema with all required tables.
 */
export async function createTenantSchema(slug: string): Promise<void> {
  if (!SLUG_REGEX.test(slug)) {
    throw new Error(`Invalid tenant slug: ${slug}`);
  }

  const schemaName = `tenant_${slug}`;

  await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`));
  await db.execute(sql.raw(`SET LOCAL search_path TO "${schemaName}"`));

  // Create tenant tables
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".pages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug VARCHAR(512) UNIQUE NOT NULL,
      type VARCHAR(64) NOT NULL CHECK (type IN ('news','service','about','custom')),
      status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','published','archived')),
      locale VARCHAR(10) NOT NULL DEFAULT 'zh-TW',
      author_id UUID NOT NULL,
      reviewer_id UUID,
      publish_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_pages_slug ON "${schemaName}".pages(slug);
    CREATE INDEX IF NOT EXISTS idx_pages_status_time ON "${schemaName}".pages(status, publish_at DESC);
    CREATE INDEX IF NOT EXISTS idx_pages_type_status ON "${schemaName}".pages(type, status);
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".page_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_id UUID NOT NULL REFERENCES "${schemaName}".pages(id) ON DELETE CASCADE,
      version_number INT NOT NULL,
      title VARCHAR(512) NOT NULL,
      body_json JSONB NOT NULL,
      seo_title VARCHAR(512),
      seo_description VARCHAR(512),
      og_image_key VARCHAR(512),
      change_summary VARCHAR(255),
      created_by UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (page_id, version_number)
    );
    CREATE INDEX IF NOT EXISTS idx_versions_page_latest ON "${schemaName}".page_versions(page_id, version_number DESC);
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID REFERENCES "${schemaName}".categories(id),
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".page_categories (
      page_id UUID REFERENCES "${schemaName}".pages(id) ON DELETE CASCADE,
      category_id UUID REFERENCES "${schemaName}".categories(id) ON DELETE CASCADE,
      PRIMARY KEY (page_id, category_id)
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".media (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(512) NOT NULL,
      storage_key VARCHAR(1024) NOT NULL,
      cdn_url VARCHAR(1024),
      mime_type VARCHAR(128) NOT NULL,
      file_size_bytes BIGINT NOT NULL,
      width INT,
      height INT,
      alt_text VARCHAR(512),
      uploaded_by UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".navigation_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id UUID REFERENCES "${schemaName}".navigation_items(id),
      label VARCHAR(255) NOT NULL,
      url VARCHAR(1024),
      page_id UUID,
      sort_order INT DEFAULT 0,
      open_new_tab BOOLEAN DEFAULT false,
      is_visible BOOLEAN DEFAULT true
    );
  `));

  // Enable Row Level Security as double insurance
  const tables = ['pages', 'page_versions', 'categories', 'page_categories', 'media', 'navigation_items'];
  for (const table of tables) {
    await db.execute(sql.raw(`ALTER TABLE "${schemaName}"."${table}" ENABLE ROW LEVEL SECURITY`));
  }
}

export { publicSchema, tenantSchema };
