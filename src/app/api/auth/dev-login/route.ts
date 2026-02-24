/**
 * Dev-only: set the dev-role cookie from the client.
 * Keeps all cookie logic in session.ts; the client just POSTs the role and refreshes.
 *
 * POST /api/auth/dev-role
 * Body: { "role": "ADMIN" | "LOGS" | "IH" | "REQUESTER" }
 */

import { UserRole } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { setDevRoleCookie } from '@/lib/auth/session';
import { DEV_ROLES } from '@/lib/auth/dev-auth';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const role = body?.role as string | undefined;

    if (!role || !DEV_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await setDevRoleCookie(role as UserRole);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dev role set error:', error);
    return NextResponse.json({ error: 'Failed to set dev role' }, { status: 500 });
  }
}
