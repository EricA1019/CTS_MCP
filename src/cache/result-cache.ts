/**
 * Result Cache - LRU Cache with SHA-256 Hashing
 * 
 * Tier 2C.5: Result Caching
 * - LRU (Least Recently Used) eviction policy
 * - SHA-256 hash-based cache keys
 * - Configurable size and TTL
 * - Performance: <2ms operations (P99)
 */

import { createHash } from 'crypto';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
}

/**
 * LRU Cache with SHA-256 hashing and TTL support
 */
export class ResultCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 100, ttlMs: number = 300000) {
    if (maxSize <= 0) {
      throw new Error('Cache maxSize must be positive');
    }
    if (ttlMs <= 0) {
      throw new Error('Cache TTL must be positive');
    }

    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Generate cache key using SHA-256 hash
   * Format: tool:{toolName}:{sha256}
   */
  generateKey(toolName: string, args: any): string {
    const argsJson = JSON.stringify(args);
    const hash = createHash('sha256').update(argsJson).digest('hex');
    return `tool:${toolName}:${hash}`;
  }

  /**
   * Get value from cache
   * Returns undefined if key doesn't exist or entry is expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Update access count and move to end (LRU)
    entry.accessCount++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   * Implements LRU eviction when cache is full
   */
  set(key: string, value: T): void {
    // If key exists, update it
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If cache is full, evict least recently used (first entry)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    // Add new entry at the end (most recently used)
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
    });
  }

  /**
   * Check if key exists in cache (not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      hits: this.hits,
      misses: this.misses,
    };
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }
}

/**
 * Global cache instance
 * Default: 100 entries, 5 minute TTL
 */
export const globalCache = new ResultCache(100, 300000);
