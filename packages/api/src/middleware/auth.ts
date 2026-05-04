import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import * as jose from 'jose';
import type { Role, JwtPayload } from '@gov/shared';
import type { TenantContext } from './tenant.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
);

export type AuthContext = {
  userId: string;
  role: Role;
  isSuperAdmin: boolean;
};

/**
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token, then sets user context.
 */
export const authMiddleware = createMiddleware<{
  Variables: { auth: AuthContext; tenant: TenantContext };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    const jwtPayload = payload as unknown as JwtPayload;

    // Verify tenant match (unless super admin)
    const tenant = c.get('tenant');
    if (!jwtPayload.is_super_admin && jwtPayload.tenant_id !== tenant.tenantSlug) {
      throw new HTTPException(403, { message: 'Token tenant mismatch' });
    }

    c.set('auth', {
      userId: jwtPayload.sub,
      role: jwtPayload.role,
      isSuperAdmin: jwtPayload.is_super_admin,
    });

    await next();
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
});

/**
 * Role-based access control middleware factory.
 * Roles are cumulative: admin > editor_in_chief > editor > viewer
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 40,
  editor_in_chief: 30,
  editor: 20,
  viewer: 10,
};

export function requireRole(minimumRole: Role) {
  return createMiddleware<{
    Variables: { auth: AuthContext; tenant: TenantContext };
  }>(async (c, next) => {
    const auth = c.get('auth');

    if (auth.isSuperAdmin) {
      await next();
      return;
    }

    const userLevel = ROLE_HIERARCHY[auth.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0;

    if (userLevel < requiredLevel) {
      throw new HTTPException(403, {
        message: `Insufficient permissions. Required: ${minimumRole}, Current: ${auth.role}`,
      });
    }

    await next();
  });
}

/**
 * Issue a JWT token for a user.
 */
export async function signToken(payload: Omit<JwtPayload, 'exp'>): Promise<string> {
  return new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(JWT_SECRET);
}

/**
 * Issue a refresh token (longer-lived).
 */
export async function signRefreshToken(userId: string): Promise<string> {
  return new jose.SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}
