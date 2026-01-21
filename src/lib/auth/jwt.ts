/**
 * JWT Token Management Utilities
 *
 * Handles creation, verification, and decoding of JWT tokens for session management.
 */

import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@/lib/types/auth';

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

/**
 * Sign a JWT token with user payload
 *
 * @param payload - User data to encode in the token
 * @returns Signed JWT token string
 */
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (jwt.sign as any)(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256',
    });

    return token;
  } catch (error) {
    console.error('Error signing JWT token:', error);
    throw new Error('Failed to sign JWT token');
  }
}

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT token string to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decoded = (jwt.verify as any)(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      console.error('Error verifying JWT token:', error);
      throw new Error('Failed to verify token');
    }
  }
}

/**
 * Decode a JWT token without verifying signature
 * Useful for reading token data before verification
 *
 * @param token - JWT token string to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Check if a token is expired without throwing an error
 *
 * @param token - JWT token string to check
 * @returns True if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch {
    return true;
  }
}

/**
 * Get token expiration time
 *
 * @param token - JWT token string
 * @returns Expiration date or null if token is invalid
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}
