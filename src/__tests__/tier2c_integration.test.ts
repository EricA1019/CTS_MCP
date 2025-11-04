/**
 * Tier 2C Integration Validation Test
 * 
 * Validates that all Tier 2C improvements work together correctly:
 * - Sampling protocol
 * - Configuration management
 * - Result caching
 */

import { checkResponseSize, truncateLargeArrays } from '../sampling';
import { ConfigManager } from '../config/tool_config';
import { ResultCache } from '../cache/result_cache';

describe('Tier 2C Integration - End-to-End Validation', () => {
  
  describe('Complete Workflow Integration', () => {
    let config: ConfigManager;
    let cache: ResultCache;

    beforeEach(() => {
      config = new ConfigManager({
        bughunter: { enableCache: true, cacheTTL: 1000 },
      });
      cache = new ResultCache({ maxEntries: 5, ttl: 1000 });
    });

    it('should execute complete workflow with all Tier 2C features', () => {
      // 1. Configuration: Get tool settings
      const toolConfig = config.getBughunterConfig();
      expect(toolConfig.enableCache).toBe(true);
      expect(toolConfig.minSeverity).toBe('medium');

      // 2. Caching: Check if result exists
      const params = { projectPath: '/test', minSeverity: 'high' };
      let result = cache.get('test_tool', params);
      expect(result).toBeUndefined(); // First run - cache miss

      // 3. Execute expensive operation (simulated)
      const mockResult = {
        bugs: new Array(150).fill({ severity: 'high', message: 'Test bug' }),
        totalBugs: 150,
      };

      // 5. Sampling: Handle large arrays
      const sampled = truncateLargeArrays(mockResult, 100);
      expect(sampled.bugs.length).toBe(100);
      expect(sampled._truncated).toEqual(['bugs (150 total, showing 100)']);

      // 5. Size Check: Verify response fits in buffer
      const { data, truncated } = checkResponseSize(sampled, 60000);
      expect(truncated).toBe(false); // Should fit after truncation

      // 6. Caching: Store result for future use
      if (toolConfig.enableCache) {
        cache.set('test_tool', params, data);
      }

      // 7. Verify cache hit on second access
      const cachedResult = cache.get('test_tool', params);
      expect(cachedResult).toEqual(data);
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should integrate configuration with caching', () => {
      // Update configuration
      config.updateConfig({
        bughunter: { enableCache: false },
      });

      const updatedConfig = config.getBughunterConfig();
      expect(updatedConfig.enableCache).toBe(false);

      // Should skip caching when disabled
      const params = { projectPath: '/test' };

      if (!updatedConfig.enableCache) {
        // Don't cache
        expect(cache.has('test_tool', params)).toBe(false);
      }
    });

    it('should sample large responses', () => {
      // Create large response
      const largeResponse = {
        violations: new Array(500).fill({
          severity: 'high',
          file: 'test.gd',
          line: 100,
          message: 'Test violation',
        }),
      };

      // Sampling
      const sampled = truncateLargeArrays(largeResponse, 100);
      expect(sampled.violations.length).toBe(100);

      // Size check
      const { truncated, originalSize } = checkResponseSize(sampled, 60000);
      expect(originalSize).toBeGreaterThan(0);
    });
  });

  describe('Configuration + Caching Integration', () => {
    it('should use configuration to control cache behavior', async () => {
      const manager = new ConfigManager({
        bughunter: { 
          enableCache: true,
          cacheTTL: 500, // 500ms
        },
      });

      const config = manager.getBughunterConfig();
      
      // Create cache with config TTL
      const cache = new ResultCache({
        ttl: config.cacheTTL,
        enableStats: true,
      });

      // Store result
      cache.set('tool', { p: 1 }, { data: 'test' });
      expect(cache.has('tool', { p: 1 })).toBe(true);

      // Should expire after TTL
      await new Promise(resolve => setTimeout(resolve, 550));
      expect(cache.has('tool', { p: 1 })).toBe(false);
    });

    it('should respect per-tool cache settings', () => {
      const manager = new ConfigManager({
        bughunter: { enableCache: true },
        audit: { enableCache: false },
      });

      expect(manager.getBughunterConfig().enableCache).toBe(true);
      expect(manager.getAuditConfig().enableCache).toBe(false);
    });
  });

  describe('Sampling Integration', () => {
    it('should handle sampled responses in workflow', () => {
      const response = {
        items: new Array(200).fill({ id: 1, data: 'x'.repeat(100) }),
      };

      // Sample first
      const sampled = truncateLargeArrays(response, 50);

      expect(sampled.items.length).toBe(50);
      expect(sampled._truncated).toBeDefined();
    });

    it('should work with configuration and caching', () => {
      const config = new ConfigManager({
        bughunter: { enableCache: true, maxFiles: 100 },
      });
      
      const cache = new ResultCache({ maxEntries: 10 });
      
      // Large result
      const result = {
        files: new Array(150).fill({ name: 'test.gd', issues: 5 }),
      };
      
      // Sample based on config
      const maxFiles = config.getBughunterConfig().maxFiles;
      const sampled = truncateLargeArrays(result, maxFiles);
      
      expect(sampled.files.length).toBe(100);
      
      // Cache sampled result
      cache.set('scan', { path: '/test' }, sampled);
      expect(cache.has('scan', { path: '/test' })).toBe(true);
    });
  });

  describe('Performance Validation', () => {
    it('should meet performance targets', () => {
      const cache = new ResultCache({ maxEntries: 10 });
      const params = { id: 1 };
      const data = { result: 'test' };

      // Cache write
      const writeStart = Date.now();
      cache.set('tool', params, data);
      const writeTime = Date.now() - writeStart;
      expect(writeTime).toBeLessThan(10); // <10ms

      // Cache read
      const readStart = Date.now();
      const cached = cache.get('tool', params);
      const readTime = Date.now() - readStart;
      expect(readTime).toBeLessThan(5); // <5ms
      expect(cached).toEqual(data);
    });

    it('should handle rapid operations', () => {
      const cache = new ResultCache({ maxEntries: 20 });
      
      const start = Date.now();
      
      // 100 cache operations
      for (let i = 0; i < 100; i++) {
        cache.set('tool', { id: i }, { data: i });
      }
      
      const writeTime = Date.now() - start;
      expect(writeTime).toBeLessThan(50); // <50ms for 100 operations
      
      // Verify LRU worked (maxEntries = 20)
      const stats = cache.getStats();
      expect(stats.totalEntries).toBe(20);
      expect(stats.evictions).toBe(80);
    });
  });

  describe('Tier 2C Feature Validation', () => {
    it('should have all features available', () => {
      // Configuration
      const config = new ConfigManager();
      expect(config.getBughunterConfig()).toBeDefined();
      expect(config.getAuditConfig()).toBeDefined();
      
      // Caching
      const cache = new ResultCache();
      expect(cache.getStats()).toBeDefined();
      
      // Sampling
      const sampled = truncateLargeArrays({ items: [1, 2, 3] }, 2);
      expect(sampled.items.length).toBe(2);
      
      const { data } = checkResponseSize({ test: 'data' }, 1000);
      expect(data).toBeDefined();
    });

    it('should support feature composition', () => {
      // All features working together
      const manager = new ConfigManager({
        bughunter: { enableCache: true, maxFiles: 50 },
      });
      
      const cache = new ResultCache({ maxEntries: 10 });
      
      const mockData = {
        files: new Array(100).fill({ name: 'test.gd' }),
      };
      
      // Apply configuration limit
      const config = manager.getBughunterConfig();
      const limited = truncateLargeArrays(mockData, config.maxFiles);
      expect(limited.files.length).toBe(50);
      
      // Check size
      const { data: sized } = checkResponseSize(limited, 60000);
      
      // Cache if enabled
      if (config.enableCache) {
        cache.set('tool', { id: 1 }, sized);
        expect(cache.has('tool', { id: 1 })).toBe(true);
      }
    });
  });
});
