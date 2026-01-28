/**
 * RBAC Permission System
 *
 * Define roles, permissions, and authorization logic
 */

export type Role = 'super_admin' | 'tenant_admin' | 'manager' | 'agent';

export type Permission =
  // Inbox permissions
  | 'inbox.read'          // Read all threads in tenant
  | 'inbox.read_assigned' // Read only assigned threads
  | 'inbox.write'         // Send messages, reply
  | 'inbox.assign'        // Assign threads to members
  | 'inbox.admin'         // Create/delete WhatsApp accounts

  // Analytics
  | 'analytics.read'

  // Settings & Members
  | 'settings.write'
  | 'members.manage'

  // Wildcard (super admin only)
  | '*';

/**
 * Permission Matrix: defines what each role can do
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ['*'],

  tenant_admin: [
    'inbox.read',
    'inbox.write',
    'inbox.assign',
    'inbox.admin',
    'analytics.read',
    'settings.write',
    'members.manage',
  ],

  manager: [
    'inbox.read',
    'inbox.write',
    'inbox.assign',
    'analytics.read',
  ],

  agent: [
    'inbox.read_assigned',
    'inbox.write',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];

  // Super admin has wildcard access
  if (rolePermissions.includes('*')) {
    return true;
  }

  return rolePermissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if role can access all threads or only assigned ones
 */
export function canAccessAllThreads(role: Role): boolean {
  return hasPermission(role, 'inbox.read');
}

/**
 * Check if role can only access assigned threads
 */
export function canOnlyAccessAssigned(role: Role): boolean {
  return role === 'agent' && hasPermission(role, 'inbox.read_assigned');
}
