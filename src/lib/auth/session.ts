/**
 * Session Management Utilities
 *
 * Handles session creation, retrieval, and validation from cookies.
 * In local dev, getSession() can use the dev-role cookie instead of auth-token.
 */

import { UserRole } from '@prisma/client';
import { cookies } from 'next/headers';
import type { JWTPayload, Session } from '@/lib/types/auth';
import { DEV_ROLE_COOKIE, DEV_ROLE_HANDLE, DEV_ROLES } from '@/lib/auth/dev-auth';
import { verifyToken, signToken } from './jwt';
import prisma from '@/lib/prisma';

const COOKIE_NAME = 'auth-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export { DEV_ROLE_COOKIE, DEV_ROLES };

/**
 * Cookie options for session management
 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: COOKIE_MAX_AGE,
  path: '/',
};

/**
 * Set session cookie with JWT token
 *
 * @param token - JWT token string
 */
export async function setSessionCookie(userId: number): Promise<void> {
  const cookieStore = await cookies();
  const token = await createUserToken(userId);
  cookieStore.set(COOKIE_NAME, token, sessionCookieOptions);
}

/**
 * Set session cookie for local dev
 *
 * @param role - User role to set
 */
export async function setDevRoleCookie(role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set(DEV_ROLE_COOKIE, role, sessionCookieOptions);
}

/**
 * Get session cookie value
 *
 * @returns JWT token string or undefined
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value;
}

/**
 * Clear session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get session for local dev
 *
 * @returns JWT token string or undefined
 */
export async function getDevSession(): Promise<Session | null> {
  const cookieStore = await cookies();

  const devRole = cookieStore.get(DEV_ROLE_COOKIE)?.value as UserRole | undefined;
  if (devRole && DEV_ROLES.includes(devRole)) {
    const handle = DEV_ROLE_HANDLE[devRole];
    const user = await prisma.user.findUnique({
      where: { telegramHandle: handle },
      include: {
        ihMemberships: { select: { ihId: true } },
      },
    });

  if (user) {
    return {
      user: {
        userId: user.userId,
        telegramId: user.telegramId,
        telegramHandle: user.telegramHandle,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        role: user.role,
        nusnetId: user.nusnetId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ihMemberships: user.ihMemberships.map((m) => m.ihId),
      expiresAt: new Date(Date.now() + COOKIE_MAX_AGE * 1000),
    };
  }}
  return null;
}

/**
 * Get current session from cookie
 *
 * In local dev: if dev-role cookie is set, returns session for that role (no auth-token needed).
 * Otherwise: validates JWT from auth-token and fetches user from database.
 *
 * @returns Session object with user data or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  try {

    if (process.env.NODE_ENV === 'development') {
      return await getDevSession();
    }

    const token = await getSessionCookie();

    if (!token) {
      return null;
    }

    // Verify and decode token
    const payload = verifyToken(token);

    if (!payload || !payload.userId) {
      return null;
    }

    // Fetch user from database with IH memberships
    const user = await prisma.user.findUnique({
      where: { userId: payload.userId },
      include: {
        ihMemberships: {
          select: {
            ihId: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Create session object
    const session: Session = {
      user: {
        userId: user.userId,
        telegramId: user.telegramId,
        telegramHandle: user.telegramHandle,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        role: user.role,
        nusnetId: user.nusnetId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ihMemberships: user.ihMemberships.map((m) => m.ihId),
      expiresAt: new Date(payload.exp * 1000),
    };

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 *
 * Useful for protecting pages/routes that require authentication.
 *
 * @returns Session object
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Get current user from session
 *
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Create JWT token for user
 *
 * Fetches user data from database and creates a signed JWT token.
 *
 * @param userId - User ID to create token for
 * @returns JWT token string
 */
export async function createUserToken(userId: number): Promise<string> {
  // Check user exists in db
  const user = await prisma.user.findUnique({
    where: { userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Create JWT payload
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.userId,
    telegramId: user.telegramId,
    telegramHandle: user.telegramHandle,
    firstName: user.firstName,
  };

  // Sign and return token
  return signToken(payload);
}
