/**
 * Graph Cache Manager
 *
 * Intelligent cache invalidation for incremental project scanning.
 * Uses file modification times and schema versioning to determine staleness.
 *
 * @module scanner/cache_manager
 */
import { statSync, existsSync } from 'fs';
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
export class GraphCacheManager {
    cache = new Map();
    versionRegistry;
    CACHE_VERSION = '3.0.0'; // Phase 3 schema version
    constructor(versionRegistry) {
        this.versionRegistry = versionRegistry ?? new ArtifactVersionRegistry();
        this.versionRegistry.registerVersion('ast_forest', this.CACHE_VERSION);
    }
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
    async isStale(filePath) {
        const cached = this.cache.get(filePath);
        // Cache miss
        if (!cached) {
            return true;
        }
        // Schema version mismatch
        if (cached.version !== this.CACHE_VERSION) {
            return true;
        }
        // File modification check
        if (!existsSync(filePath)) {
            // File deleted - stale
            this.cache.delete(filePath);
            return true;
        }
        try {
            const stats = statSync(filePath);
            const currentMtime = Math.floor(stats.mtimeMs);
            if (currentMtime > cached.mtime) {
                // File modified since caching
                return true;
            }
            return false; // Fresh cache
        }
        catch (error) {
            // Stat error - assume stale
            console.warn(`Failed to stat file ${filePath}: ${error}`);
            return true;
        }
    }
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
    updateCache(filePath, mtime, ast) {
        this.cache.set(filePath, {
            filePath,
            mtime: Math.floor(mtime),
            version: this.CACHE_VERSION,
            ast,
        });
    }
    /**
     * Get all cached file paths (for debugging/stats).
     *
     * @returns {string[]} Array of cached file paths
     */
    getCachedFiles() {
        return Array.from(this.cache.keys());
    }
    /**
     * Get cache size (number of entries).
     *
     * @returns {number} Number of cached files
     */
    getCacheSize() {
        return this.cache.size;
    }
    /**
     * Clear all cache entries.
     *
     * Use when upgrading schema version or forcing full re-scan.
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Remove specific file from cache.
     *
     * @param {string} filePath - File to evict from cache
     */
    evict(filePath) {
        this.cache.delete(filePath);
    }
}
//# sourceMappingURL=cache_manager.js.map