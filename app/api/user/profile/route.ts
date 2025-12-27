/**
 * Get user profile with Telegram data and quota info
 * Endpoint: POST /api/user/profile
 * Returns: User profile, Telegram photo, quota status, premium status
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramInitData } from '@/app/utils/telegram-verify';
import { getUserQuotaInfo } from '@/app/utils/user-rate-limit';

interface UserProfileRequest {
  initData?: string;
}

interface UserProfile {
  userId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  isPremium: boolean;
  quotaUsed: number;
  quotaRemaining: number;
  quotaLimit: number;
  quotaResetAt: string;
}

/**
 * Extract user data from Telegram initData
 */
function extractTelegramUserData(initData: string): {
  userId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
} | null {
  try {
    const params = new URLSearchParams(initData);
    const userParam = params.get('user');

    if (!userParam) {
      return null;
    }

    const user = JSON.parse(userParam);

    return {
      userId: user.id?.toString() || '',
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      photoUrl: user.photo_url,
    };
  } catch (error) {
    console.error('Failed to extract Telegram user data:', error);
    return null;
  }
}

/**
 * Check if user has premium status
 * (Currently hardcoded to false - can be connected to payment system)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function checkPremiumStatus(userId: string): boolean {
  // TODO: Connect to premium/subscription database
  // For now, return false for all users
  // Future: Check user_premium_status or custom premium_users table

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { initData } = (await request.json()) as UserProfileRequest;

    if (!initData) {
      return NextResponse.json(
        { error: 'initData is required' },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // Validate Telegram signature
    const { valid, userId: validatedUserId } = validateTelegramInitData(initData, botToken);

    if (!valid || !validatedUserId) {
      return NextResponse.json(
        { error: 'Invalid Telegram authentication' },
        { status: 401 }
      );
    }

    // Extract user data from initData
    const _telegramData = extractTelegramUserData(initData);

    if (!_telegramData) {
      return NextResponse.json(
        { error: 'Failed to extract user data' },
        { status: 400 }
      );
    }

    // Get quota information
    const quotaInfo = getUserQuotaInfo(validatedUserId);

    // Check premium status
    const isPremium = checkPremiumStatus(validatedUserId);

    // Build user profile
    const profile: UserProfile = {
      userId: validatedUserId,
      firstName: _telegramData.firstName,
      lastName: _telegramData.lastName,
      username: _telegramData.username,
      photoUrl: _telegramData.photoUrl, // Telegram provides this in initData
      isPremium,
      quotaUsed: quotaInfo.used,
      quotaRemaining: quotaInfo.remaining,
      quotaLimit: 10,
      quotaResetAt: quotaInfo.resetAtDate,
    };

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Profile Error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}
