/**
 * Request deduplication cache
 * Prevents duplicate OpenAI calls for the same text
 * Reduces API costs and improves response time
 */

import { createHash } from 'crypto';

interface CachedResponse {
  summary: string;
  keyPoints: string[];
  timestamp: number;
}

// In-memory cache for in-flight requests and recent results
const requestCache = new Map<string, Promise<CachedResponse>>();
const responseCache = new Map<string, CachedResponse>();

// Cache TTL: 1 hour
const CACHE_TTL_MS = 60 * 60 * 1000;

// Cleanup interval: every 10 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Generate hash from text for caching
 */
function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Get cached summary if available
 */
export function getCachedSummary(text: string): CachedResponse | null {
  const hash = hashText(text);
  const cached = responseCache.get(hash);

  if (!cached) {
    return null;
  }

  // Check if cache expired
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    responseCache.delete(hash);
    return null;
  }

  console.log(`[Cache Hit] Summary found for text (${hash})`);
  return cached;
}

/**
 * Get in-flight request if exists (deduplication)
 */
export function getInflightRequest(text: string): Promise<CachedResponse> | null {
  const hash = hashText(text);
  return requestCache.get(hash) || null;
}

/**
 * Register in-flight request
 */
export function registerInflightRequest(
  text: string,
  promise: Promise<CachedResponse>
): void {
  const hash = hashText(text);
  requestCache.set(hash, promise);

  // Clean up after request completes
  promise
    .then((result) => {
      // Move to response cache
      responseCache.set(hash, result);
    })
    .finally(() => {
      requestCache.delete(hash);
    });
}

/**
 * Manually cache a response
 */
export function cacheResponse(text: string, response: CachedResponse): void {
  const hash = hashText(text);
  responseCache.set(hash, response);
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  requestCache.clear();
  responseCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  inflight: number;
  cached: number;
  totalSize: number;
} {
  let totalSize = 0;

  for (const entry of responseCache.values()) {
    totalSize += JSON.stringify(entry).length;
  }

  return {
    inflight: requestCache.size,
    cached: responseCache.size,
    totalSize,
  };
}

/**
 * Start periodic cleanup of expired entries
 */
export function startCleanupInterval(): NodeJS.Timeout {
  return setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [hash, cached] of responseCache.entries()) {
      if (now - cached.timestamp > CACHE_TTL_MS) {
        responseCache.delete(hash);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache Cleanup] Removed ${cleaned} expired entries`);
      const stats = getCacheStats();
      console.log(`[Cache Stats]`, stats);
    }
  }, CLEANUP_INTERVAL_MS);
}

// Start cleanup on import
const cleanupInterval = startCleanupInterval();
// Allow process to exit even if cleanup interval is running
cleanupInterval.unref?.();
