import { db, createTenantSchema } from '../connection.js';
import { tenants, users, tenantMembers } from '../schema/public.js';
import { sql } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';

/**
 * Seed script: creates initial platform data for development.
 */
async function main() {
  console.log('Seeding database...');

  // 1. Create super admin user
  const [superAdmin] = await db
    .insert(users)
    .values({
      email: 'admin@gov.taipei',
      hashedPassword: hashPassword('admin123'), // Dev only!
      isSuperAdmin: true,
    })
    .onConflictDoNothing()
    .returning();

  console.log('Created super admin:', superAdmin?.email ?? '(already exists)');

  // 2. Create tenants
  const tenantList = [
    { slug: 'portal', name: '臺北市政府入口網', domain: 'gov.taipei' },
    { slug: 'doit', name: '資訊局', domain: 'doit.gov.taipei' },
  ];

  for (const t of tenantList) {
    const [tenant] = await db
      .insert(tenants)
      .values({
        slug: t.slug,
        name: t.name,
        domain: t.domain,
        brandTokens: {
          '--color-brand-primary': t.slug === 'portal' ? '#0C5299' : '#1A7F37',
          '--color-brand-secondary': t.slug === 'portal' ? '#E8F0F8' : '#E6F4EA',
          '--font-heading': "'Noto Sans TC', sans-serif",
        },
        reviewRequired: true,
      })
      .onConflictDoNothing()
      .returning();

    if (tenant) {
      console.log(`Created tenant: ${tenant.name}`);

      // Create tenant schema
      await createTenantSchema(tenant.slug);
      console.log(`Created schema: tenant_${tenant.slug}`);

      // Add super admin as admin of this tenant
      if (superAdmin) {
        await db
          .insert(tenantMembers)
          .values({
            tenantId: tenant.id,
            userId: superAdmin.id,
            role: 'admin',
          })
          .onConflictDoNothing();
      }
    }
  }

  // 3. Create an editor user
  const [editor] = await db
    .insert(users)
    .values({
      email: 'editor@doit.gov.taipei',
      hashedPassword: hashPassword('editor123'),
      isSuperAdmin: false,
    })
    .onConflictDoNothing()
    .returning();

  if (editor) {
    // Find doit tenant
    const doitTenant = await db.query.tenants.findFirst({
      where: (t, { eq }) => eq(t.slug, 'doit'),
    });

    if (doitTenant) {
      await db
        .insert(tenantMembers)
        .values({
          tenantId: doitTenant.id,
          userId: editor.id,
          role: 'editor',
        })
        .onConflictDoNothing();
      console.log('Created editor:', editor.email);
    }
  }

  console.log('Seed complete!');
  process.exit(0);
}

function hashPassword(password: string): string {
  return bcryptjs.hashSync(password, 10);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
