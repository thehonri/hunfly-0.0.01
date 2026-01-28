/**
 * RBAC Middleware
 *
 * Validates that authenticated users have required permissions
 * for specific actions within a tenant
 */

import { Request, Response, NextFunction } from 'express';
import { getTenantMembership, extractTenantId } from '../lib/tenant';
import { hasPermission, type Permission, type Role } from '../lib/permissions';
import { Logger } from '../logger';
import type { TenantMember } from '../../drizzle/schema';

/**
 * Extended Request type with user and membership
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
  membership?: TenantMember;
  correlationId?: string;
}

/**
 * Middleware: Require specific permission
 *
 * Must be used AFTER requireAuth middleware
 * Validates that user is a member of the tenant and has the required permission
 *
 * @param permission - The permission required to access this route
 *
 * @example
 * app.get('/api/inbox/conversations',
 *   requireAuth,
 *   requirePermission('inbox.read'),
 *   getConversationsHandler
 * )
 */
export function requirePermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          error: 'Authentication required',
        });
      }

      // Extract tenantId from request
      const tenantId = extractTenantId(req);

      if (!tenantId) {
        return res.status(400).json({
          error: 'tenantId is required',
        });
      }

      // Get user's membership in this tenant
      const membership = await getTenantMembership(req.user.id, tenantId);

      if (!membership) {
        Logger.warn('User attempted to access tenant without membership', {
          correlationId: req.correlationId,
          userId: req.user.id,
          tenantId,
          permission,
        });

        return res.status(403).json({
          error: 'Not a member of this tenant',
        });
      }

      // Check if user's role has the required permission
      const allowed = hasPermission(membership.role as Role, permission);

      if (!allowed) {
        Logger.warn('User lacks required permission', {
          correlationId: req.correlationId,
          userId: req.user.id,
          tenantId,
          role: membership.role,
          permission,
        });

        return res.status(403).json({
          error: `Permission denied: ${permission}`,
          requiredPermission: permission,
          userRole: membership.role,
        });
      }

      // Attach membership to request for downstream handlers
      req.membership = membership;

      Logger.debug('Permission check passed', {
        correlationId: req.correlationId,
        userId: req.user.id,
        tenantId,
        role: membership.role,
        permission,
      });

      next();
    } catch (error) {
      Logger.error('Error in requirePermission middleware', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  };
}

/**
 * Middleware: Require tenant membership (no specific permission)
 *
 * Validates that user is an active member of the tenant
 */
export function requireTenantMembership() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const tenantId = extractTenantId(req);

      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId is required' });
      }

      const membership = await getTenantMembership(req.user.id, tenantId);

      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this tenant' });
      }

      req.membership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
}
