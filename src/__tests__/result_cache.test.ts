/**
 * Result Caching System - Unit Tests
 * Following Quinn's comprehensive testing methodology
 */

import { ResultCache, CacheStats, globalCache } from '../cache/result_cache';

describe('Result Caching System - Unit Tests', () => {
  
  describe('ResultCache - Basic Operations', () => {
    let cache: ResultCache;

    beforeEach(() => {
      cache = new ResultCache({
        maxEntries: 10,
        maxSize: 1024 * 1024, // 1MB
        ttl: 1000, // 1 second for testing
        enableStats: true,
      });
    });

    it('should store and retrieve cached results', () => {
      const data = { result: 'test data' };
      cache.set('test_tool', { param1: 'value1' }, data);
      
      const retrieved = cache.get('test_tool', { param1: 'value1' });
      expect(retrieved).toEqual(data);
    });

    it('should return undefined for cache miss', () => {
      const result = cache.get('test_tool', { param1: 'value1' });
      expect(result).toBeUndefined();
    });

    it('should generate same key for same parameters', () => {
      const data1 = { result: 'first' };
      const data2 = { result: 'second' };
      
      cache.set('test_tool', { a: 1, b: 2 }, data1);
      cache.set('test_tool', { b: 2, a: 1 }, data2); // Different order
      
      const retrieved = cache.get('test_tool', { a: 1, b: 2 });
      expect(retrieved).toEqual(data2); // Should overwrite
    });

    it('should differentiate between different tools', () => {
      const data1 = { result: 'tool1' };
      const data2 = { result: 'tool2' };
      
      cache.set('tool1', { param: 'value' }, data1);
      cache.set('tool2', { param: 'value' }, data2);
      
      expect(cache.get('tool1', { param: 'value' })).toEqual(data1);
      expect(cache.get('tool2', { param: 'value' })).toEqual(data2);
    });

    it('should check if result exists without retrieving', () => {
      cache.set('test_tool', { param: 'value' }, { data: 'test' });
      
      expect(cache.has('test_tool', { param: 'value' })).toBe(true);
      expect(cache.has('test_tool', { param: 'other' })).toBe(false);
    });
  });

  describe('ResultCache - TTL Expiration', () => {
    let cache: ResultCache;

    beforeEach(() => {
      cache = new ResultCache({
        maxEntries: 10,
        ttl: 50, // 50ms for testing
      });
    });

    it('should expire entries after TTL', async () => {
      cache.set('test_tool', { param: 'value' }, { data: 'test' });
      
      expect(cache.has('test_tool', { param: 'value' })).toBe(true);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(cache.has('test_tool', { param: 'value' })).toBe(false);
      expect(cache.get('test_tool', { param: 'value' })).toBeUndefined();
    });

    it('should not return expired entries', async () => {
      cache.set('test_tool', { param: 'value' }, { data: 'test' });
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      const result = cache.get('test_tool', { param: 'value' });
      expect(result).toBeUndefined();
    });

    it('should cleanup expired entries', async () => {
      cache.set('tool1', { p: '1' }, { data: '1' });
      cache.set('tool2', { p: '2' }, { data: '2' });
      cache.set('tool3', { p: '3' }, { data: '3' });
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      const cleaned = cache.cleanup();
      expect(cleaned).toBe(3);
      expect(cache.getStats().totalEntries).toBe(0);
    });
  });

  describe('ResultCache - LRU Eviction', () => {
    let cache: ResultCache;

    beforeEach(() => {
      cache = new ResultCache({
        maxEntries: 3,
        maxSize: 1024 * 1024,
        ttl: 10000,
      });
    });

    it('should evict least recently used entry when at capacity', () => {
      cache.set('tool', { id: 1 }, { data: '1' });
      cache.set('tool', { id: 2 }, { data: '2' });
      cache.set('tool', { id: 3 }, { data: '3' });
      
      // Access entry 1 to make it recently used
      cache.get('tool', { id: 1 });
      
      // Add entry 4, should evict entry 2 (LRU)
      cache.set('tool', { id: 4 }, { data: '4' });
      
      expect(cache.has('tool', { id: 1 })).toBe(true); // Recently accessed
      expect(cache.has('tool', { id: 2 })).toBe(false); // Evicted (LRU)
      expect(cache.has('tool', { id: 3 })).toBe(true);
      expect(cache.has('tool', { id: 4 })).toBe(true);
    });

    it('should update access order on get', () => {
      cache.set('tool', { id: 1 }, { data: '1' });
      cache.set('tool', { id: 2 }, { data: '2' });
      cache.set('tool', { id: 3 }, { data: '3' });
      
      // Access entry 1
      cache.get('tool', { id: 1 });
      
      // Add entry 4
      cache.set('tool', { id: 4 }, { data: '4' });
      
      // Entry 2 should be evicted (was LRU)
      expect(cache.has('tool', { id: 2 })).toBe(false);
    });

    it('should track eviction count', () => {
      cache.set('tool', { id: 1 }, { data: '1' });
      cache.set('tool', { id: 2 }, { data: '2' });
      cache.set('tool', { id: 3 }, { data: '3' });
      cache.set('tool', { id: 4 }, { data: '4' }); // Evicts 1
      cache.set('tool', { id: 5 }, { data: '5' }); // Evicts 2
      
      const stats = cache.getStats();
      expect(stats.evictions).toBe(2);
    });
  });

  describe('ResultCache - Size Management', () => {
    let cache: ResultCache;

    beforeEach(() => {
      cache = new ResultCache({
        maxEntries: 100,
        maxSize: 1024, // 1KB
        ttl: 10000,
      });
    });

    it('should evict entries when size limit exceeded', () => {
      // Create data that exceeds size limit
      const largeData = { data: 'x'.repeat(500) }; // ~500 bytes each
      
      cache.set('tool', { id: 1 }, largeData);
      cache.set('tool', { id: 2 }, largeData);
      cache.set('tool', { id: 3 }, largeData); // Should trigger eviction
      
      const stats = cache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(1024);
      expect(stats.evictions).toBeGreaterThan(0);
    });

    it('should track total cache size', () => {
      const data1 = { small: 'data' };
      const data2 = { small: 'test' };
      
      cache.set('tool', { id: 1 }, data1);
      cache.set('tool', { id: 2 }, data2);
      
      const stats = cache.getStats();
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.totalSize).toBeLessThan(1024);
    });

    it('should update size when replacing entry', () => {
      const smallData = { data: 'small' };
      const largeData = { data: 'x'.repeat(300) };
      
      cache.set('tool', { id: 1 }, smallData);
      const stats1 = cache.getStats();
      
      cache.set('tool', { id: 1 }, largeData); // Replace with larger
      const stats2 = cache.getStats();
      
      expect(stats2.totalSize).toBeGreaterThan(stats1.totalSize);
      expect(stats2.totalEntries).toBe(1); // Still just 1 entry
    });
  });

  describe('ResultCache - Statistics', () => {
    let cache: ResultCache;

    beforeEach(() => {
      cache = new ResultCache({
        maxEntries: 10,
        ttl: 10000,
        enableStats: true,
      });
    });

    it('should track cache hits', () => {
      cache.set('tool', { id: 1 }, { data: 'test' });
      
      cache.get('tool', { id: 1 }); // Hit
      cache.get('tool', { id: 1 }); // Hit
      cache.get('tool', { id: 1 }); // Hit
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
    });

    it('should track cache misses', () => {
      cache.get('tool', { id: 1 }); // Miss
      cache.get('tool', { id: 2 }); // Miss
      
      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate', () => {
      cache.set('tool', { id: 1 }, { data: 'test' });
      
      cache.get('tool', { id: 1 }); // Hit
      cache.get('tool', { id: 2 }); // Miss
      cache.get('tool', { id: 1 }); // Hit
      cache.get('tool', { id: 3 }); // Miss
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0.5); // 2 hits / 4 total
    });

    it('should return 0 hit rate when no accesses', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should track entry count', () => {
      cache.set('tool', { id: 1 }, { data: '1' });
      cache.set('tool', { id: 2 }, { data: '2' });
      cache.set('tool', { id: 3 }, { data: '3' });
      
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(3);
    });
  });

  describe('ResultCache - Cache Management', () => {
    let cache: ResultCache;

    beforeEach(() => {
      cache = new ResultCache({
        maxEntries: 10,
        ttl: 10000,
      });
    });

    it('should clear all entries', () => {
      cache.set('tool1', { id: 1 }, { data: '1' });
      cache.set('tool2', { id: 2 }, { data: '2' });
      cache.set('tool3', { id: 3 }, { data: '3' });
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    it('should clear specific tool cache', () => {
      cache.set('tool1', { id: 1 }, { data: '1' });
      cache.set('tool1', { id: 2 }, { data: '2' });
      cache.set('tool2', { id: 1 }, { data: '3' });
      
      const cleared = cache.clearTool('tool1');
      
      expect(cleared).toBe(2);
      expect(cache.has('tool1', { id: 1 })).toBe(false);
      expect(cache.has('tool1', { id: 2 })).toBe(false);
      expect(cache.has('tool2', { id: 1 })).toBe(true);
    });

    it('should reset statistics on clear', () => {
      cache.set('tool', { id: 1 }, { data: 'test' });
      cache.get('tool', { id: 1 }); // Hit
      cache.get('tool', { id: 2 }); // Miss
      
      cache.clear();
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
    });
  });

  describe('ResultCache - Edge Cases', () => {
    let cache: ResultCache;

    beforeEach(() => {
      cache = new ResultCache({
        maxEntries: 5,
        maxSize: 1024,
        ttl: 10000,
      });
    });

    it('should handle empty parameters', () => {
      cache.set('tool', {}, { data: 'test' });
      const result = cache.get('tool', {});
      
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle complex nested parameters', () => {
      const params = {
        nested: {
          deep: {
            value: 'test',
            array: [1, 2, 3],
          },
        },
      };
      
      cache.set('tool', params, { result: 'complex' });
      const result = cache.get('tool', params);
      
      expect(result).toEqual({ result: 'complex' });
    });

    it('should handle null and undefined in data', () => {
      const data = { value: null, other: undefined };
      cache.set('tool', { id: 1 }, data);
      
      const result = cache.get('tool', { id: 1 });
      expect(result).toEqual(data);
    });

    it('should handle very large data objects', () => {
      const largeData = {
        array: new Array(1000).fill({ item: 'data'.repeat(10) }),
      };
      
      cache.set('tool', { id: 1 }, largeData);
      const result = cache.get('tool', { id: 1 });
      
      expect(result).toEqual(largeData);
    });

    it('should handle rapid successive updates', () => {
      for (let i = 0; i < 20; i++) {
        cache.set('tool', { id: i }, { data: `item${i}` });
      }
      
      const stats = cache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(5); // maxEntries = 5
    });
  });

  describe('Global Cache Instance', () => {
    beforeEach(() => {
      globalCache.clear();
    });

    it('should be accessible as singleton', () => {
      globalCache.set('test_tool', { param: 'value' }, { result: 'test' });
      
      const result = globalCache.get('test_tool', { param: 'value' });
      expect(result).toEqual({ result: 'test' });
    });

    it('should have default configuration', () => {
      const stats = globalCache.getStats();
      expect(stats.maxSize).toBe(50 * 1024 * 1024); // 50MB
    });
  });
});
