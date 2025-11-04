/**
 * File Hash Cache Tests
 * 
 * Tests for incremental analysis caching system
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileHashCache, getFileHashCache } from '../cache/file_hash_cache.js';
import { writeFileSync, unlinkSync, mkdirSync, existsSync, rmdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('FileHashCache', () => {
  let testDir: string;
  let cache: FileHashCache;
  let testFile1: string;
  let testFile2: string;
  
  beforeEach(() => {
    // Create temp directory
    testDir = join(tmpdir(), `file-cache-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    
    // Create test files
    testFile1 = join(testDir, 'test1.gd');
    testFile2 = join(testDir, 'test2.gd');
    
    writeFileSync(testFile1, 'extends Node\nfunc test(): pass');
    writeFileSync(testFile2, 'extends Node2D\nfunc test2(): pass');
    
    // Create cache instance
    cache = new FileHashCache(testDir);
  });
  
  afterEach(() => {
    // Clean up
    if (existsSync(testDir)) {
      try {
        const cacheDir = join(testDir, '.cts_cache');
        if (existsSync(cacheDir)) {
          const files = readdirSync(cacheDir);
          for (const file of files) {
            unlinkSync(join(cacheDir, file));
          }
          rmdirSync(cacheDir);
        }
        unlinkSync(testFile1);
        unlinkSync(testFile2);
        rmdirSync(testDir);
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  });
  
  describe('Basic Operations', () => {
    it('should return null for cache miss', () => {
      const result = cache.get(testFile1, 'CTS_FILE_SIZE');
      expect(result).toBeNull();
    });
    
    it('should store and retrieve cached results', () => {
      const ruleResult = { passed: true, violations: [], score: 100 };
      
      cache.set(testFile1, 'CTS_FILE_SIZE', ruleResult);
      const retrieved = cache.get(testFile1, 'CTS_FILE_SIZE');
      
      expect(retrieved).toEqual(ruleResult);
    });
    
    it('should handle multiple files', () => {
      cache.set(testFile1, 'CTS_FILE_SIZE', { passed: true });
      cache.set(testFile2, 'CTS_FILE_SIZE', { passed: false });
      
      expect(cache.get(testFile1, 'CTS_FILE_SIZE')).toEqual({ passed: true });
      expect(cache.get(testFile2, 'CTS_FILE_SIZE')).toEqual({ passed: false });
    });
    
    it('should handle multiple rules per file', () => {
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      cache.set(testFile1, 'CTS_TYPE_HINTS', { score: 80 });
      
      expect(cache.get(testFile1, 'CTS_FILE_SIZE')).toEqual({ score: 100 });
      expect(cache.get(testFile1, 'CTS_TYPE_HINTS')).toEqual({ score: 80 });
    });
  });
  
  describe('Cache Invalidation', () => {
    beforeEach(() => {
      // Set up initial cache
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      cache.set(testFile1, 'CTS_TYPE_HINTS', { score: 90 });
      cache.set(testFile2, 'CTS_FILE_SIZE', { score: 80 });
    });
    
    it('should invalidate cache when file changes', () => {
      // Verify cache hit
      expect(cache.get(testFile1, 'CTS_FILE_SIZE')).toEqual({ score: 100 });
      
      // Modify file
      writeFileSync(testFile1, 'extends Node\nfunc test(): pass\n# New line');
      
      // Cache should miss (different hash)
      const result = cache.get(testFile1, 'CTS_FILE_SIZE');
      expect(result).toBeNull();
    });
    
    it('should invalidate all entries for a file', () => {
      const invalidated = cache.invalidateFile(testFile1);
      
      expect(invalidated).toBe(2); // Two rules cached for testFile1
      expect(cache.get(testFile1, 'CTS_FILE_SIZE')).toBeNull();
      expect(cache.get(testFile1, 'CTS_TYPE_HINTS')).toBeNull();
      
      // testFile2 should still be cached
      expect(cache.get(testFile2, 'CTS_FILE_SIZE')).toEqual({ score: 80 });
    });
    
    it('should invalidate all entries for a rule', () => {
      const invalidated = cache.invalidateRule('CTS_FILE_SIZE');
      
      expect(invalidated).toBe(2); // testFile1 and testFile2
      expect(cache.get(testFile1, 'CTS_FILE_SIZE')).toBeNull();
      expect(cache.get(testFile2, 'CTS_FILE_SIZE')).toBeNull();
      
      // CTS_TYPE_HINTS should still be cached
      expect(cache.get(testFile1, 'CTS_TYPE_HINTS')).toEqual({ score: 90 });
    });
    
    it('should clear all cache', () => {
      cache.clear();
      
      expect(cache.get(testFile1, 'CTS_FILE_SIZE')).toBeNull();
      expect(cache.get(testFile1, 'CTS_TYPE_HINTS')).toBeNull();
      expect(cache.get(testFile2, 'CTS_FILE_SIZE')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });
  
  describe('Statistics', () => {
    it('should track cache hits and misses', () => {
      cache.resetStats();
      
      // Miss
      cache.get(testFile1, 'CTS_FILE_SIZE');
      
      // Set
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      
      // Hit
      cache.get(testFile1, 'CTS_FILE_SIZE');
      cache.get(testFile1, 'CTS_FILE_SIZE');
      
      // Miss
      cache.get(testFile2, 'CTS_FILE_SIZE');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5); // 2/4
    });
    
    it('should track unchanged files', () => {
      cache.resetStats();
      
      // First access - sets hash
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      
      // Second access - same hash (files checked: 1, unchanged: 1)
      cache.get(testFile1, 'CTS_FILE_SIZE');
      
      // Third access - same hash again (files checked: 2, unchanged: 2)
      cache.get(testFile1, 'CTS_FILE_SIZE');
      
      const stats = cache.getStats();
      expect(stats.filesUnchanged).toBe(2); // Both gets saw unchanged hash
      expect(stats.unchangedRate).toBeGreaterThan(0);
    });
    
    it('should calculate performance metrics', () => {
      cache.resetStats();
      
      // Simulate 90% cache hit rate
      for (let i = 0; i < 9; i++) {
        cache.set(testFile1, `RULE_${i}`, { score: 100 });
        cache.get(testFile1, `RULE_${i}`);
      }
      cache.get(testFile1, 'MISS_RULE'); // 1 miss
      
      const perf = cache.getPerformanceMetrics();
      expect(perf.hitRate).toBeCloseTo(0.9, 1);
      expect(perf.estimatedSpeedup).toBeGreaterThan(5); // ~10x with 90% hit rate
    });
  });
  
  describe('Persistence', () => {
    it('should save cache to disk', () => {
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      cache.set(testFile2, 'CTS_TYPE_HINTS', { score: 90 });
      
      cache.saveCache();
      
      const cacheFile = join(testDir, '.cts_cache', 'file_results.json');
      expect(existsSync(cacheFile)).toBe(true);
    });
    
    it('should load cache from disk', () => {
      // Save cache
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      cache.saveCache();
      
      // Create new cache instance (should load from disk)
      const cache2 = new FileHashCache(testDir);
      
      const result = cache2.get(testFile1, 'CTS_FILE_SIZE');
      expect(result).toEqual({ score: 100 });
    });
    
    it('should persist across sessions', () => {
      // Session 1
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      cache.saveCache();
      
      // Session 2
      const cache2 = getFileHashCache(testDir);
      const result = cache2.get(testFile1, 'CTS_FILE_SIZE');
      
      expect(result).toEqual({ score: 100 });
    });
  });
  
  describe('Pruning', () => {
    it('should prune old entries', () => {
      // Add entries
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      
      // Manually set old timestamp on cache entry
      const cacheMap = (cache as any).cache as Map<string, any>;
      const entries = Array.from(cacheMap.values());
      if (entries.length > 0) {
        entries[0].timestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days old
      }
      
      const pruned = cache.prune(7 * 24 * 60 * 60 * 1000); // 7 day max age
      
      expect(pruned).toBe(1);
      expect(cache.size()).toBe(0);
    });
  });
  
  describe('Enable/Disable', () => {
    it('should disable cache', () => {
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      
      cache.disable();
      
      expect(cache.isEnabled()).toBe(false);
      expect(cache.get(testFile1, 'CTS_FILE_SIZE')).toBeNull();
      expect(cache.size()).toBe(0);
    });
    
    it('should re-enable cache', () => {
      cache.set(testFile1, 'CTS_FILE_SIZE', { score: 100 });
      cache.saveCache();
      
      cache.disable();
      cache.enable();
      
      expect(cache.isEnabled()).toBe(true);
      // Should reload from disk
      expect(cache.size()).toBeGreaterThan(0);
    });
  });
});
