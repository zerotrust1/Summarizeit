/**
 * Per-user rate limiting with persistent storage
 * Tracks summarization requests per Telegram user ID
 * Limit: 10 summarizations per day (24-hour rolling window)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface UserQuotaRecord {
  userId: string;
  count: number;
  resetAt: number; // timestamp when quota resets
}

// In-memory store for development (in production, use Redis/database)
const quotaStore = new Map<string, UserQuotaRecord>();

// For persistent storage across restarts, use a temp file (development only)
// In production, replace with Redis or database
let storageFile: string | null = null;

function getStorageFile(): string {
  if (!storageFile) {
    storageFile = path.join(os.tmpdir(), 'summarize_user_quotas.json');
  }
  return storageFile;
}

/**
 * Load quotas from persistent storage
 */
function loadQuotas(): void {
  try {
    const file = getStorageFile();
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      const records = JSON.parse(data) as UserQuotaRecord[];
      for (const record of records) {
        quotaStore.set(record.userId, record);
      }
    }
  } catch (error) {
    console.error('Failed to load quotas from storage:', error);
  }
}

/**
 * Save quotas to persistent storage
 */
function saveQuotas(): void {
  try {
    const file = getStorageFile();
    const records = Array.from(quotaStore.values());
    fs.writeFileSync(file, JSON.stringify(records, null, 2));
  } catch (error) {
    console.error('Failed to save quotas to storage:', error);
  }
}

/**
 * Initialize storage (call once at startup)
 */
export function initializeQuotaStorage(): void {
  loadQuotas();
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

  // Load fresh data from storage
  loadQuotas();

  let record = quotaStore.get(userId);

  // If no record exists or quota has reset
  if (!record || now >= record.resetAt) {
    record = {
      userId,
      count: 0,
      resetAt: now + DAY_MS,
    };
    quotaStore.set(userId, record);
  }

  const remaining = Math.max(0, DAILY_LIMIT - record.count);
  const allowed = remaining > 0;

  // Save updated quota
  if (allowed) {
    record.count += 1;
    saveQuotas();
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

  loadQuotas();
  const record = quotaStore.get(userId);

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
  quotaStore.delete(userId);
  saveQuotas();
}

/**
 * Clear all expired quotas (call periodically)
 */
export function clearExpiredQuotas(): void {
  const now = Date.now();
  let cleared = 0;

  for (const [userId, record] of quotaStore.entries()) {
    if (now >= record.resetAt) {
      quotaStore.delete(userId);
      cleared++;
    }
  }

  if (cleared > 0) {
    saveQuotas();
    console.log(`Cleared ${cleared} expired quota records`);
  }
}
