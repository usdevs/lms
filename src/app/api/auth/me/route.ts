/**
 * Current User API Route
 *
 * Returns the currently authenticated user's information.
 *
 * GET /api/auth/me
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { MeResponse } from '@/lib/types/auth';

export async function GET() {
  try {
    // Get current session
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
        } as MeResponse,
        { status: 401 }
      );
    }

    // Return user data
    return NextResponse.json(
      {
        success: true,
        user: {
          userId: session.user.userId,
          telegramId: session.user.telegramId.toString(),
          username: session.user.username,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          photoUrl: session.user.photoUrl,
          role: session.user.role,
          ihMemberships: session.ihMemberships,
        },
      } as MeResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting current user:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as MeResponse,
      { status: 500 }
    );
  }
}
