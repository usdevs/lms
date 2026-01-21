/**
 * Telegram Auth Callback Route
 *
 * Handles the callback from Telegram Login Widget using authCallbackUrl approach.
 * Validates the auth data, creates/updates user, sets session cookie, and redirects back.
 *
 * GET /api/auth/callback
 */

import { AuthDataValidator } from '@telegram-auth/server';
import { urlStrToAuthDataMap } from '@telegram-auth/server/utils';
import { StatusCodes } from 'http-status-codes';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

import prisma from '@/lib/prisma';
import { createUserToken, sessionCookieOptions } from '@/lib/auth/session';

const validator = new AuthDataValidator({
  botToken: process.env.TELEGRAM_BOT_TOKEN!,
});

export async function GET(req: Request) {
  const data = urlStrToAuthDataMap(req.url);

  let userCredentials;

  try {
    userCredentials = await validator.validate(data);
  } catch {
    return Response.json(
      'Failed to validate Telegram authentication!',
      { status: StatusCodes.UNAUTHORIZED }
    );
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { telegramId: userCredentials.id.toString() },
  });

  if (user === null) {
    // Create new user
    user = await prisma.user.create({
      data: {
        telegramId: userCredentials.id.toString(),
        telegramHandle: userCredentials.username || `user_${userCredentials.id}`,
        firstName: userCredentials.first_name,
        lastName: userCredentials.last_name || null,
        photoUrl: userCredentials.photo_url || null,
        role: 'REQUESTER', // Default role for new users
      },
    });

    console.log(`Created new user: ${user.firstName} (${user.userId})`);
  } else {
    // Update existing user's profile data
    user = await prisma.user.update({
      where: { userId: user.userId },
      data: {
        telegramHandle: userCredentials.username || `user_${userCredentials.id}`,
        firstName: userCredentials.first_name,
        lastName: userCredentials.last_name || null,
        photoUrl: userCredentials.photo_url || null,
        updatedAt: new Date(),
      },
    });

    console.log(`Updated existing user: ${user.firstName} (${user.userId})`);
  }

  // Create JWT token
  const token = await createUserToken(user.userId);

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, sessionCookieOptions);

  // Redirect back to the referring page or home
  const headersList = await headers();
  const redirectUrl = headersList.get('Referer') || '/';
  redirect(redirectUrl);
}
