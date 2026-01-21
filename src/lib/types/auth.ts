/**
 * Authentication & Authorization Type Definitions
 *
 * This file contains TypeScript types for the authentication system,
 * including user sessions, JWT payloads, and permission structures.
 */

import { UserRole, IHType } from '@prisma/client';

// User Types

/**
 * Basic user information from database
 */
export interface User {
  userId: number;
  telegramId: bigint;
  username: string | null;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  role: UserRole;
  nusnetId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User with IH memberships populated
 */
export interface UserWithMemberships extends User {
  ihMemberships: IHMembership[];
}

/**
 * IH membership information
 */
export interface IHMembership {
  id: number;
  userId: number;
  ihId: string;
  isPrimary: boolean;
  createdAt: Date;
  ih: {
    ihId: string;
    ihName: string;
    ihType: IHType;
  };
}

// Session Types

/**
 * JWT token payload
 */
export interface JWTPayload {
  userId: number;
  telegramId: string; // Converted to string for JSON serialization
  username: string | null;
  firstName: string;
  role: UserRole;
  ihMemberships: string[]; // Array of IH IDs
  iat: number; // Issued at (Unix timestamp)
  exp: number; // Expires at (Unix timestamp)
}

/**
 * Session data stored in context/state
 */
export interface Session {
  user: User;
  ihMemberships: string[]; // IH IDs this user is a member of
  expiresAt: Date;
}

// Telegram Auth Types

/**
 * Data from Telegram Login Widget
 * @see https://core.telegram.org/widgets/login
 */
export interface TelegramAuthData {
  id: number; // Telegram user ID
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number; // Unix timestamp
  hash: string; // HMAC-SHA256 signature
}

/**
 * Validated Telegram auth result
 */
export interface ValidatedTelegramAuth {
  isValid: boolean;
  telegramId?: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  authDate?: Date;
  error?: string;
}

// Permission Types

/**
 * Available permissions in the system
 */
export enum Permission {
  // Item permissions
  VIEW_CATALOGUE = 'view_catalogue',
  CREATE_ITEM = 'create_item',
  EDIT_ITEM = 'edit_item',
  DELETE_ITEM = 'delete_item',

  // Loan permissions
  VIEW_OWN_LOANS = 'view_own_loans',
  VIEW_IH_LOANS = 'view_ih_loans',
  VIEW_ALL_LOANS = 'view_all_loans',
  CREATE_LOAN_REQUEST = 'create_loan_request',
  APPROVE_LOAN_REQUEST = 'approve_loan_request',
  DISPENSE_LOAN = 'dispense_loan',
  RETURN_LOAN = 'return_loan',

  // User management permissions
  MANAGE_USERS = 'manage_users',
  ASSIGN_ROLES = 'assign_roles',

  // IH management permissions
  MANAGE_IH_MEMBERS = 'manage_ih_members',
  VIEW_IH_MEMBERS = 'view_ih_members',

  // System permissions
  VIEW_AUDIT_LOG = 'view_audit_log',
  CONFIGURE_SYSTEM = 'configure_system',
}

/**
 * Role-based permission map
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.REQUESTER]: [
    Permission.VIEW_CATALOGUE,
    Permission.VIEW_OWN_LOANS,
    Permission.CREATE_LOAN_REQUEST,
  ],
  [UserRole.IH]: [
    Permission.VIEW_CATALOGUE,
    Permission.VIEW_OWN_LOANS,
    Permission.VIEW_IH_LOANS,
    Permission.CREATE_LOAN_REQUEST,
    Permission.APPROVE_LOAN_REQUEST,
    Permission.DISPENSE_LOAN,
    Permission.RETURN_LOAN,
    Permission.VIEW_IH_MEMBERS,
  ],
  [UserRole.LOGS]: [
    Permission.VIEW_CATALOGUE,
    Permission.CREATE_ITEM,
    Permission.EDIT_ITEM,
    Permission.DELETE_ITEM,
    Permission.VIEW_OWN_LOANS,
    Permission.VIEW_IH_LOANS,
    Permission.VIEW_ALL_LOANS,
    Permission.CREATE_LOAN_REQUEST,
    Permission.APPROVE_LOAN_REQUEST,
    Permission.DISPENSE_LOAN,
    Permission.RETURN_LOAN,
    Permission.MANAGE_IH_MEMBERS,
    Permission.VIEW_IH_MEMBERS,
  ],
  [UserRole.ADMIN]: [
    // Admin has all permissions
    Permission.VIEW_CATALOGUE,
    Permission.CREATE_ITEM,
    Permission.EDIT_ITEM,
    Permission.DELETE_ITEM,
    Permission.VIEW_OWN_LOANS,
    Permission.VIEW_IH_LOANS,
    Permission.VIEW_ALL_LOANS,
    Permission.CREATE_LOAN_REQUEST,
    Permission.APPROVE_LOAN_REQUEST,
    Permission.DISPENSE_LOAN,
    Permission.RETURN_LOAN,
    Permission.MANAGE_USERS,
    Permission.ASSIGN_ROLES,
    Permission.MANAGE_IH_MEMBERS,
    Permission.VIEW_IH_MEMBERS,
    Permission.VIEW_AUDIT_LOG,
    Permission.CONFIGURE_SYSTEM,
  ],
};

// ============================================
// API Response Types
// ============================================

/**
 * Standard API response for auth endpoints
 */
export interface AuthResponse {
  success: boolean;
  user?: {
    userId: number;
    telegramId: string;
    username: string | null;
    firstName: string;
    lastName: string | null;
    photoUrl: string | null;
    role: UserRole;
    ihMemberships: string[];
  };
  error?: string;
}

/**
 * Login request body
 */
export type LoginRequest = TelegramAuthData;

/**
 * Login response
 */
export type LoginResponse = AuthResponse;

/**
 * Logout response
 */
export interface LogoutResponse {
  success: boolean;
}

/**
 * Current user response
 */
export type MeResponse = AuthResponse;

// Utility Types

/**
 * Type guard to check if user has a specific role
 */
export type HasRole = (user: User, role: UserRole) => boolean;

/**
 * Type guard to check if user has a specific permission
 */
export type HasPermission = (user: User, permission: Permission) => boolean;

/**
 * Type guard to check if user is member of specific IH
 */
export type IsMemberOfIH = (user: UserWithMemberships, ihId: string) => boolean;

/**
 * Type guard to check if user is primary POC of specific IH
 */
export type IsPrimaryPOC = (user: UserWithMemberships, ihId: string) => boolean;
