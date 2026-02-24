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
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import prisma from '@/lib/prisma';
import { setSessionCookie } from '@/lib/auth/session';

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

  const telegramId = userCredentials.id.toString();
  const profileData = {
    firstName: userCredentials.first_name,
    lastName: userCredentials.last_name || null,
    photoUrl: userCredentials.photo_url || null,
    telegramHandle: userCredentials.username || `user_${userCredentials.id}`,
  };

  // Find user by telegramId first
  let user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (user) {
    // Found by telegramId — update profile
    user = await prisma.user.update({
      where: { userId: user.userId },
      data: profileData,
    });
    console.log(`Updated existing user: ${user.firstName} (${user.userId})`);
  } else if (userCredentials.username) {
    // Fallback: try to find by telegramHandle (for pre-created users)
    user = await prisma.user.findUnique({
      where: { telegramHandle: userCredentials.username },
    });
    if (user) {
      // Link existing user — set telegramId and refresh profile
      user = await prisma.user.update({
        where: { userId: user.userId },
        data: { telegramId, ...profileData },
      });
      console.log(`Linked existing user by handle: ${user.firstName} (${user.userId})`);
    }
  }

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        telegramId,
        telegramHandle: profileData.telegramHandle,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        photoUrl: profileData.photoUrl,
        role: 'REQUESTER',
      },
    });
    console.log(`Created new user: ${user.firstName} (${user.userId})`);
  }

  // Create JWT token
  await setSessionCookie(user.userId);

  // Redirect back to the referring page or home
  const headersList = await headers();
  const redirectUrl = headersList.get('Referer') || '/';
  redirect(redirectUrl);
}
