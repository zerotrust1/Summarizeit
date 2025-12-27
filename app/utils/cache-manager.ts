/**
 * High-performance cache manager with persistent storage
 * Eliminates file I/O on every request
 * Syncs to disk periodically (every 5 seconds)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface CacheEntry<T> {
  data: T;
  lastModified: number;
}

interface PersistenceConfig {
  storageFile: string;
  syncIntervalMs: number;
}

/**
 * Generic cache manager with periodic disk sync
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private dirty = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private config: PersistenceConfig;

  constructor(config: PersistenceConfig) {
    this.config = config;
    this.loadFromDisk();
    this.startPeriodicSync();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    return entry?.data || null;
  }

  /**
   * Set value in cache and mark dirty for disk sync
   */
  set(key: string, value: T): void {
    this.cache.set(key, {
      data: value,
      lastModified: Date.now(),
    });
    this.dirty = true;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.dirty = true;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get all entries
   */
  getAll(): Map<string, T> {
    const result = new Map<string, T>();
    for (const [key, entry] of this.cache.entries()) {
      result.set(key, entry.data);
    }
    return result;
  }

  /**
   * Load data from disk into memory
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.config.storageFile)) {
        const data = fs.readFileSync(this.config.storageFile, 'utf-8');
        const records = JSON.parse(data) as Array<[string, T]>;
        for (const [key, value] of records) {
          this.cache.set(key, {
            data: value,
            lastModified: Date.now(),
          });
        }
        console.log(`[Cache] Loaded ${records.length} entries from disk`);
      }
    } catch (error) {
      console.error('[Cache] Failed to load from disk:', error);
    }
  }

  /**
   * Save dirty cache to disk
   */
  private saveToDisk(): void {
    if (!this.dirty) {
      return;
    }

    try {
      const records: Array<[string, T]> = Array.from(this.cache.entries()).map(
        ([key, entry]) => [key, entry.data]
      );
      fs.writeFileSync(
        this.config.storageFile,
        JSON.stringify(records, null, 2)
      );
      this.dirty = false;
      console.log(`[Cache] Synced ${records.length} entries to disk`);
    } catch (error) {
      console.error('[Cache] Failed to save to disk:', error);
      this.dirty = true; // Retry on next sync
    }
  }

  /**
   * Start periodic sync to disk
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(
      () => this.saveToDisk(),
      this.config.syncIntervalMs
    );
    // Allow process to exit even if sync interval is running
    this.syncInterval.unref?.();
  }

  /**
   * Stop periodic sync and save final state
   */
  shutdown(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.saveToDisk();
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.cache.clear();
    this.dirty = true;
    this.saveToDisk();
  }
}

// Singleton instances for quotas and history
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let quotasCache: CacheManager<any> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let historyCache: CacheManager<any> | null = null;

/**
 * Get or create quotas cache
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getQuotasCache(): CacheManager<any> {
  if (!quotasCache) {
    quotasCache = new CacheManager({
      storageFile: path.join(os.tmpdir(), 'telegram_user_quotas.json'),
      syncIntervalMs: 5000, // Sync every 5 seconds
    });
  }
  return quotasCache;
}

/**
 * Get or create history cache
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getHistoryCache(): CacheManager<any> {
  if (!historyCache) {
    historyCache = new CacheManager({
      storageFile: path.join(os.tmpdir(), 'telegram_user_history.json'),
      syncIntervalMs: 5000, // Sync every 5 seconds
    });
  }
  return historyCache;
}

/**
 * Shutdown all caches (call on app exit)
 */
export function shutdownCaches(): void {
  quotasCache?.shutdown();
  historyCache?.shutdown();
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('exit', () => shutdownCaches());
  process.on('SIGINT', () => {
    shutdownCaches();
    process.exit(0);
  });
}
