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

import { Worker } from 'worker_threads';
import { readdirSync, statSync } from 'fs';
import { join, resolve, extname, dirname } from 'path';
import { cpus } from 'os';
import { EventEmitter } from 'events';
import { TreeSitterBridge } from '../parsers/tree_sitter_bridge.js';
import { GraphCacheManager } from './cache_manager.js';
import type {
  ASTForest,
  ASTWithMetadata,
  ScanMode,
  ScanStats,
  WorkerPayload,
  WorkerResult,
} from './types.js';

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
export class ProjectScanner extends EventEmitter {
  private bridge: TreeSitterBridge;
  private cacheManager: GraphCacheManager;
  private stats: ScanStats;

  constructor(bridge?: TreeSitterBridge, cacheManager?: GraphCacheManager) {
    super();
    this.bridge = bridge ?? new TreeSitterBridge();
    this.cacheManager = cacheManager ?? new GraphCacheManager();
    this.stats = this.initializeStats();
  }

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
  async scanProject(projectPath: string, mode: ScanMode = 'full'): Promise<ASTForest> {
    const startTime = Date.now();
    this.stats = this.initializeStats();

    // Resolve to absolute path
    const absPath = resolve(projectPath);

    this.emit('project:scan_started', {
      projectPath: absPath,
      mode,
      timestamp: Date.now(),
    });

    try {
      // Initialize tree-sitter if not already done
      await this.bridge.init();

      // Step 1: Discover all .gd files
      const files = await this.findGDScriptFiles(absPath);
      this.stats.filesDiscovered = files.length;

      if (files.length === 0) {
        this.emit('project:scan_completed', {
          ...this.stats,
          durationMs: Date.now() - startTime,
        });
        return [];
      }

      // Step 2: Filter files based on cache (incremental mode)
      let filesToParse = files;
      if (mode === 'incremental') {
        filesToParse = await this.filterStaleFiles(files);
        this.stats.filesSkipped = files.length - filesToParse.length;
      }

      this.stats.filesParsed = filesToParse.length;

      // Step 3: Parse files (parallel or serial)
      const trees = await this.parseFiles(filesToParse);

      // Step 4: Update cache
      if (mode === 'incremental') {
        for (const treeData of trees) {
          this.cacheManager.updateCache(treeData.filePath, treeData.mtime);
        }
      }

      this.stats.durationMs = Date.now() - startTime;
      this.stats.peakMemoryBytes = process.memoryUsage().heapUsed;

      this.emit('project:scan_completed', {
        ...this.stats,
        treeCount: trees.length,
        timestamp: Date.now(),
      });

      return trees;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.emit('project:scan_failed', {
        projectPath: absPath,
        mode,
        error: errorMsg,
        timestamp: Date.now(),
      });

      throw new Error(`Project scan failed: ${errorMsg}`);
    }
  }

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
  private async findGDScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip excluded directories
        if (entry.isDirectory()) {
          const skipDirs = ['.godot', 'node_modules', '.git', 'build', 'dist'];
          if (entry.name.startsWith('.') || skipDirs.includes(entry.name)) {
            continue;
          }

          // Recurse into subdirectory
          const subFiles = await this.findGDScriptFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && extname(entry.name) === '.gd') {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dir}: ${error}`);
    }

    return files;
  }

  /**
   * Filter files to only those requiring re-parsing (cache miss or stale).
   * 
   * @param {string[]} files - All discovered files
   * @returns {Promise<string[]>} Files requiring parsing
   */
  private async filterStaleFiles(files: string[]): Promise<string[]> {
    const staleFiles: string[] = [];

    for (const file of files) {
      const isStale = await this.cacheManager.isStale(file);
      if (isStale) {
        staleFiles.push(file);
      }
    }

    return staleFiles;
  }

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
  private async parseFiles(files: string[]): Promise<ASTForest> {
    if (files.length === 0) {
      return [];
    }

    // TEMPORARILY: Force serial mode due to Worker thread ES module issues
    // TODO: Fix Worker thread CommonJS/ES module compatibility
    this.stats.workerCount = 0;
    return this.parseSerial(files);

    /* Parallel parsing disabled until Worker ES module issues are resolved
    // Determine worker count
    const cpuCount = cpus().length;
    let workerCount = 0;

    if (files.length < 8) {
      workerCount = 0; // Serial mode
    } else if (files.length < 64) {
      workerCount = Math.min(4, cpuCount);
    } else {
      workerCount = Math.min(8, cpuCount);
    }

    this.stats.workerCount = workerCount;

    if (workerCount === 0) {
      return this.parseSerial(files);
    } else {
      return this.parseParallel(files, workerCount);
    }
    */
  }

  /**
   * Parse files serially (single-threaded).
   * 
   * Used for small file counts where worker overhead > speedup benefit.
   * 
   * @param {string[]} files - Files to parse
   * @returns {Promise<ASTForest>} Parsed AST trees
   */
  private async parseSerial(files: string[]): Promise<ASTForest> {
    const trees: ASTWithMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];

      try {
        const startTime = Date.now();
        const tree = await this.bridge.parseFile(filePath);
        const parseDuration = Date.now() - startTime;

        const stats = statSync(filePath);

        trees.push({
          tree,
          filePath,
          sizeBytes: stats.size,
          parseDurationMs: parseDuration,
          mtime: Math.floor(stats.mtimeMs),
        });

        // Emit progress every 10 files
        if ((i + 1) % 10 === 0) {
          this.emit('project:scan_progress', {
            filesProcessed: i + 1,
            totalFiles: files.length,
          });
        }
      } catch (error) {
        console.warn(`Failed to parse ${filePath}: ${error}`);
      }
    }

    return trees;
  }

  /**
   * Parse files in parallel using worker threads.
   * 
   * @param {string[]} files - Files to parse
   * @param {number} workerCount - Number of workers to spawn
   * @returns {Promise<ASTForest>} Parsed AST trees
   */
  private async parseParallel(files: string[], workerCount: number): Promise<ASTForest> {
    // Split files into chunks
    const chunks = this.chunkArray(files, workerCount);

    // Spawn workers
    const workerPromises = chunks.map((chunk, workerId) => {
      return this.spawnWorker(chunk, workerId);
    });

    // Wait for all workers to complete
    const results = await Promise.all(workerPromises);

    // Flatten results
    const trees: ASTWithMetadata[] = [];
    const errors: Array<{ filePath: string; error: string }> = [];

    for (const result of results) {
      trees.push(...result.trees);
      errors.push(...result.errors);
    }

    // Log errors (non-fatal)
    if (errors.length > 0) {
      console.warn(`Encountered ${errors.length} parse errors:`);
      for (const { filePath, error } of errors.slice(0, 10)) {
        console.warn(`  ${filePath}: ${error}`);
      }
      if (errors.length > 10) {
        console.warn(`  ... and ${errors.length - 10} more errors`);
      }
    }

    return trees;
  }

  /**
   * Spawn a worker thread to parse a chunk of files.
   * 
   * @param {string[]} files - Files for this worker to parse
   * @param {number} workerId - Worker identifier
   * @returns {Promise<WorkerResult>} Worker parse results
   */
  private async spawnWorker(files: string[], workerId: number): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      // Use dynamic path resolution for worker script
      // In production (build/), use .js; in tests, use .ts
      const workerPath = process.env.NODE_ENV === 'test'
        ? join(process.cwd(), 'src/artifacts/scanner/parse_worker.ts')
        : join(dirname(require.resolve('./cache_manager.js')), 'parse_worker.js');

      const payload: WorkerPayload = {
        files,
        workerId,
      };

      const worker = new Worker(workerPath, {
        workerData: payload,
      });

      worker.on('message', (result: WorkerResult) => {
        resolve(result);
      });

      worker.on('error', (error) => {
        reject(new Error(`Worker ${workerId} error: ${error.message}`));
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker ${workerId} exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Chunk array into N roughly equal-sized chunks.
   * 
   * @param {T[]} array - Array to chunk
   * @param {number} chunkCount - Number of chunks
   * @returns {T[][]} Array of chunks
   */
  private chunkArray<T>(array: T[], chunkCount: number): T[][] {
    const chunks: T[][] = [];
    const chunkSize = Math.ceil(array.length / chunkCount);

    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, array.length);
      const chunk = array.slice(start, end);

      if (chunk.length > 0) {
        chunks.push(chunk);
      }
    }

    return chunks;
  }

  /**
   * Initialize scan statistics.
   */
  private initializeStats(): ScanStats {
    return {
      filesDiscovered: 0,
      filesParsed: 0,
      filesSkipped: 0,
      durationMs: 0,
      peakMemoryBytes: 0,
      workerCount: 0,
    };
  }

  /**
   * Get last scan statistics.
   * 
   * @returns {ScanStats} Statistics from most recent scan
   */
  getStats(): ScanStats {
    return { ...this.stats };
  }

  /**
   * Get cache manager instance (for testing/debugging).
   */
  getCacheManager(): GraphCacheManager {
    return this.cacheManager;
  }
}
