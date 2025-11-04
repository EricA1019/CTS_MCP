/**
 * File Hash-Based Cache for Incremental Analysis
 *
 * Implements file-level caching using SHA256 hashes.
 * Designed for incremental analysis where most files are unchanged between runs.
 *
 * Cache Strategy:
 * - Key: SHA256(file content) + rule ID + rule version
 * - Value: Rule check result
 * - Invalidation: File content changes or rule version bumps
 * - Persistence: .cts_cache/file_results.json
 *
 * Performance Target: <500ms for 100-file project with 90% cache hit rate
 */
/**
 * File-level cache entry
 */
export interface FileCacheEntry {
    fileHash: string;
    filePath: string;
    ruleId: string;
    ruleVersion: string;
    result: any;
    timestamp: number;
    fileSize: number;
}
/**
 * Cache statistics for incremental analysis
 */
export interface FileCacheStats {
    hits: number;
    misses: number;
    filesChecked: number;
    filesUnchanged: number;
    hitRate: number;
    unchangedRate: number;
}
/**
 * File Hash Cache Manager
 *
 * Optimized for incremental analysis scenarios (CI/CD, watch mode)
 */
export declare class FileHashCache {
    private cache;
    private fileHashes;
    private stats;
    private cacheDirPath;
    private cacheFilePath;
    private enabled;
    /**
     * Rule versions for cache invalidation
     * Increment version when rule logic changes
     */
    private static readonly RULE_VERSIONS;
    constructor(projectPath: string, options?: {
        enabled?: boolean;
    });
    /**
     * Compute SHA256 hash of file content
     * Fast path: Use cached hash if file mtime hasn't changed
     */
    private hashFile;
    /**
     * Generate cache key for file + rule
     */
    private getCacheKey;
    /**
     * Check if file content has changed
     */
    hasFileChanged(filePath: string): boolean;
    /**
     * Get cached result for file + rule
     */
    get(filePath: string, ruleId: string): any | null;
    /**
     * Store result in cache
     */
    set(filePath: string, ruleId: string, result: any): void;
    /**
     * Invalidate all cached results for a file
     */
    invalidateFile(filePath: string): number;
    /**
     * Invalidate all cached results for a rule
     * Use this when rule logic changes
     */
    invalidateRule(ruleId: string): number;
    /**
     * Clear entire cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): FileCacheStats;
    /**
     * Reset statistics
     */
    resetStats(): void;
    /**
     * Load cache from disk
     */
    private loadCache;
    /**
     * Save cache to disk
     */
    saveCache(): void;
    /**
     * Prune old cache entries
     * Remove entries older than maxAge
     */
    prune(maxAge?: number): number;
    /**
     * Get cache size info
     */
    size(): number;
    /**
     * Check if cache is enabled
     */
    isEnabled(): boolean;
    /**
     * Enable cache
     */
    enable(): void;
    /**
     * Disable cache
     */
    disable(): void;
    /**
     * Get estimated performance improvement
     * Based on cache hit rate and file unchanged rate
     */
    getPerformanceMetrics(): {
        hitRate: number;
        unchangedRate: number;
        estimatedSpeedup: number;
    };
}
/**
 * Get or create file hash cache for a project
 */
export declare function getFileHashCache(projectPath: string, options?: {
    enabled?: boolean;
}): FileHashCache;
/**
 * Save all file hash caches
 */
export declare function saveAllFileHashCaches(): void;
/**
 * Clear all file hash caches
 */
export declare function clearAllFileHashCaches(): void;
//# sourceMappingURL=file_hash_cache.d.ts.map