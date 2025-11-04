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

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { logger } from '../logger.js';

/**
 * File-level cache entry
 */
export interface FileCacheEntry {
  fileHash: string;
  filePath: string; // Relative path for debugging
  ruleId: string;
  ruleVersion: string;
  result: any; // Rule check result
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
  filesUnchanged: number; // Files with same hash
  hitRate: number;
  unchangedRate: number;
}

/**
 * File Hash Cache Manager
 * 
 * Optimized for incremental analysis scenarios (CI/CD, watch mode)
 */
export class FileHashCache {
  private cache: Map<string, FileCacheEntry> = new Map();
  private fileHashes: Map<string, string> = new Map(); // filePath -> hash
  private stats: FileCacheStats = {
    hits: 0,
    misses: 0,
    filesChecked: 0,
    filesUnchanged: 0,
    hitRate: 0,
    unchangedRate: 0,
  };
  
  private cacheDirPath: string;
  private cacheFilePath: string;
  private enabled: boolean = true;
  
  /**
   * Rule versions for cache invalidation
   * Increment version when rule logic changes
   */
  private static readonly RULE_VERSIONS: Record<string, string> = {
    CTS_FILE_SIZE: '1.1.0', // Updated to use config
    CTS_HOP_SIZE: '1.0.0',
    CTS_SIGNAL_FIRST: '1.0.0',
    CTS_TEMPLATES: '1.0.0',
    CTS_TYPE_HINTS: '1.0.0',
    CTS_ERROR_HANDLING: '1.0.0',
    CTS_COMPLEXITY: '1.0.0',
    CTS_NAMING: '1.0.0',
    CTS_STRUCTURE: '1.0.0',
    CTS_DEPENDENCIES: '1.0.0',
  };
  
  constructor(projectPath: string, options: { enabled?: boolean } = {}) {
    this.enabled = options.enabled ?? true;
    this.cacheDirPath = join(projectPath, '.cts_cache');
    this.cacheFilePath = join(this.cacheDirPath, 'file_results.json');
    
    if (this.enabled) {
      this.loadCache();
    }
  }
  
  /**
   * Compute SHA256 hash of file content
   * Fast path: Use cached hash if file mtime hasn't changed
   */
  private hashFile(filePath: string): string {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const hash = createHash('sha256').update(content).digest('hex');
      
      // Store hash for this file
      this.fileHashes.set(filePath, hash);
      
      return hash;
    } catch (error) {
      logger.warn(`Failed to hash file ${filePath}`, { error });
      return '';
    }
  }
  
  /**
   * Generate cache key for file + rule
   */
  private getCacheKey(fileHash: string, ruleId: string): string {
    const ruleVersion = FileHashCache.RULE_VERSIONS[ruleId] || '1.0.0';
    return `${fileHash}:${ruleId}:${ruleVersion}`;
  }
  
  /**
   * Check if file content has changed
   */
  hasFileChanged(filePath: string): boolean {
    const currentHash = this.hashFile(filePath);
    if (!currentHash) return true;
    
    const previousHash = this.fileHashes.get(filePath);
    return previousHash !== currentHash;
  }
  
  /**
   * Get cached result for file + rule
   */
  get(filePath: string, ruleId: string): any | null {
    if (!this.enabled) return null;
    
    this.stats.filesChecked++;
    
    const fileHash = this.hashFile(filePath);
    if (!fileHash) {
      this.stats.misses++;
      return null;
    }
    
    // Check if file is unchanged
    const previousHash = this.fileHashes.get(filePath);
    if (previousHash && previousHash === fileHash) {
      this.stats.filesUnchanged++;
    }
    
    const key = this.getCacheKey(fileHash, ruleId);
    const entry = this.cache.get(key);
    
    if (entry) {
      this.stats.hits++;
      logger.debug(`Cache HIT: ${filePath} (${ruleId})`);
      return entry.result;
    }
    
    this.stats.misses++;
    logger.debug(`Cache MISS: ${filePath} (${ruleId})`);
    return null;
  }
  
  /**
   * Store result in cache
   */
  set(filePath: string, ruleId: string, result: any): void {
    if (!this.enabled) return;
    
    const fileHash = this.hashFile(filePath);
    if (!fileHash) return;
    
    const ruleVersion = FileHashCache.RULE_VERSIONS[ruleId] || '1.0.0';
    const key = this.getCacheKey(fileHash, ruleId);
    
    let fileSize = 0;
    try {
      fileSize = statSync(filePath).size;
    } catch (error) {
      // Ignore stat errors
    }
    
    const entry: FileCacheEntry = {
      fileHash,
      filePath,
      ruleId,
      ruleVersion,
      result,
      timestamp: Date.now(),
      fileSize,
    };
    
    this.cache.set(key, entry);
    logger.debug(`Cache SET: ${filePath} (${ruleId})`);
  }
  
  /**
   * Invalidate all cached results for a file
   */
  invalidateFile(filePath: string): number {
    if (!this.enabled) return 0;
    
    const fileHash = this.fileHashes.get(filePath);
    if (!fileHash) return 0;
    
    let invalidated = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.filePath === filePath || entry.fileHash === fileHash) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    // Remove from file hashes
    this.fileHashes.delete(filePath);
    
    if (invalidated > 0) {
      logger.debug(`Invalidated ${invalidated} entries for ${filePath}`);
    }
    
    return invalidated;
  }
  
  /**
   * Invalidate all cached results for a rule
   * Use this when rule logic changes
   */
  invalidateRule(ruleId: string): number {
    if (!this.enabled) return 0;
    
    let invalidated = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.ruleId === ruleId) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    if (invalidated > 0) {
      logger.info(`Invalidated ${invalidated} entries for rule ${ruleId}`);
    }
    
    return invalidated;
  }
  
  /**
   * Clear entire cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.fileHashes.clear();
    this.resetStats();
    logger.info(`Cleared file hash cache (${size} entries)`);
  }
  
  /**
   * Get cache statistics
   */
  getStats(): FileCacheStats {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    this.stats.unchangedRate = this.stats.filesChecked > 0 
      ? this.stats.filesUnchanged / this.stats.filesChecked 
      : 0;
    return { ...this.stats };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      filesChecked: 0,
      filesUnchanged: 0,
      hitRate: 0,
      unchangedRate: 0,
    };
  }
  
  /**
   * Load cache from disk
   */
  private loadCache(): void {
    try {
      if (!existsSync(this.cacheFilePath)) {
        logger.debug('No file cache found, starting fresh');
        return;
      }
      
      const data = readFileSync(this.cacheFilePath, 'utf-8');
      const entries = JSON.parse(data) as FileCacheEntry[];
      
      for (const entry of entries) {
        const key = this.getCacheKey(entry.fileHash, entry.ruleId);
        this.cache.set(key, entry);
        
        // Rebuild file hashes map
        if (!this.fileHashes.has(entry.filePath)) {
          this.fileHashes.set(entry.filePath, entry.fileHash);
        }
      }
      
      logger.info(`Loaded ${this.cache.size} file cache entries from disk`);
    } catch (error) {
      logger.warn('Failed to load file cache from disk', { error });
    }
  }
  
  /**
   * Save cache to disk
   */
  saveCache(): void {
    if (!this.enabled) return;
    
    try {
      // Ensure cache directory exists
      if (!existsSync(this.cacheDirPath)) {
        mkdirSync(this.cacheDirPath, { recursive: true });
      }
      
      // Convert Map to array
      const entries = Array.from(this.cache.values());
      
      // Write to disk with compression hints
      const json = JSON.stringify(entries, null, 0); // No pretty-print for smaller size
      writeFileSync(this.cacheFilePath, json);
      
      logger.info(`Saved ${entries.length} file cache entries (${(json.length / 1024).toFixed(1)}KB)`);
    } catch (error) {
      logger.error('Failed to save file cache to disk', error as Error);
    }
  }
  
  /**
   * Prune old cache entries
   * Remove entries older than maxAge
   */
  prune(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    if (!this.enabled) return 0;
    
    const now = Date.now();
    let pruned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
        pruned++;
      }
    }
    
    if (pruned > 0) {
      logger.info(`Pruned ${pruned} old file cache entries`);
    }
    
    return pruned;
  }
  
  /**
   * Get cache size info
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Check if cache is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Enable cache
   */
  enable(): void {
    this.enabled = true;
    this.loadCache();
  }
  
  /**
   * Disable cache
   */
  disable(): void {
    this.enabled = false;
    this.clear();
  }
  
  /**
   * Get estimated performance improvement
   * Based on cache hit rate and file unchanged rate
   */
  getPerformanceMetrics(): {
    hitRate: number;
    unchangedRate: number;
    estimatedSpeedup: number;
  } {
    const stats = this.getStats();
    
    // Estimate speedup: if 90% hit rate, ~10x faster
    // Formula: 1 / (1 - hitRate)
    const estimatedSpeedup = stats.hitRate > 0 
      ? 1 / (1 - stats.hitRate) 
      : 1;
    
    return {
      hitRate: stats.hitRate,
      unchangedRate: stats.unchangedRate,
      estimatedSpeedup: Math.min(estimatedSpeedup, 100), // Cap at 100x
    };
  }
}

/**
 * Global cache instances per project
 */
const cacheInstances = new Map<string, FileHashCache>();

/**
 * Get or create file hash cache for a project
 */
export function getFileHashCache(
  projectPath: string,
  options: { enabled?: boolean } = {}
): FileHashCache {
  const normalizedPath = projectPath.toLowerCase();
  
  if (!cacheInstances.has(normalizedPath)) {
    cacheInstances.set(normalizedPath, new FileHashCache(projectPath, options));
  }
  
  return cacheInstances.get(normalizedPath)!;
}

/**
 * Save all file hash caches
 */
export function saveAllFileHashCaches(): void {
  for (const cache of cacheInstances.values()) {
    cache.saveCache();
  }
}

/**
 * Clear all file hash caches
 */
export function clearAllFileHashCaches(): void {
  for (const cache of cacheInstances.values()) {
    cache.clear();
  }
  cacheInstances.clear();
}
