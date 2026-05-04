import { Hono } from 'hono';
import { withTenantSchema, db, publicSchema, tenantSchema } from '@gov/db';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import type { TenantContext } from '../middleware/tenant.js';
import type { AuthContext } from '../middleware/auth.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

type Env = { Variables: { tenant: TenantContext; auth: AuthContext } };

const app = new Hono<Env>();

// Upload directory (in production, use S3/MinIO)
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), 'uploads');

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * POST /api/v1/content/media/upload
 * Upload media file (editor+). Supports multipart form data.
 */
app.post('/upload', authMiddleware, requireRole('editor'), async (c) => {
  const tenant = c.get('tenant');
  const auth = c.get('auth');

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return c.json({ error: { code: 'NO_FILE', message: '未提供檔案' } }, 400);
  }

  // Validate MIME type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: { code: 'INVALID_TYPE', message: `不支援的檔案類型：${file.type}` } }, 400);
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: { code: 'TOO_LARGE', message: '檔案大小不可超過 10MB' } }, 400);
  }

  // Generate unique filename
  const ext = path.extname(file.name) || mimeToExt(file.type);
  const hash = crypto.randomBytes(8).toString('hex');
  const storageKey = `${tenant.tenantSlug}/${Date.now()}-${hash}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storageKey);

  // Ensure tenant subdirectory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  // Get image dimensions if applicable
  let width: number | null = null;
  let height: number | null = null;
  // Simple PNG/JPEG dimension detection
  if (file.type === 'image/png' && buffer.length > 24) {
    width = buffer.readUInt32BE(16);
    height = buffer.readUInt32BE(20);
  }

  // CDN URL (in dev, serve from API)
  const cdnUrl = `/uploads/${storageKey}`;

  // Save to tenant media table
  const result = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const [media] = await tx
      .insert(tenantSchema.media)
      .values({
        filename: file.name,
        storageKey,
        cdnUrl,
        mimeType: file.type,
        fileSizeBytes: file.size,
        width,
        height,
        uploadedBy: auth.userId,
      })
      .returning();

    return media;
  });

  return c.json({
    data: {
      id: result.id,
      filename: result.filename,
      cdnUrl: result.cdnUrl,
      mimeType: result.mimeType,
      fileSizeBytes: result.fileSizeBytes,
      width: result.width,
      height: result.height,
    },
  }, 201);
});

/**
 * GET /api/v1/content/media
 * List media files for this tenant (editor+).
 */
app.get('/', authMiddleware, requireRole('editor'), async (c) => {
  const tenant = c.get('tenant');

  const items = await withTenantSchema(tenant.tenantSlug, async (tx) => {
    return tx
      .select()
      .from(tenantSchema.media)
      .orderBy(desc(tenantSchema.media.createdAt))
      .limit(100);
  });

  return c.json({ data: items, meta: { tenant: tenant.tenantSlug } });
});

/**
 * DELETE /api/v1/content/media/:id
 * Delete media file (editor_in_chief+).
 */
app.delete('/:id', authMiddleware, requireRole('editor_in_chief'), async (c) => {
  const mediaId = c.req.param('id');
  const tenant = c.get('tenant');

  await withTenantSchema(tenant.tenantSlug, async (tx) => {
    const [media] = await tx
      .select()
      .from(tenantSchema.media)
      .where(eq(tenantSchema.media.id, mediaId))
      .limit(1);

    if (media) {
      // Delete file from disk
      const filePath = path.join(UPLOAD_DIR, media.storageKey);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      await tx.delete(tenantSchema.media).where(eq(tenantSchema.media.id, mediaId));
    }
  });

  return c.json({ data: { message: '已刪除' } });
});

function mimeToExt(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
  };
  return map[mime] ?? '.bin';
}

export default app;
