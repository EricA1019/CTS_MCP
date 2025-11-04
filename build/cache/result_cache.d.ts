/**
 * Result Caching System for CTS MCP Tools
 *
 * Provides a generic LRU cache for expensive tool operations
 * with TTL support and cache statistics tracking.
 */
/**
 * Cache statistics
 */
export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    hitRate: number;
    totalEntries: number;
    totalSize: number;
    maxSize: number;
}
/**
 * Cache configuration
 */
export interface CacheConfig {
    maxEntries?: number;
    maxSize?: number;
    ttl?: number;
    enableStats?: boolean;
}
/**
 * LRU Cache with TTL support
 */
export declare class ResultCache<T = any> {
    private cache;
    private accessOrder;
    private stats;
    private maxEntries;
    private maxSize;
    private ttl;
    private enableStats;
    private currentSize;
    constructor(config?: CacheConfig);
    /**
     * Generate cache key from parameters
     */
    private generateKey;
    /**
     * Estimate size of data in bytes
     */
    private estimateSize;
    /**
     * Remove least recently used entry
     */
    private evictLRU;
    /**
     * Check if entry is expired
     */
    private isExpired;
    /**
     * Update access order for LRU
     */
    private updateAccessOrder;
    /**
     * Get cached result
     */
    get(toolName: string, params: any): T | undefined;
    /**
     * Set cached result
     */
    set(toolName: string, params: any, data: T): void;
    /**
     * Check if result is cached
     */
    has(toolName: string, params: any): boolean;
    /**
     * Clear specific tool's cache
     */
    clearTool(toolName: string): number;
    /**
     * Clear all cached results
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Cleanup expired entries
     */
    cleanup(): number;
}
/**
 * Global cache instance for CTS tools
 */
export declare const globalCache: ResultCache<any>;
/**
 * Cache decorator for tool functions
 */
export declare function cached<T>(toolName: string, cache?: ResultCache<T>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=result_cache.d.ts.map