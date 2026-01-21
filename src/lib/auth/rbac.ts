/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Hierarchy: REQUESTER -> IH -> LOGS -> ADMIN
 *
 * Access levels:
 * - REQUESTER / IH: Can only see Catalogue
 * - LOGS / ADMIN: Can see all tabs (Catalogue, Loans, Users)
 * 
 * User Management (hierarchical):
 * - LOGS can manage (create/edit/delete) REQUESTER and IH users
 * - ADMIN can manage REQUESTER, IH, and LOGS users
 * - Users can only manage users of strictly lower rank
 */

import { UserRole } from '@prisma/client';

/**
 * Role hierarchy levels (higher number = more permissions)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.REQUESTER]: 1,
  [UserRole.IH]: 2,
  [UserRole.LOGS]: 3,
  [UserRole.ADMIN]: 4,
};

/**
 * Check if a role has at least the specified minimum role level
 */
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Check if user can view loans tab
 * Only LOGS and ADMIN can view loans
 */
export function canViewLoans(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.LOGS);
}

/**
 * Check if user can view users tab
 * Only LOGS and ADMIN can view users tab
 */
export function canViewUsers(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.LOGS);
}

/**
 * Check if user can manage (CRUD) users
 * LOGS can manage REQUESTER and IH users
 * ADMIN can manage all users
 */
export function canManageUsers(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.LOGS);
}

/**
 * Check if user can manage a specific target user based on role hierarchy
 * Users can only manage users of strictly lower rank
 * - ADMIN can manage: REQUESTER, IH, LOGS
 * - LOGS can manage: REQUESTER, IH
 * - IH and REQUESTER cannot manage anyone
 */
export function canManageUserOfRole(actorRole: UserRole, targetRole: UserRole): boolean {
  // Must be at least LOGS to manage any users
  if (!hasMinimumRole(actorRole, UserRole.LOGS)) {
    return false;
  }
  // Can only manage users of strictly lower rank
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Get the roles that a user can assign to others
 * Users can only assign roles lower than their own
 */
export function getAssignableRoles(actorRole: UserRole): UserRole[] {
  const actorLevel = ROLE_HIERARCHY[actorRole];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([, level]) => level < actorLevel)
    .map(([role]) => role as UserRole);
}

/**
 * Check if user can create a new user with the specified role
 */
export function canCreateUserWithRole(actorRole: UserRole, newUserRole: UserRole): boolean {
  return canManageUserOfRole(actorRole, newUserRole);
}

/**
 * Check if user can view catalogue
 * All roles can view catalogue
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canViewCatalogue(role: UserRole): boolean {
  return true;
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

/**
 * Check if user is at least LOGS level
 */
export function isLogsOrAbove(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.LOGS);
}

/**
 * Check if user can manage items (create, edit, delete)
 * Only LOGS and ADMIN can manage items
 */
export function canManageItems(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.LOGS);
}

/**
 * Check if user can manage loans (approve, reject, return, etc.)
 * Only LOGS and ADMIN can manage loans
 */
export function canManageLoans(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.LOGS);
}

/**
 * Check if user can create loan requests
 * All authenticated users can create loan requests
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function canCreateLoanRequest(role: UserRole): boolean {
  return true;
}

/**
 * Check if user can manage storage locations
 * Only LOGS and ADMIN can manage SLOCs
 */
export function canManageSlocs(role: UserRole): boolean {
  return hasMinimumRole(role, UserRole.LOGS);
}

/**
 * Get available tabs for a user role
 */
export function getAvailableTabs(role: UserRole): Array<{ name: string; href: string }> {
  const tabs = [{ name: 'CATALOGUE', href: '/catalogue' }];

  if (canViewLoans(role)) {
    tabs.push({ name: 'LOANS', href: '/loans' });
  }

  if (canViewUsers(role)) {
    tabs.push({ name: 'USERS', href: '/users' });
  }

  return tabs;
}

/**
 * Check if user has access to a specific route
 */
export function hasRouteAccess(role: UserRole, pathname: string): boolean {
  if (pathname.startsWith('/catalogue')) {
    return canViewCatalogue(role);
  }

  if (pathname.startsWith('/loans')) {
    return canViewLoans(role);
  }

  if (pathname.startsWith('/users')) {
    return canViewUsers(role);
  }

  // Allow access to other routes (home, etc.)
  return true;
}
