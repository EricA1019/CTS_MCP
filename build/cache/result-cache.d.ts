/**
 * Result Cache - LRU Cache with SHA-256 Hashing
 *
 * Tier 2C.5: Result Caching
 * - LRU (Least Recently Used) eviction policy
 * - SHA-256 hash-based cache keys
 * - Configurable size and TTL
 * - Performance: <2ms operations (P99)
 */
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
export declare class ResultCache<T = any> {
    private cache;
    private readonly maxSize;
    private readonly ttlMs;
    private hits;
    private misses;
    constructor(maxSize?: number, ttlMs?: number);
    /**
     * Generate cache key using SHA-256 hash
     * Format: tool:{toolName}:{sha256}
     */
    generateKey(toolName: string, args: any): string;
    /**
     * Get value from cache
     * Returns undefined if key doesn't exist or entry is expired
     */
    get(key: string): T | undefined;
    /**
     * Set value in cache
     * Implements LRU eviction when cache is full
     */
    set(key: string, value: T): void;
    /**
     * Check if key exists in cache (not expired)
     */
    has(key: string): boolean;
    /**
     * Delete specific key from cache
     */
    delete(key: string): boolean;
    /**
     * Clear all entries from cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get current cache size
     */
    get size(): number;
}
/**
 * Global cache instance
 * Default: 100 entries, 5 minute TTL
 */
export declare const globalCache: ResultCache<any>;
//# sourceMappingURL=result-cache.d.ts.map