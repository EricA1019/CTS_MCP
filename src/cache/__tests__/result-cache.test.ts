/**
 * Tests for Result Cache
 * Following Quinn's comprehensive testing methodology
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ResultCache } from '../result-cache.js';

describe('ResultCache', () => {
  let cache: ResultCache;

  beforeEach(() => {
    cache = new ResultCache(5, 1000); // Small cache for testing, 1s TTL
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent keys for same inputs', () => {
      // Arrange
      const toolName = 'CTS_Scan_Project';
      const args = { projectPath: '/path/to/project' };

      // Act
      const key1 = cache.generateKey(toolName, args);
      const key2 = cache.generateKey(toolName, args);

      // Assert
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^tool:CTS_Scan_Project:[a-f0-9]{64}$/);
    });

    it('should generate different keys for different inputs', () => {
      // Arrange
      const toolName = 'CTS_Scan_Project';
      const args1 = { projectPath: '/path1' };
      const args2 = { projectPath: '/path2' };

      // Act
      const key1 = cache.generateKey(toolName, args1);
      const key2 = cache.generateKey(toolName, args2);

      // Assert
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different tool names', () => {
      // Arrange
      const args = { projectPath: '/path' };

      // Act
      const key1 = cache.generateKey('Tool1', args);
      const key2 = cache.generateKey('Tool2', args);

      // Assert
      expect(key1).not.toBe(key2);
    });
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve values', () => {
      // Arrange
      const key = 'test:key:123';
      const value = { data: 'test value' };

      // Act
      cache.set(key, value);
      const result = cache.get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      // Arrange & Act
      const result = cache.get('nonexistent:key');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should check if key exists', () => {
      // Arrange
      const key = 'test:key:exists';
      cache.set(key, { data: 'value' });

      // Act & Assert
      expect(cache.has(key)).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      // Arrange
      const key = 'test:key:delete';
      cache.set(key, { data: 'value' });

      // Act
      const deleted = cache.delete(key);

      // Assert
      expect(deleted).toBe(true);
      expect(cache.has(key)).toBe(false);
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all entries', () => {
      // Arrange
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Act
      cache.clear();

      // Assert
      expect(cache.size).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entry when full', () => {
      // Arrange
      const keys = ['key1', 'key2', 'key3', 'key4', 'key5'];
      keys.forEach(key => cache.set(key, `value_${key}`));

      // Act - Add 6th entry (should evict key1)
      cache.set('key6', 'value_key6');

      // Assert
      expect(cache.size).toBe(5);
      expect(cache.get('key1')).toBeUndefined(); // Evicted
      expect(cache.get('key2')).toBe('value_key2');
      expect(cache.get('key6')).toBe('value_key6');
    });

    it('should maintain LRU order on access', () => {
      // Arrange
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Act - Access key1 (moves it to end)
      cache.get('key1');
      
      // Add 6th entry (should evict key2, not key1)
      cache.set('key6', 'value6');

      // Assert
      expect(cache.get('key1')).toBe('value1'); // Still exists
      expect(cache.get('key2')).toBeUndefined(); // Evicted
    });

    it('should update existing keys without eviction', () => {
      // Arrange
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Act - Update key1
      cache.set('key1', 'value1_updated');

      // Assert
      expect(cache.size).toBe(2);
      expect(cache.get('key1')).toBe('value1_updated');
    });
  });

  describe('TTL Expiration', () => {
    it('should expire entries after TTL', async () => {
      // Arrange
      const shortCache = new ResultCache(10, 50); // 50ms TTL
      const key = 'test:ttl';
      shortCache.set(key, 'value');

      // Act - Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert
      expect(shortCache.get(key)).toBeUndefined();
      expect(shortCache.has(key)).toBe(false);
    });

    it('should not expire entries before TTL', async () => {
      // Arrange
      const key = 'test:ttl:valid';
      cache.set(key, 'value');

      // Act - Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 100)); // TTL is 1000ms

      // Assert
      expect(cache.get(key)).toBe('value');
      expect(cache.has(key)).toBe(true);
    });

    it('should remove expired entries on access', async () => {
      // Arrange
      const shortCache = new ResultCache(10, 50);
      shortCache.set('key1', 'value1');
      shortCache.set('key2', 'value2');

      // Act - Wait for TTL
      await new Promise(resolve => setTimeout(resolve, 100));
      shortCache.get('key1'); // Should remove expired entry

      // Assert
      expect(shortCache.size).toBe(1); // key1 removed
    });
  });

  describe('Cache Statistics', () => {
    it('should track hits and misses', () => {
      // Arrange
      cache.set('key1', 'value1');

      // Act
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('key2'); // Miss
      cache.get('key3'); // Miss

      const stats = cache.getStats();

      // Assert
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should calculate hit rate correctly', () => {
      // Arrange
      cache.set('key1', 'value1');

      // Act - 3 hits, 1 miss
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');
      cache.get('key2');

      const stats = cache.getStats();

      // Assert
      expect(stats.hitRate).toBe(0.75);
    });

    it('should handle zero hits/misses', () => {
      // Arrange & Act
      const stats = cache.getStats();

      // Assert
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should report current size and max size', () => {
      // Arrange
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Act
      const stats = cache.getStats();

      // Assert
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
    });

    it('should reset stats on clear', () => {
      // Arrange
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key2');

      // Act
      cache.clear();
      const stats = cache.getStats();

      // Assert
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for invalid maxSize', () => {
      // Arrange & Act & Assert
      expect(() => new ResultCache(0, 1000)).toThrow('Cache maxSize must be positive');
      expect(() => new ResultCache(-1, 1000)).toThrow('Cache maxSize must be positive');
    });

    it('should throw error for invalid TTL', () => {
      // Arrange & Act & Assert
      expect(() => new ResultCache(100, 0)).toThrow('Cache TTL must be positive');
      expect(() => new ResultCache(100, -1)).toThrow('Cache TTL must be positive');
    });

    it('should handle complex object values', () => {
      // Arrange
      const key = 'test:complex';
      const value = {
        nested: {
          data: [1, 2, 3],
          map: { a: 'alpha', b: 'beta' },
        },
        timestamp: Date.now(),
      };

      // Act
      cache.set(key, value);
      const result = cache.get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('should handle null and undefined values', () => {
      // Arrange & Act
      cache.set('key_null', null);
      cache.set('key_undefined', undefined);

      // Assert
      expect(cache.get('key_null')).toBeNull();
      expect(cache.get('key_undefined')).toBeUndefined();
    });

    it('should track access count', () => {
      // Arrange
      cache.set('key1', 'value1');

      // Act
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');

      // Assert
      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
    });
  });
});
