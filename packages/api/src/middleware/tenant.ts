import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { db, publicSchema } from '@gov/db';
import { eq, or } from 'drizzle-orm';

export type TenantContext = {
  tenantSlug: string;
  tenantId: string;
};

/**
 * Tenant identification middleware.
 * Priority: 1. X-Tenant-ID header  2. Subdomain  3. JWT claim
 *
 * For development, X-Tenant-ID header is the primary method.
 * In production, subdomain is the primary method.
 */
export const tenantMiddleware = createMiddleware<{
  Variables: { tenant: TenantContext };
}>(async (c, next) => {
  let slug: string | undefined;

  // 1. Header (highest priority, for internal/dev)
  const headerTenant = c.req.header('X-Tenant-ID');
  if (headerTenant) {
    slug = headerTenant;
  }

  // 2. Query parameter (for IP-based testing)
  if (!slug) {
    const queryTenant = c.req.query('tenant');
    if (queryTenant) {
      slug = queryTenant;
    }
  }

  // 2. Subdomain detection
  if (!slug) {
    const host = c.req.header('host') ?? '';
    // Extract subdomain: doit.gov.taipei → doit
    const match = host.match(/^([a-z0-9_]+)\.(?:gov\.)?taipei/);
    if (match) {
      slug = match[1] === 'www' ? 'portal' : match[1];
    }
  }

  // 3. Fallback to "portal" for development on localhost
  if (!slug) {
    slug = 'portal';
  }

  // Validate slug format
  if (!/^[a-z0-9_]+$/.test(slug)) {
    throw new HTTPException(400, { message: 'Invalid tenant identifier' });
  }

  // Look up tenant in DB
  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, slug!),
  });

  if (!tenant) {
    throw new HTTPException(404, { message: `Tenant not found: ${slug}` });
  }

  c.set('tenant', {
    tenantSlug: tenant.slug,
    tenantId: tenant.id,
  });

  await next();
});
