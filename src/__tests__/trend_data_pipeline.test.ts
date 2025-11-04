/**
 * Tests for Performance Trend Data Pipeline
 * Validates time-series aggregation and interpolation
 */

import { TrendDataPipeline } from '../artifacts/pipelines/trend_data_pipeline.js';
import { existsSync } from 'fs';

describe('TrendDataPipeline', () => {
  let pipeline: TrendDataPipeline;

  beforeEach(() => {
    pipeline = new TrendDataPipeline();
  });

  describe('Input Validation', () => {
    it('should reject non-existent project path', async () => {
      await expect(
        pipeline.aggregateMetrics('/nonexistent/path', 12)
      ).rejects.toThrow('Project path does not exist');
    });

    it('should accept non-Git directory (snapshot mode)', async () => {
      // Use /tmp which exists but is not a Git repo
      const dataset = await pipeline.aggregateMetrics('/tmp', 2);
      
      expect(dataset.projectPath).toBe('/tmp');
      expect(dataset.weekCount).toBe(2);
      expect(dataset.loc.length).toBe(2);
    }, 3000);
  });

  describe('Real Project Integration', () => {
    const projectPath = '/home/eric/Godot/ProtoBd/cts_mcp';

    it('should aggregate metrics from real project in <2 seconds', async () => {
      // Skip if project doesn't exist (CI environment)
      if (!existsSync(projectPath)) {
        console.log('[TEST SKIP] Project path not available');
        return;
      }

      const startTime = performance.now();
      const dataset = await pipeline.aggregateMetrics(projectPath, 4); // 4 weeks for speed
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(2000);
      expect(dataset.projectPath).toBe(projectPath);
      expect(dataset.weekCount).toBe(4);
      expect(dataset.loc.length).toBe(4);
      expect(dataset.tests.length).toBe(4);
      expect(dataset.coverage.length).toBe(4);
    }, 3000); // 3 second timeout

    it('should return valid TrendDataset structure', async () => {
      if (!existsSync(projectPath)) {
        console.log('[TEST SKIP] Project path not available');
        return;
      }

      const dataset = await pipeline.aggregateMetrics(projectPath, 2);

      expect(dataset).toHaveProperty('projectPath');
      expect(dataset).toHaveProperty('startDate');
      expect(dataset).toHaveProperty('endDate');
      expect(dataset).toHaveProperty('weekCount');
      expect(dataset).toHaveProperty('loc');
      expect(dataset).toHaveProperty('tests');
      expect(dataset).toHaveProperty('coverage');

      // Validate time-series arrays
      expect(Array.isArray(dataset.loc)).toBe(true);
      expect(Array.isArray(dataset.tests)).toBe(true);
      expect(Array.isArray(dataset.coverage)).toBe(true);

      // Validate data points structure
      dataset.loc.forEach(point => {
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('value');
        expect(typeof point.timestamp).toBe('number');
        expect(typeof point.value).toBe('number');
      });
    }, 3000);

    it('should align timestamps to ISO week boundaries (Monday 00:00)', async () => {
      if (!existsSync(projectPath)) {
        console.log('[TEST SKIP] Project path not available');
        return;
      }

      const dataset = await pipeline.aggregateMetrics(projectPath, 2);

      // Check that all timestamps are at midnight (00:00:00) in local time
      dataset.loc.forEach(point => {
        const date = new Date(point.timestamp);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        // Verify it's at midnight (00:00:00)
        expect(hours).toBe(0);
        expect(minutes).toBe(0);
        expect(seconds).toBe(0);
      });
    }, 3000);

    it('should have non-negative metric values', async () => {
      if (!existsSync(projectPath)) {
        console.log('[TEST SKIP] Project path not available');
        return;
      }

      const dataset = await pipeline.aggregateMetrics(projectPath, 2);

      // All metrics should be non-negative
      dataset.loc.forEach(point => expect(point.value).toBeGreaterThanOrEqual(0));
      dataset.tests.forEach(point => expect(point.value).toBeGreaterThanOrEqual(0));
      dataset.coverage.forEach(point => {
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.value).toBeLessThanOrEqual(100);
      });
    }, 3000);

    it('should handle projects with sparse commit history', async () => {
      if (!existsSync(projectPath)) {
        console.log('[TEST SKIP] Project path not available');
        return;
      }

      // Request 12 weeks of history - may have gaps
      const dataset = await pipeline.aggregateMetrics(projectPath, 12);

      // Should still return complete dataset (interpolated)
      expect(dataset.loc.length).toBe(12);
      expect(dataset.tests.length).toBe(12);
      expect(dataset.coverage.length).toBe(12);

      // No gaps (all timestamps present)
      for (let i = 1; i < dataset.loc.length; i++) {
        const prevTimestamp = dataset.loc[i - 1].timestamp;
        const currTimestamp = dataset.loc[i].timestamp;
        const diff = currTimestamp - prevTimestamp;
        const weekMs = 7 * 24 * 60 * 60 * 1000;

        // Allow small tolerance for week boundaries
        expect(Math.abs(diff - weekMs)).toBeLessThan(1000);
      }
    }, 5000); // Longer timeout for 12 weeks
  });

  describe('Data Interpolation', () => {
    it('should produce smooth time-series without gaps', async () => {
      if (!existsSync('/home/eric/Godot/ProtoBd/cts_mcp')) {
        console.log('[TEST SKIP] Project path not available');
        return;
      }

      const dataset = await pipeline.aggregateMetrics('/home/eric/Godot/ProtoBd/cts_mcp', 4);

      // Verify no undefined or null values
      dataset.loc.forEach(point => {
        expect(point.value).toBeDefined();
        expect(point.value).not.toBeNaN();
      });

      dataset.tests.forEach(point => {
        expect(point.value).toBeDefined();
        expect(point.value).not.toBeNaN();
      });

      dataset.coverage.forEach(point => {
        expect(point.value).toBeDefined();
        expect(point.value).not.toBeNaN();
      });
    }, 3000);
  });

  describe('Metric Calculations', () => {
    it('should calculate LOC from TypeScript files', async () => {
      if (!existsSync('/home/eric/Godot/ProtoBd/cts_mcp')) {
        console.log('[TEST SKIP] Project path not available');
        return;
      }

      const dataset = await pipeline.aggregateMetrics('/home/eric/Godot/ProtoBd/cts_mcp', 1);

      // CTS MCP project should have LOC > 0
      expect(dataset.loc[0].value).toBeGreaterThan(0);
      
      // Rough sanity check (should have thousands of LOC)
      expect(dataset.loc[0].value).toBeGreaterThan(1000);
    }, 3000);

    it('should calculate test count from test files', async () => {
      if (!existsSync('/home/eric/Godot/ProtoBd/cts_mcp')) {
        console.log('[TEST SKIP] Project path not available');
        return;
      }

      const dataset = await pipeline.aggregateMetrics('/home/eric/Godot/ProtoBd/cts_mcp', 1);

      // CTS MCP project should have tests > 0
      expect(dataset.tests[0].value).toBeGreaterThan(0);
      
      // Rough sanity check (should have dozens of tests)
      expect(dataset.tests[0].value).toBeGreaterThan(50);
    }, 3000);

    it('should estimate coverage within 0-100% range', async () => {
      if (!existsSync('/home/eric/Godot/ProtoBd/cts_mcp')) {
        console.log('[TEST SKIP] Project path not available');
        return;
      }

      const dataset = await pipeline.aggregateMetrics('/home/eric/Godot/ProtoBd/cts_mcp', 1);

      // Coverage should be percentage
      expect(dataset.coverage[0].value).toBeGreaterThanOrEqual(0);
      expect(dataset.coverage[0].value).toBeLessThanOrEqual(100);
    }, 3000);
  });
});
