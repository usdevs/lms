/**
 * Logout API Route
 *
 * Clears the user's session cookie.
 *
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';
import type { LogoutResponse } from '@/lib/types/auth';

export async function POST() {
  try {
    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json(
      {
        success: true,
      } as LogoutResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);

    return NextResponse.json(
      {
        success: false,
      } as LogoutResponse,
      { status: 500 }
    );
  }
}
