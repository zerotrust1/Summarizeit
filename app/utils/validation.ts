/**
 * Centralized validation for summarization requests
 * Eliminates duplicate validation logic across routes
 */

import { NextResponse } from 'next/server';
import { checkUserQuota, getUserQuotaInfo } from './user-rate-limit';
import { validateTelegramInitData } from './telegram-verify';

export interface ValidationResult {
  valid: boolean;
  error?: {
    message: string;
    status: number;
  };
  quotaRemaining?: number;
  quotaResetAt?: string;
  userId?: string;
}

const MAX_TEXT_LENGTH = 10000;

/**
 * Validate summarization request
 * Checks: text validity, length, and user quota
 */
export async function validateSummarizeRequest(
  text: string | undefined,
  initData: string | undefined,
  botToken: string | undefined
): Promise<ValidationResult> {
  // 1. Check if text is provided
  if (!text || text.trim().length === 0) {
    return {
      valid: false,
      error: {
        message: 'No text provided for summarization',
        status: 400,
      },
    };
  }

  // 2. Check text length
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: {
        message: `Text is too long. Maximum ${MAX_TEXT_LENGTH} characters allowed (you provided ${text.length} characters)`,
        status: 400,
      },
    };
  }

  // 3. Check per-user quota if in Telegram context
  let quotaRemaining: number | undefined;
  let quotaResetAt: string | undefined;
  let userId: string | undefined;

  if (initData) {
    const { valid, userId: extractedUserId } = validateTelegramInitData(initData, botToken);

    if (valid && extractedUserId) {
      userId = extractedUserId;
      const quota = checkUserQuota(userId);

      if (!quota.allowed) {
        return {
          valid: false,
          error: {
            message: `Daily summarization limit reached. You have 10 summarizations per day. Try again after ${quota.resetAtDate}`,
            status: 429,
          },
          quotaRemaining: 0,
          quotaResetAt: quota.resetAtDate,
        };
      }

      quotaRemaining = quota.remaining;
      quotaResetAt = quota.resetAtDate;
    }
  }

  return {
    valid: true,
    quotaRemaining,
    quotaResetAt,
    userId,
  };
}

/**
 * Create error response from validation result
 */
export function createValidationErrorResponse(result: ValidationResult): NextResponse {
  return NextResponse.json(
    {
      error: result.error?.message || 'Validation failed',
      ...(result.quotaResetAt && { resetAt: result.quotaResetAt }),
    },
    { status: result.error?.status || 400 }
  );
}

/**
 * Get user quota info without incrementing count
 */
export function getQuotaDisplay(userId: string | undefined) {
  if (!userId) {
    return null;
  }

  return getUserQuotaInfo(userId);
}
