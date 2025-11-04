/**
 * Project Scanner Types
 *
 * Type definitions for multi-file scanning infrastructure with parallel parsing.
 *
 * @module scanner/types
 */
import type { Tree } from 'tree-sitter';
/**
 * AST tree with file metadata for project-wide scanning.
 *
 * Extends tree-sitter Tree with file path and parsing metrics.
 */
export interface ASTWithMetadata {
    /** Tree-sitter AST */
    tree: Tree;
    /** Absolute file path */
    filePath: string;
    /** File size in bytes */
    sizeBytes: number;
    /** Parse duration in milliseconds */
    parseDurationMs: number;
    /** File modification time (Unix timestamp) */
    mtime: number;
}
/**
 * Collection of AST trees from project scanning.
 *
 * Result of ProjectScanner.scanProject() operation.
 */
export type ASTForest = ASTWithMetadata[];
/**
 * Scanning mode configuration.
 */
export type ScanMode = 'full' | 'incremental';
/**
 * Scanning statistics for observability.
 */
export interface ScanStats {
    /** Total files discovered */
    filesDiscovered: number;
    /** Files parsed (may be less than discovered in incremental mode) */
    filesParsed: number;
    /** Files skipped due to cache hit */
    filesSkipped: number;
    /** Total scanning duration in milliseconds */
    durationMs: number;
    /** Peak memory usage in bytes */
    peakMemoryBytes: number;
    /** Worker count used for parallel parsing */
    workerCount: number;
}
/**
 * Cache metadata for incremental scanning.
 */
export interface CacheMetadata {
    /** File path */
    filePath: string;
    /** File modification time when cached */
    mtime: number;
    /** Schema version for cache invalidation */
    version: string;
    /** Cached AST (serialized) */
    ast?: string;
}
/**
 * Worker thread payload for parallel parsing.
 */
export interface WorkerPayload {
    /** Chunk of file paths to parse */
    files: string[];
    /** Worker ID for debugging */
    workerId: number;
}
/**
 * Worker thread result from parallel parsing.
 */
export interface WorkerResult {
    /** Parsed AST trees with metadata */
    trees: ASTWithMetadata[];
    /** Worker ID for debugging */
    workerId: number;
    /** Parse errors (non-fatal) */
    errors: Array<{
        filePath: string;
        error: string;
    }>;
}
//# sourceMappingURL=types.d.ts.map