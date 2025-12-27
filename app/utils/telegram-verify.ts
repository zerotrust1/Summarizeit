/**
 * Telegram Mini App signature verification
 * Validates that initData was signed by Telegram's servers
 */

import { createHmac } from 'crypto';

/**
 * Verify Telegram WebApp initData signature
 * @param initData Raw initData string from Telegram.WebApp.initData
 * @param botToken Bot token (get from @BotFather)
 * @returns true if signature is valid, false otherwise
 */
export function verifyTelegramSignature(
  initData: string,
  botToken: string
): boolean {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      console.warn('No hash in initData');
      return false;
    }

    // Remove hash from params
    params.delete('hash');

    // Sort and format data for verification
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create HMAC using bot token
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const signature = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isValid = signature === hash;

    if (!isValid) {
      console.warn('Invalid Telegram signature');
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying Telegram signature:', error);
    return false;
  }
}

/**
 * Extract user ID from verified initData
 * @param initData Raw initData string
 * @returns User ID or null if parsing fails
 */
export function extractUserIdFromInitData(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');

    if (!userParam) {
      console.warn('No user data in initData');
      return null;
    }

    const user = JSON.parse(userParam);
    const userId = user.id?.toString();

    if (!userId) {
      console.warn('User ID missing in Telegram initData');
      return null;
    }

    return userId;
  } catch (error) {
    console.error('Failed to parse Telegram user from initData:', error);
    return null;
  }
}

/**
 * Validate initData and extract user ID
 * @param initData Raw initData string from Telegram
 * @param botToken Bot token for signature verification
 * @returns { valid: boolean, userId: string | null }
 */
export function validateTelegramInitData(
  initData: string | undefined,
  botToken: string | undefined
): { valid: boolean; userId: string | null } {
  // If no bot token, skip signature verification (development mode)
  if (!botToken) {
    console.warn('TELEGRAM_BOT_TOKEN not set, skipping signature verification');
    const userId = extractUserIdFromInitData(initData || '');
    return { valid: !!userId, userId };
  }

  // Verify signature
  if (!initData || !verifyTelegramSignature(initData, botToken)) {
    return { valid: false, userId: null };
  }

  // Extract user ID
  const userId = extractUserIdFromInitData(initData);
  return { valid: !!userId, userId };
}
