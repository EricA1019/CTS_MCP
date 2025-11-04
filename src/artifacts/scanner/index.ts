/**
 * Project Scanner Module
 * 
 * Multi-file scanning infrastructure for Godot projects with parallel parsing.
 * 
 * @module scanner
 */

export { ProjectScanner } from './project_scanner.js';
export { GraphCacheManager } from './cache_manager.js';
export type {
  ASTForest,
  ASTWithMetadata,
  ScanMode,
  ScanStats,
  CacheMetadata,
  WorkerPayload,
  WorkerResult,
} from './types.js';
