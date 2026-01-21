/**
 * Session Management Utilities
 *
 * Handles session creation, retrieval, and validation from cookies.
 */

import { cookies } from 'next/headers';
import type { JWTPayload, Session } from '@/lib/types/auth';
import { verifyToken, signToken } from './jwt';
import prisma from '@/lib/prisma';

const COOKIE_NAME = 'auth-token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

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
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, sessionCookieOptions);
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
 * Get current session from cookie
 *
 * Retrieves and validates the JWT token from cookie,
 * then fetches the full user data from database.
 *
 * @returns Session object with user data or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  try {
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
  // Fetch user with IH memberships
  const user = await prisma.user.findUnique({
    where: { userId },
    include: {
      ihMemberships: {
        select: {
          ihId: true,
        },
      },
    },
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
    role: user.role,
    ihMemberships: user.ihMemberships.map((m) => m.ihId),
  };

  // Sign and return token
  return signToken(payload);
}

/**
 * Refresh session token
 *
 * Creates a new token with updated expiration time.
 * Useful for extending sessions before they expire.
 *
 * @returns New JWT token or null if not authenticated
 */
export async function refreshSession(): Promise<string | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Create new token
  const newToken = await createUserToken(session.user.userId);

  // Update cookie
  await setSessionCookie(newToken);

  return newToken;
}
