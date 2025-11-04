/**
 * Project Scanner
 *
 * Multi-file scanning infrastructure with parallel parsing and intelligent caching.
 *
 * Performance targets:
 * - 500 files in <5s (with parallel parsing)
 * - Memory usage <100MB
 * - 100% file discovery recall
 *
 * Architecture:
 * - Serial mode: Single-threaded parsing (fallback)
 * - Parallel mode: Worker thread pool (8 workers on 8-core CPU)
 * - Incremental mode: Cache-aware parsing (skip unchanged files)
 *
 * @module scanner/project_scanner
 */
import { EventEmitter } from 'events';
import { TreeSitterBridge } from '../parsers/tree_sitter_bridge.js';
import { GraphCacheManager } from './cache_manager.js';
import type { ASTForest, ScanMode, ScanStats } from './types.js';
/**
 * Scans Godot projects for GDScript files and parses ASTs in parallel.
 *
 * @fires project:scan_started - Emitted when scanning begins
 * @fires project:scan_completed - Emitted when scanning completes successfully
 * @fires project:scan_failed - Emitted when scanning fails
 * @fires project:scan_progress - Emitted periodically during scanning
 *
 * @example
 * ```typescript
 * const scanner = new ProjectScanner();
 *
 * scanner.on('project:scan_progress', ({ filesProcessed, totalFiles }) => {
 *   console.log(`Progress: ${filesProcessed}/${totalFiles}`);
 * });
 *
 * const astForest = await scanner.scanProject('/path/to/godot/project', 'full');
 * console.log(`Parsed ${astForest.length} files`);
 * ```
 */
export declare class ProjectScanner extends EventEmitter {
    private bridge;
    private cacheManager;
    private stats;
    constructor(bridge?: TreeSitterBridge, cacheManager?: GraphCacheManager);
    /**
     * Scan Godot project for GDScript files and parse ASTs.
     *
     * @param {string} projectPath - Absolute path to Godot project root
     * @param {ScanMode} mode - Scan mode ('full' or 'incremental')
     * @returns {Promise<ASTForest>} Array of parsed AST trees with metadata
     *
     * @throws {Error} If projectPath doesn't exist or parsing fails critically
     *
     * @example
     * ```typescript
     * // Full scan (parse all files)
     * const trees = await scanner.scanProject('/path/to/project', 'full');
     *
     * // Incremental scan (skip cached files)
     * const trees = await scanner.scanProject('/path/to/project', 'incremental');
     * ```
     */
    scanProject(projectPath: string, mode?: ScanMode): Promise<ASTForest>;
    /**
     * Recursively find all .gd files in project directory.
     *
     * Excludes:
     * - .godot/ (Godot build cache)
     * - node_modules/
     * - .git/
     * - Hidden directories (starting with .)
     *
     * @param {string} dir - Directory to search
     * @returns {Promise<string[]>} Array of absolute file paths
     */
    private findGDScriptFiles;
    /**
     * Filter files to only those requiring re-parsing (cache miss or stale).
     *
     * @param {string[]} files - All discovered files
     * @returns {Promise<string[]>} Files requiring parsing
     */
    private filterStaleFiles;
    /**
     * Parse files using parallel workers or serial fallback.
     *
     * Worker count determination:
     * - <8 files: Serial mode (overhead not worth it)
     * - 8-64 files: min(4, cpuCount) workers
     * - >64 files: min(8, cpuCount) workers
     *
     * @param {string[]} files - Files to parse
     * @returns {Promise<ASTForest>} Parsed AST trees
     */
    private parseFiles;
    /**
     * Parse files serially (single-threaded).
     *
     * Used for small file counts where worker overhead > speedup benefit.
     *
     * @param {string[]} files - Files to parse
     * @returns {Promise<ASTForest>} Parsed AST trees
     */
    private parseSerial;
    /**
     * Parse files in parallel using worker threads.
     *
     * @param {string[]} files - Files to parse
     * @param {number} workerCount - Number of workers to spawn
     * @returns {Promise<ASTForest>} Parsed AST trees
     */
    private parseParallel;
    /**
     * Spawn a worker thread to parse a chunk of files.
     *
     * @param {string[]} files - Files for this worker to parse
     * @param {number} workerId - Worker identifier
     * @returns {Promise<WorkerResult>} Worker parse results
     */
    private spawnWorker;
    /**
     * Chunk array into N roughly equal-sized chunks.
     *
     * @param {T[]} array - Array to chunk
     * @param {number} chunkCount - Number of chunks
     * @returns {T[][]} Array of chunks
     */
    private chunkArray;
    /**
     * Initialize scan statistics.
     */
    private initializeStats;
    /**
     * Get last scan statistics.
     *
     * @returns {ScanStats} Statistics from most recent scan
     */
    getStats(): ScanStats;
    /**
     * Get cache manager instance (for testing/debugging).
     */
    getCacheManager(): GraphCacheManager;
}
//# sourceMappingURL=project_scanner.d.ts.map