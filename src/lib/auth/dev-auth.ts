/**
 * Dev-only auth constants. Used by session (server) and DevRoleDropdown (client).
 * No server-only imports here so client can import safely.
 */

import { UserRole } from '@prisma/client';

export const DEV_ROLE_COOKIE = 'dev-role';

export const DEV_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.LOGS, UserRole.IH, UserRole.REQUESTER];

/** Role → seed user handle (matches prisma/seed.ts). */
export const DEV_ROLE_HANDLE: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'admin',
  [UserRole.LOGS]: 'miket',
  [UserRole.IH]: 'johndoe',
  [UserRole.REQUESTER]: 'alicew',
};


