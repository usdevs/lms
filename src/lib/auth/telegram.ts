/**
 * Telegram Authentication Verification
 *
 * Verifies Telegram Login Widget authentication data
 * @see https://core.telegram.org/widgets/login
 */

import crypto from 'crypto';
import type { TelegramAuthData, ValidatedTelegramAuth } from '@/lib/types/auth';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN as string;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set');
}

// Maximum age of auth data (24 hours in seconds)
const MAX_AUTH_AGE = 24 * 60 * 60;

/**
 * Verify Telegram authentication data
 *
 * This function validates the data received from Telegram Login Widget:
 * 1. Checks that all required fields are present
 * 2. Verifies the auth_date is within 24 hours
 * 3. Validates the hash signature using HMAC-SHA256
 *
 * @param authData - Data received from Telegram Login Widget
 * @returns Validation result with user data if successful
 */
export function verifyTelegramAuth(
  authData: TelegramAuthData
): ValidatedTelegramAuth {
  try {
    // Check required fields
    if (!authData.id || !authData.first_name || !authData.hash || !authData.auth_date) {
      return {
        isValid: false,
        error: 'Missing required fields from Telegram auth data',
      };
    }

    // Check auth_date is within acceptable range (24 hours)
    const authDate = new Date(authData.auth_date * 1000);
    const now = new Date();
    const ageInSeconds = (now.getTime() - authDate.getTime()) / 1000;

    if (ageInSeconds > MAX_AUTH_AGE) {
      return {
        isValid: false,
        error: 'Authentication data is too old (expired after 24 hours)',
      };
    }

    // Verify hash signature
    const isValidSignature = verifyTelegramSignature(authData);

    if (!isValidSignature) {
      return {
        isValid: false,
        error: 'Invalid signature - authentication data may have been tampered with',
      };
    }

    // Return validated data
    return {
      isValid: true,
      telegramId: authData.id,
      firstName: authData.first_name,
      lastName: authData.last_name,
      username: authData.username,
      photoUrl: authData.photo_url,
      authDate,
    };
  } catch (error) {
    console.error('Error verifying Telegram auth:', error);
    return {
      isValid: false,
      error: 'Internal error during verification',
    };
  }
}

/**
 * Verify Telegram signature using HMAC-SHA256
 *
 * Algorithm from Telegram documentation:
 * 1. Create a data-check string from all fields except 'hash'
 * 2. Create secret key by hashing bot token with SHA256
 * 3. Calculate HMAC-SHA256 of data-check string with secret key
 * 4. Compare with provided hash
 *
 * @param authData - Telegram auth data
 * @returns True if signature is valid
 */
function verifyTelegramSignature(authData: TelegramAuthData): boolean {
  try {
    const { hash, ...dataFields } = authData;

    // Create data-check string
    const dataCheckString = Object.keys(dataFields)
      .filter((key) => dataFields[key as keyof typeof dataFields] !== undefined)
      .sort()
      .map((key) => `${key}=${dataFields[key as keyof typeof dataFields]}`)
      .join('\n');

    // Create secret key by hashing bot token with SHA256
    const secretKey = crypto
      .createHash('sha256')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    // Calculate HMAC-SHA256
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare with provided hash (constant-time comparison)
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(hash, 'hex')
    );
  } catch (error) {
    console.error('Error verifying Telegram signature:', error);
    return false;
  }
}

/**
 * Extract Telegram user data from auth response
 * Useful for creating/updating user records
 *
 * @param authData - Validated Telegram auth data
 * @returns User data object
 */
export function extractTelegramUserData(authData: ValidatedTelegramAuth) {
  if (!authData.isValid || !authData.telegramId) {
    throw new Error('Cannot extract user data from invalid auth response');
  }

  return {
    telegramId: authData.telegramId.toString(),
    telegramHandle: authData.username || `user_${authData.telegramId}`,
    firstName: authData.firstName!,
    lastName: authData.lastName || null,
    photoUrl: authData.photoUrl || null,
  };
}
