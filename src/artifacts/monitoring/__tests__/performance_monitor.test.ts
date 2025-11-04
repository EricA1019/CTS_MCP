/**
 * Performance Monitor Tests
 */

import { PerformanceMonitor } from '../performance_monitor';
import type { PerformanceBaseline, DegradationAlert } from '../types';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  describe('monitorOperation() - async', () => {
    it('should monitor async operation and return result', async () => {
      const result = await monitor.monitorOperation('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 42;
      });

      expect(result).toBe(42);

      const metrics = monitor.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operation).toBe('test');
      expect(metrics[0].duration).toBeGreaterThan(9);
      expect(metrics[0].timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should track memory delta', async () => {
      await monitor.monitorOperation('memory_test', async () => {
        const arr = new Array(1000).fill(0);
        return arr.length;
      });

      const metrics = monitor.getMetrics();
      expect(metrics[0].memoryDelta).toBeDefined();
    });

    it('should handle operation errors', async () => {
      await expect(
        monitor.monitorOperation('error_test', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      const metrics = monitor.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].error).toBe('Test error');
    });

    it('should track multiple operations', async () => {
      await monitor.monitorOperation('op1', async () => 1);
      await monitor.monitorOperation('op2', async () => 2);
      await monitor.monitorOperation('op1', async () => 3);

      const metrics = monitor.getMetrics();
      expect(metrics.length).toBe(3);

      const stats = monitor.getStats();
      expect(stats.totalOperations).toBe(3);
      expect(stats.operationCounts.get('op1')).toBe(2);
      expect(stats.operationCounts.get('op2')).toBe(1);
    });
  });

  describe('monitorSync() - sync', () => {
    it('should monitor sync operation and return result', () => {
      const result = monitor.monitorSync('sync_test', () => {
        return 'sync result';
      });

      expect(result).toBe('sync result');

      const metrics = monitor.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].operation).toBe('sync_test');
      expect(metrics[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle sync errors', () => {
      expect(() => {
        monitor.monitorSync('sync_error', () => {
          throw new Error('Sync error');
        });
      }).toThrow('Sync error');

      const metrics = monitor.getMetrics();
      expect(metrics[0].error).toBe('Sync error');
    });
  });

  describe('setBaseline() and getBaselines()', () => {
    it('should set and retrieve baseline', () => {
      const baseline: PerformanceBaseline = {
        operation: 'test',
        avgDuration: 100,
        stdDuration: 10,
        avgMemory: 1000,
        sampleCount: 10,
        baselineStart: Date.now() - 10000,
        baselineEnd: Date.now(),
      };

      monitor.setBaseline('test', baseline);

      const baselines = monitor.getBaselines();
      expect(baselines.get('test')).toEqual(baseline);
    });

    it('should allow multiple baselines', () => {
      monitor.setBaseline('op1', {
        operation: 'op1',
        avgDuration: 50,
        stdDuration: 5,
        avgMemory: 500,
        sampleCount: 10,
        baselineStart: Date.now(),
        baselineEnd: Date.now(),
      });

      monitor.setBaseline('op2', {
        operation: 'op2',
        avgDuration: 100,
        stdDuration: 10,
        avgMemory: 1000,
        sampleCount: 10,
        baselineStart: Date.now(),
        baselineEnd: Date.now(),
      });

      const baselines = monitor.getBaselines();
      expect(baselines.size).toBe(2);
    });
  });

  describe('calculateBaseline()', () => {
    it('should calculate baseline from metrics', async () => {
      // Create 10 metrics with known durations
      for (let i = 0; i < 10; i++) {
        await monitor.monitorOperation('calc_test', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      const baseline = monitor.calculateBaseline('calc_test', 10);

      expect(baseline).not.toBeNull();
      expect(baseline!.operation).toBe('calc_test');
      expect(baseline!.avgDuration).toBeGreaterThan(9);
      expect(baseline!.sampleCount).toBe(10);
      expect(baseline!.stdDuration).toBeGreaterThanOrEqual(0);
    });

    it('should return null for insufficient samples', () => {
      monitor.monitorSync('few_samples', () => 1);
      monitor.monitorSync('few_samples', () => 2);

      const baseline = monitor.calculateBaseline('few_samples');

      expect(baseline).toBeNull(); // Need at least 3 samples
    });

    it('should exclude error metrics from baseline', async () => {
      // Add some successful metrics
      await monitor.monitorOperation('mixed', async () => 1);
      await monitor.monitorOperation('mixed', async () => 2);

      // Add error metric
      try {
        await monitor.monitorOperation('mixed', async () => {
          throw new Error('Error');
        });
      } catch {}

      // Add more successful
      await monitor.monitorOperation('mixed', async () => 3);

      const baseline = monitor.calculateBaseline('mixed');

      expect(baseline).not.toBeNull();
      expect(baseline!.sampleCount).toBe(3); // Only successful ones
    });
  });

  describe('Degradation Detection', () => {
    it('should detect performance degradation >20%', async () => {
      // Set baseline at 100ms
      monitor.setBaseline('degrade_test', {
        operation: 'degrade_test',
        avgDuration: 100,
        stdDuration: 10,
        avgMemory: 1000,
        sampleCount: 10,
        baselineStart: Date.now() - 10000,
        baselineEnd: Date.now(),
      });

      // Spy on console.warn to capture alert
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Run operation that takes 130ms (30% degradation)
      await monitor.monitorOperation('degrade_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 130));
      });

      // Should trigger alert
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance Alert')
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('degraded by')
      );

      const stats = monitor.getStats();
      expect(stats.alertsGenerated).toBe(1);

      warnSpy.mockRestore();
    });

    it('should not alert for degradation <20%', async () => {
      monitor.setBaseline('no_alert_test', {
        operation: 'no_alert_test',
        avgDuration: 100,
        stdDuration: 10,
        avgMemory: 1000,
        sampleCount: 10,
        baselineStart: Date.now(),
        baselineEnd: Date.now(),
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Run operation that takes 110ms (10% degradation - below threshold)
      await monitor.monitorOperation('no_alert_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 110));
      });

      // Should NOT trigger alert
      expect(warnSpy).not.toHaveBeenCalled();

      const stats = monitor.getStats();
      expect(stats.alertsGenerated).toBe(0);

      warnSpy.mockRestore();
    });

    it('should categorize severity correctly', async () => {
      monitor.setBaseline('severity_test', {
        operation: 'severity_test',
        avgDuration: 100,
        stdDuration: 10,
        avgMemory: 1000,
        sampleCount: 10,
        baselineStart: Date.now(),
        baselineEnd: Date.now(),
      });

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Warning severity (25% degradation)
      await monitor.monitorOperation('severity_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 125));
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️')
      );

      warnSpy.mockClear();

      // Critical severity (60% degradation)
      await monitor.monitorOperation('severity_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 160));
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔴')
      );

      warnSpy.mockRestore();
    });

    it('should auto-calculate baseline when missing', async () => {
      // Run 10 operations without setting baseline
      for (let i = 0; i < 10; i++) {
        await monitor.monitorOperation('auto_baseline', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      // Baseline should be calculated
      const baselines = monitor.getBaselines();
      expect(baselines.has('auto_baseline')).toBe(true);
    });
  });

  describe('getMetricsForOperation()', () => {
    it('should filter metrics by operation', async () => {
      await monitor.monitorOperation('op1', async () => 1);
      await monitor.monitorOperation('op2', async () => 2);
      await monitor.monitorOperation('op1', async () => 3);

      const op1Metrics = monitor.getMetricsForOperation('op1');
      expect(op1Metrics.length).toBe(2);
      expect(op1Metrics.every(m => m.operation === 'op1')).toBe(true);
    });

    it('should return empty array for unknown operation', () => {
      const metrics = monitor.getMetricsForOperation('unknown');
      expect(metrics).toEqual([]);
    });
  });

  describe('getStats()', () => {
    it('should track monitoring overhead', async () => {
      await monitor.monitorOperation('overhead_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const stats = monitor.getStats();

      expect(stats.totalOperations).toBe(1);
      expect(stats.totalOverhead).toBeGreaterThan(0);
      expect(stats.avgOverhead).toBe(stats.totalOverhead);
    });

    it('should calculate average overhead correctly', async () => {
      await monitor.monitorOperation('test', async () => 1);
      await monitor.monitorOperation('test', async () => 2);
      await monitor.monitorOperation('test', async () => 3);

      const stats = monitor.getStats();

      expect(stats.totalOperations).toBe(3);
      expect(stats.avgOverhead).toBe(stats.totalOverhead / 3);
    });
  });

  describe('reset()', () => {
    it('should clear all metrics and baselines', async () => {
      await monitor.monitorOperation('test', async () => 1);
      monitor.setBaseline('test', {
        operation: 'test',
        avgDuration: 100,
        stdDuration: 10,
        avgMemory: 1000,
        sampleCount: 10,
        baselineStart: Date.now(),
        baselineEnd: Date.now(),
      });

      monitor.reset();

      expect(monitor.getMetrics()).toEqual([]);
      expect(monitor.getBaselines().size).toBe(0);

      const stats = monitor.getStats();
      expect(stats.totalOperations).toBe(0);
      expect(stats.totalOverhead).toBe(0);
      expect(stats.alertsGenerated).toBe(0);
    });
  });

  describe('exportMetrics()', () => {
    it('should export metrics as JSON', async () => {
      await monitor.monitorOperation('export_test', async () => 1);
      monitor.setBaseline('export_test', {
        operation: 'export_test',
        avgDuration: 100,
        stdDuration: 10,
        avgMemory: 1000,
        sampleCount: 10,
        baselineStart: Date.now(),
        baselineEnd: Date.now(),
      });

      const exported = monitor.exportMetrics();
      const data = JSON.parse(exported);

      expect(data.metrics).toBeDefined();
      expect(data.baselines).toBeDefined();
      expect(data.stats).toBeDefined();
      expect(Array.isArray(data.metrics)).toBe(true);
      expect(Array.isArray(data.baselines)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should have minimal overhead (<50ms per operation)', async () => {
      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await monitor.monitorOperation('perf_test', async () => {
          // No-op operation
        });
      }

      const totalTime = performance.now() - startTime;
      const avgTimePerOp = totalTime / iterations;

      // Average time should be low (operation is no-op + monitoring overhead)
      expect(avgTimePerOp).toBeLessThan(10); // Very generous - should be much less

      const stats = monitor.getStats();
      expect(stats.avgOverhead).toBeLessThan(50); // Per task requirement
    });

    it('should limit metrics storage to 1000 entries', async () => {
      // Add 1500 metrics
      for (let i = 0; i < 1500; i++) {
        monitor.monitorSync('storage_test', () => i);
      }

      const metrics = monitor.getMetrics();
      expect(metrics.length).toBe(1000); // Should be trimmed to 1000
    });
  });
});
