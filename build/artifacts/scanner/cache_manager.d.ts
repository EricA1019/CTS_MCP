/**
 * Graph Cache Manager
 *
 * Intelligent cache invalidation for incremental project scanning.
 * Uses file modification times and schema versioning to determine staleness.
 *
 * @module scanner/cache_manager
 */
import { ArtifactVersionRegistry } from '../artifact_metadata.js';
/**
 * Manages cache invalidation for parsed AST trees.
 *
 * Integrates with Phase 2 ArtifactVersionRegistry for schema versioning.
 *
 * @example
 * ```typescript
 * const cacheManager = new GraphCacheManager();
 *
 * if (cacheManager.isStale('path/to/file.gd')) {
 *   // Re-parse file
 *   const tree = await bridge.parseFile('path/to/file.gd');
 *   cacheManager.updateCache('path/to/file.gd', tree);
 * } else {
 *   // Use cached AST
 *   const tree = cacheManager.getCachedAST('path/to/file.gd');
 * }
 * ```
 */
export declare class GraphCacheManager {
    private cache;
    private versionRegistry;
    private readonly CACHE_VERSION;
    constructor(versionRegistry?: ArtifactVersionRegistry);
    /**
     * Check if cached AST is stale and needs re-parsing.
     *
     * Staleness criteria:
     * 1. File doesn't exist in cache
     * 2. File modification time is newer than cached mtime
     * 3. Schema version mismatch (cache invalidation after upgrade)
     *
     * @param {string} filePath - Absolute file path to check
     * @returns {Promise<boolean>} True if file needs re-parsing
     *
     * @example
     * ```typescript
     * if (await cacheManager.isStale('/path/to/script.gd')) {
     *   // Re-parse required
     * }
     * ```
     */
    isStale(filePath: string): Promise<boolean>;
    /**
     * Update cache with fresh AST data.
     *
     * @param {string} filePath - Absolute file path
     * @param {number} mtime - File modification time (Unix timestamp)
     * @param {string} [ast] - Optional serialized AST (for future persistence)
     *
     * @example
     * ```typescript
     * const stats = statSync(filePath);
     * cacheManager.updateCache(filePath, stats.mtimeMs);
     * ```
     */
    updateCache(filePath: string, mtime: number, ast?: string): void;
    /**
     * Get all cached file paths (for debugging/stats).
     *
     * @returns {string[]} Array of cached file paths
     */
    getCachedFiles(): string[];
    /**
     * Get cache size (number of entries).
     *
     * @returns {number} Number of cached files
     */
    getCacheSize(): number;
    /**
     * Clear all cache entries.
     *
     * Use when upgrading schema version or forcing full re-scan.
     */
    clearCache(): void;
    /**
     * Remove specific file from cache.
     *
     * @param {string} filePath - File to evict from cache
     */
    evict(filePath: string): void;
}
//# sourceMappingURL=cache_manager.d.ts.map