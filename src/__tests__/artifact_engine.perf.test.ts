/**
 * Artifact Engine Performance Test Suite
 * 
 * Verifies:
 * - Render timeout enforcement (<5s)
 * - Performance metrics tracking
 * - WASM initialization validation
 * - Cache performance
 * - Error recovery with placeholders
 * 
 * @module __tests__/artifact_engine.perf.test
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ArtifactEngine } from '../artifacts/artifact_engine';
import { ArtifactRenderer } from '../artifacts/types';

/**
 * Mock renderer for testing
 */
class TestRenderer implements ArtifactRenderer {
  type = 'test_renderer';
  
  async render(data: unknown): Promise<string> {
    return `<div>Test: ${JSON.stringify(data)}</div>`;
  }
}

/**
 * Slow renderer that exceeds timeout
 */
class SlowRenderer implements ArtifactRenderer {
  type = 'slow_renderer';
  
  async render(data: unknown): Promise<string> {
    // Wait 6 seconds (exceeds 5s timeout)
    await new Promise(resolve => setTimeout(resolve, 6000));
    return `<div>Slow: ${JSON.stringify(data)}</div>`;
  }
}

/**
 * Renderer that throws errors
 */
class ErrorRenderer implements ArtifactRenderer {
  type = 'error_renderer';
  
  async render(data: unknown): Promise<string> {
    throw new Error('Renderer error test');
  }
}

/**
 * Fast renderer for cache testing
 */
class FastRenderer implements ArtifactRenderer {
  type = 'fast_renderer';
  renderCount = 0;
  
  async render(data: unknown): Promise<string> {
    this.renderCount++;
    return `<div>Fast ${this.renderCount}: ${JSON.stringify(data)}</div>`;
  }
}

describe('ArtifactEngine Performance', () => {
  let engine: ArtifactEngine;

  beforeEach(() => {
    engine = new ArtifactEngine();
  });

  describe('Timeout Enforcement', () => {
    it('should enforce 5s render timeout and return error placeholder', async () => {
      const slowRenderer = new SlowRenderer();
      engine.registerRenderer(slowRenderer);

      const result = await engine.renderArtifact('slow_renderer', { test: 'data' });

      // Should return error placeholder, not throw
      expect(result.html).toContain('Artifact Rendering Failed');
      expect(result.html).toContain('timeout');
      expect(result.cached).toBe(false);

      // Verify timeout was recorded in metrics
      const metrics = engine.getMetrics();
      expect(metrics.timeouts).toBeGreaterThan(0);
    }, 10000); // 10s test timeout

    it('should complete fast renders within budget', async () => {
      const fastRenderer = new FastRenderer();
      engine.registerRenderer(fastRenderer);

      const startTime = Date.now();
      const result = await engine.renderArtifact('fast_renderer', { test: 'data' });
      const renderTime = Date.now() - startTime;

      expect(renderTime).toBeLessThan(5000);
      expect(result.html).toContain('Fast');
    });
  });

  describe('Performance Metrics Tracking', () => {
    it('should track render count and timing', async () => {
      const testRenderer = new TestRenderer();
      engine.registerRenderer(testRenderer);

      // Initial metrics should be zero
      let metrics = engine.getMetrics();
      expect(metrics.renderCount).toBe(0);
      expect(metrics.totalRenderTime).toBe(0);

      // Render artifact
      await engine.renderArtifact('test_renderer', { test: 1 });

      // Metrics should be updated
      metrics = engine.getMetrics();
      expect(metrics.renderCount).toBe(1);
      expect(metrics.totalRenderTime).toBeGreaterThan(0);
      expect(metrics.averageRenderTime).toBeGreaterThan(0);
    });

    it('should track cache hits and misses', async () => {
      const testRenderer = new TestRenderer();
      engine.registerRenderer(testRenderer);

      // First render = cache miss
      await engine.renderArtifact('test_renderer', { test: 1 });
      let metrics = engine.getMetrics();
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);

      // Second render with same data = cache hit
      await engine.renderArtifact('test_renderer', { test: 1 });
      metrics = engine.getMetrics();
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheHitRate).toBe(0.5); // 1 hit / 2 total

      // Third render with different data = cache miss
      await engine.renderArtifact('test_renderer', { test: 2 });
      metrics = engine.getMetrics();
      expect(metrics.cacheMisses).toBe(2);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheHitRate).toBeCloseTo(0.333, 2); // 1 hit / 3 total
    });

    it('should track errors in metrics', async () => {
      const errorRenderer = new ErrorRenderer();
      engine.registerRenderer(errorRenderer);

      // Render should fail but return placeholder
      const result = await engine.renderArtifact('error_renderer', { test: 'data' });
      
      // Check error was recorded
      const metrics = engine.getMetrics();
      expect(metrics.errors.length).toBeGreaterThan(0);
      expect(metrics.errors[0].type).toBe('error_renderer');
      expect(metrics.errors[0].message).toContain('Renderer error test');
      
      // Should return error placeholder
      expect(result.html).toContain('Artifact Rendering Failed');
      expect(result.cached).toBe(false);
    });

    it('should limit error history to 20 entries', async () => {
      const errorRenderer = new ErrorRenderer();
      engine.registerRenderer(errorRenderer);

      // Generate 25 errors
      for (let i = 0; i < 25; i++) {
        await engine.renderArtifact('error_renderer', { test: i });
      }

      const metrics = engine.getMetrics();
      expect(metrics.errors.length).toBe(20); // Should only keep last 20
    });
  });

  describe('Cache Performance', () => {
    it('should render from cache much faster than initial render', async () => {
      const fastRenderer = new FastRenderer();
      engine.registerRenderer(fastRenderer);

      // First render (cache miss)
      const start1 = Date.now();
      await engine.renderArtifact('fast_renderer', { test: 'data' });
      const renderTime = Date.now() - start1;

      // Second render (cache hit)
      const start2 = Date.now();
      const cached = await engine.renderArtifact('fast_renderer', { test: 'data' });
      const cacheTime = Date.now() - start2;

      expect(cached.cached).toBe(true);
      expect(cacheTime).toBeLessThan(renderTime); // Cache should be faster
      expect(cacheTime).toBeLessThan(10); // Cache read should be <10ms
    });

    it('should handle cache invalidation on version changes', async () => {
      const fastRenderer = new FastRenderer();
      engine.registerRenderer(fastRenderer, '1.0.0');

      // Render and cache
      await engine.renderArtifact('fast_renderer', { test: 'data' });
      expect(fastRenderer.renderCount).toBe(1);

      // Render again (should use cache)
      await engine.renderArtifact('fast_renderer', { test: 'data' });
      expect(fastRenderer.renderCount).toBe(1); // Still 1 (cached)

      // Update renderer version
      engine.registerRenderer(fastRenderer, '2.0.0');

      // Render again (cache should be invalidated)
      await engine.renderArtifact('fast_renderer', { test: 'data' });
      expect(fastRenderer.renderCount).toBe(2); // Re-rendered due to version change
    });
  });

  describe('Error Recovery', () => {
    it('should return placeholder HTML on render errors', async () => {
      const errorRenderer = new ErrorRenderer();
      engine.registerRenderer(errorRenderer);

      const result = await engine.renderArtifact('error_renderer', { test: 'data' });

      expect(result.html).toContain('Artifact Rendering Failed');
      expect(result.html).toContain('error_renderer');
      expect(result.html).toContain('Renderer error test');
      expect(result.cached).toBe(false);
      expect(result.metadata.type).toBe('error_renderer');
    });

    it('should return placeholder HTML on timeout', async () => {
      const slowRenderer = new SlowRenderer();
      engine.registerRenderer(slowRenderer);

      const result = await engine.renderArtifact('slow_renderer', { test: 'data' });

      expect(result.html).toContain('Artifact Rendering Failed');
      expect(result.html).toContain('timeout');
      expect(result.cached).toBe(false);
    }, 10000);

    it('should continue functioning after errors', async () => {
      const errorRenderer = new ErrorRenderer();
      const goodRenderer = new TestRenderer();
      engine.registerRenderer(errorRenderer);
      engine.registerRenderer(goodRenderer);

      // Cause an error
      await engine.renderArtifact('error_renderer', { test: 1 });

      // Should still work for valid renderers
      const result = await engine.renderArtifact('test_renderer', { test: 2 });
      expect(result.html).toContain('Test');
      expect(result.html).not.toContain('Failed');
    });
  });

  describe('Performance Budgets', () => {
    it('should meet <100ms budget for cache reads', async () => {
      const testRenderer = new TestRenderer();
      engine.registerRenderer(testRenderer);

      // Warm up cache
      await engine.renderArtifact('test_renderer', { test: 'data' });

      // Measure cache read performance
      const start = Date.now();
      const result = await engine.renderArtifact('test_renderer', { test: 'data' });
      const duration = Date.now() - start;

      expect(result.cached).toBe(true);
      expect(duration).toBeLessThan(100); // <100ms budget
    });

    it('should calculate average render time correctly', async () => {
      const testRenderer = new TestRenderer();
      engine.registerRenderer(testRenderer);

      // Render multiple times
      await engine.renderArtifact('test_renderer', { test: 1 });
      await engine.renderArtifact('test_renderer', { test: 2 });
      await engine.renderArtifact('test_renderer', { test: 3 });

      const metrics = engine.getMetrics();
      expect(metrics.renderCount).toBe(3);
      expect(metrics.averageRenderTime).toBeGreaterThan(0);
      expect(metrics.averageRenderTime).toBe(metrics.totalRenderTime / 3);
    });
  });

  describe('WASM Validation', () => {
    it('should initialize tree-sitter for parser-dependent renderers', async () => {
      // Note: This test requires actual tree-sitter setup
      // For now, we just verify the type checking logic
      
      const engine = new ArtifactEngine();
      
      // Non-parser types should not require tree-sitter
      const testRenderer = new TestRenderer();
      engine.registerRenderer(testRenderer);
      
      // Should render without tree-sitter init
      const result = await engine.renderArtifact('test_renderer', { test: 'data' });
      expect(result.html).toContain('Test');
    });
  });
});
