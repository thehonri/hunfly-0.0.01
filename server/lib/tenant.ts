/**
 * Tenant & Membership utilities
 */

import { db } from '../db';
import { tenantMembers, tenants } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import type { TenantMember } from '../../drizzle/schema';

/**
 * Get user's membership in a tenant
 * Returns null if user is not a member or membership is inactive
 */
export async function getTenantMembership(
  userId: string,
  tenantId: string
): Promise<TenantMember | null> {
  const membership = await db.query.tenantMembers.findFirst({
    where: and(
      eq(tenantMembers.userId, userId),
      eq(tenantMembers.tenantId, tenantId),
      eq(tenantMembers.status, 'active')
    ),
  });

  return membership || null;
}

/**
 * Get all tenants a user is a member of
 */
export async function getUserTenants(userId: string) {
  const memberships = await db
    .select({
      tenantId: tenantMembers.tenantId,
      role: tenantMembers.role,
      status: tenantMembers.status,
      tenant: tenants,
    })
    .from(tenantMembers)
    .leftJoin(tenants, eq(tenantMembers.tenantId, tenants.id))
    .where(
      and(
        eq(tenantMembers.userId, userId),
        eq(tenantMembers.status, 'active')
      )
    );

  return memberships;
}

/**
 * Check if user is a member of tenant
 */
export async function isTenantMember(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const membership = await getTenantMembership(userId, tenantId);
  return membership !== null;
}

/**
 * Extract tenantId from request (body, params, or query)
 */
export function extractTenantId(req: any): string | null {
  return req.body?.tenantId || req.params?.tenantId || req.query?.tenantId || null;
}
