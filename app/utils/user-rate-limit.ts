/**
 * Per-user rate limiting with optimized caching
 * Tracks summarization requests per Telegram user ID
 * Limit: 10 summarizations per day (24-hour rolling window)
 * 
 * Performance: Uses in-memory cache with periodic disk sync
 * No file I/O on every check - only periodic syncs
 */

import { getQuotasCache } from './cache-manager';

interface UserQuotaRecord {
  userId: string;
  count: number;
  resetAt: number; // timestamp when quota resets
}

/**
 * Initialize storage (call once at startup)
 */
export function initializeQuotaStorage(): void {
  // Cache manager initializes itself
  getQuotasCache();
}

/**
 * Check if user has remaining quota for summarization
 * @param userId Telegram user ID
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkUserQuota(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  resetAtDate: string;
} {
  const DAILY_LIMIT = 10;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const cache = getQuotasCache();
  let record = cache.get(userId) as UserQuotaRecord | null;

  // If no record exists or quota has reset
  if (!record || now >= record.resetAt) {
    record = {
      userId,
      count: 0,
      resetAt: now + DAY_MS,
    };
    cache.set(userId, record);
  }

  const remaining = Math.max(0, DAILY_LIMIT - record.count);
  const allowed = remaining > 0;

  // Update quota if allowed
  if (allowed) {
    record.count += 1;
    cache.set(userId, record);
  }

  return {
    allowed,
    remaining: Math.max(0, remaining - 1), // -1 because we already incremented
    resetAt: record.resetAt,
    resetAtDate: new Date(record.resetAt).toISOString(),
  };
}

/**
 * Get current usage without incrementing
 */
export function getUserQuotaInfo(userId: string): {
  used: number;
  remaining: number;
  resetAt: number;
  resetAtDate: string;
} {
  const DAILY_LIMIT = 10;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const cache = getQuotasCache();
  const record = cache.get(userId) as UserQuotaRecord | null;

  // If no record exists or quota has reset
  if (!record || now >= record.resetAt) {
    return {
      used: 0,
      remaining: DAILY_LIMIT,
      resetAt: now + DAY_MS,
      resetAtDate: new Date(now + DAY_MS).toISOString(),
    };
  }

  const used = record.count;
  const remaining = Math.max(0, DAILY_LIMIT - used);

  return {
    used,
    remaining,
    resetAt: record.resetAt,
    resetAtDate: new Date(record.resetAt).toISOString(),
  };
}

/**
 * Reset a user's quota (admin only)
 */
export function resetUserQuota(userId: string): void {
  const cache = getQuotasCache();
  cache.delete(userId);
}

/**
 * Clear all expired quotas (call periodically)
 */
export function clearExpiredQuotas(): void {
  const cache = getQuotasCache();
  const now = Date.now();
  let cleared = 0;

  const allRecords = cache.getAll();
  for (const [userId, record] of allRecords.entries()) {
    if (now >= (record as UserQuotaRecord).resetAt) {
      cache.delete(userId);
      cleared++;
    }
  }

  if (cleared > 0) {
    console.log(`Cleared ${cleared} expired quota records`);
  }
}
