/**
 * Login API Route
 *
 * Handles Telegram OAuth callback and creates user session.
 *
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyTelegramAuth, extractTelegramUserData } from '@/lib/auth/telegram';
import { createUserToken, setSessionCookie } from '@/lib/auth/session';
import type { TelegramAuthData, LoginResponse } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const authData: TelegramAuthData = await request.json();

    // Verify Telegram authentication data
    const validation = verifyTelegramAuth(authData);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid Telegram authentication',
        } as LoginResponse,
        { status: 401 }
      );
    }

    // Extract user data
    const telegramUserData = extractTelegramUserData(validation);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: telegramUserData.telegramId },
      include: {
        ihMemberships: {
          select: {
            ihId: true,
          },
        },
      },
    });

    if (!user) {
      // Create new user with REQUESTER role by default
      user = await prisma.user.create({
        data: {
          telegramId: telegramUserData.telegramId,
          username: telegramUserData.username,
          firstName: telegramUserData.firstName,
          lastName: telegramUserData.lastName,
          photoUrl: telegramUserData.photoUrl,
          role: 'REQUESTER', // Default role for new users
        },
        include: {
          ihMemberships: {
            select: {
              ihId: true,
            },
          },
        },
      });

      console.log(`Created new user: ${user.firstName} (${user.userId})`);
    } else {
      // Update existing user's profile data
      user = await prisma.user.update({
        where: { userId: user.userId },
        data: {
          username: telegramUserData.username,
          firstName: telegramUserData.firstName,
          lastName: telegramUserData.lastName,
          photoUrl: telegramUserData.photoUrl,
          updatedAt: new Date(),
        },
        include: {
          ihMemberships: {
            select: {
              ihId: true,
            },
          },
        },
      });

      console.log(`Updated existing user: ${user.firstName} (${user.userId})`);
    }

    // Create JWT token
    const token = await createUserToken(user.userId);

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          userId: user.userId,
          telegramId: user.telegramId.toString(),
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.photoUrl,
          role: user.role,
          ihMemberships: user.ihMemberships.map((m) => m.ihId),
        },
      } as LoginResponse,
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during login',
      } as LoginResponse,
      { status: 500 }
    );
  }
}
