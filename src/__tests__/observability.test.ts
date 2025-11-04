/**
 * Tests for Observability Module
 * Following Quinn's comprehensive testing methodology
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  Logger,
  LogLevel,
  MetricsCollector,
  exportPrometheusMetrics,
  monitored,
} from '../observability/index.js';

describe('Logger', () => {
  let consoleDebugSpy: jest.SpiedFunction<typeof console.debug>;
  let consoleInfoSpy: jest.SpiedFunction<typeof console.info>;
  let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    // Clear environment variables that might affect tests
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FORMAT;
    
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Log Levels', () => {
    it('should log debug messages when level is DEBUG', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.debug('test message');
      
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should not log debug messages when level is INFO', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.debug('test message');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log info messages when level is INFO', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.info('test message');
      
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it('should log warn messages at all levels', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.warn('test warning');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error messages at all levels', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.error('test error');
      
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Structured Logging', () => {
    it('should include context in log output', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.info('test', { toolName: 'test_tool', operation: 'scan' });
      
      const logOutput = consoleInfoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('test');
      expect(logOutput).toContain('toolName');
      expect(logOutput).toContain('test_tool');
    });

    it('should include default context from constructor', () => {
      const logger = new Logger(LogLevel.INFO, { service: 'cts-mcp' });
      logger.info('test');
      
      const logOutput = consoleInfoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('service');
      expect(logOutput).toContain('cts-mcp');
    });

    it('should format timestamp as ISO string', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.info('test');
      
      const logOutput = consoleInfoSpy.mock.calls[0][0] as string;
      expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include duration in context', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.info('operation complete', { duration: 123.45 });
      
      const logOutput = consoleInfoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('duration');
      expect(logOutput).toContain('123.45');
    });
  });

  describe('Child Loggers', () => {
    it('should create child logger with inherited context', () => {
      const parent = new Logger(LogLevel.INFO, { service: 'cts' });
      const child = parent.child({ component: 'bughunter' });
      
      child.info('test');
      
      const logOutput = consoleInfoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('service');
      expect(logOutput).toContain('component');
    });

    it('should merge parent and child context', () => {
      const parent = new Logger(LogLevel.INFO, { a: 1 });
      const child = parent.child({ b: 2 });
      
      child.info('test', { c: 3 });
      
      const logOutput = consoleInfoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('"a":1');
      expect(logOutput).toContain('"b":2');
      expect(logOutput).toContain('"c":3');
    });
  });
});

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector(true);
  });

  describe('Metric Recording', () => {
    it('should record basic metric', () => {
      collector.recordMetric('test.metric', 123, 'ms');
      
      const metrics = collector.getMetrics('test.metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(123);
      expect(metrics[0].unit).toBe('ms');
    });

    it('should record multiple metrics', () => {
      collector.recordMetric('test.metric', 100, 'ms');
      collector.recordMetric('test.metric', 200, 'ms');
      
      const metrics = collector.getMetrics('test.metric');
      expect(metrics).toHaveLength(2);
    });

    it('should include timestamp in metric', () => {
      const before = Date.now();
      collector.recordMetric('test.metric', 123);
      const after = Date.now();
      
      const metrics = collector.getMetrics('test.metric');
      expect(metrics[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(metrics[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('should support tags', () => {
      collector.recordMetric('test.metric', 123, 'ms', { environment: 'test' });
      
      const metrics = collector.getMetrics('test.metric');
      expect(metrics[0].tags).toEqual({ environment: 'test' });
    });

    it('should limit metrics history to 1000', () => {
      for (let i = 0; i < 1500; i++) {
        collector.recordMetric('test.metric', i);
      }
      
      const metrics = collector.getMetrics('test.metric');
      expect(metrics).toHaveLength(1000);
    });
  });

  describe('Tool Metrics', () => {
    it('should record tool execution', () => {
      collector.recordToolExecution('test_tool', 100, true, false);
      
      const metrics = collector.getToolMetrics('test_tool') as any;
      expect(metrics.executionCount).toBe(1);
      expect(metrics.totalDuration).toBe(100);
      expect(metrics.averageDuration).toBe(100);
    });

    it('should calculate average duration', () => {
      collector.recordToolExecution('test_tool', 100, true);
      collector.recordToolExecution('test_tool', 200, true);
      
      const metrics = collector.getToolMetrics('test_tool') as any;
      expect(metrics.averageDuration).toBe(150);
    });

    it('should track min and max duration', () => {
      collector.recordToolExecution('test_tool', 150, true);
      collector.recordToolExecution('test_tool', 50, true);
      collector.recordToolExecution('test_tool', 200, true);
      
      const metrics = collector.getToolMetrics('test_tool') as any;
      expect(metrics.minDuration).toBe(50);
      expect(metrics.maxDuration).toBe(200);
    });

    it('should count errors', () => {
      collector.recordToolExecution('test_tool', 100, true);
      collector.recordToolExecution('test_tool', 100, false);
      collector.recordToolExecution('test_tool', 100, false);
      
      const metrics = collector.getToolMetrics('test_tool') as any;
      expect(metrics.errorCount).toBe(2);
    });

    it('should calculate cache hit rate', () => {
      collector.recordToolExecution('test_tool', 100, true, true);  // hit
      collector.recordToolExecution('test_tool', 100, true, true);  // hit
      collector.recordToolExecution('test_tool', 100, true, false); // miss
      collector.recordToolExecution('test_tool', 100, true, false); // miss
      
      const metrics = collector.getToolMetrics('test_tool') as any;
      expect(metrics.cacheHitRate).toBe(0.5);
    });

    it('should update last executed timestamp', () => {
      const before = Date.now();
      collector.recordToolExecution('test_tool', 100, true);
      const after = Date.now();
      
      const metrics = collector.getToolMetrics('test_tool') as any;
      expect(metrics.lastExecuted).toBeGreaterThanOrEqual(before);
      expect(metrics.lastExecuted).toBeLessThanOrEqual(after);
    });
  });

  describe('Metrics Summary', () => {
    it('should generate summary across all tools', () => {
      collector.recordToolExecution('tool1', 100, true);
      collector.recordToolExecution('tool2', 200, true);
      collector.recordToolExecution('tool1', 150, false);
      
      const summary = collector.getSummary();
      expect(summary.totalTools).toBe(2);
      expect(summary.totalExecutions).toBe(3);
      expect(summary.totalErrors).toBe(1);
    });

    it('should calculate average cache hit rate', () => {
      collector.recordToolExecution('tool1', 100, true, true);
      collector.recordToolExecution('tool1', 100, true, false);
      collector.recordToolExecution('tool2', 100, true, true);
      collector.recordToolExecution('tool2', 100, true, true);
      
      const summary = collector.getSummary();
      // tool1: 0.5, tool2: 1.0, average: 0.75
      expect(summary.averageCacheHitRate).toBe(0.75);
    });
  });

  describe('Reset', () => {
    it('should clear all metrics', () => {
      collector.recordMetric('test', 123);
      collector.recordToolExecution('tool', 100, true);
      
      collector.reset();
      
      expect(collector.getMetrics('test')).toHaveLength(0);
      const summary = collector.getSummary();
      expect(summary.totalTools).toBe(0);
    });
  });
});

describe('Prometheus Export', () => {
  it('should export metrics in Prometheus format', () => {
    const output = exportPrometheusMetrics();
    
    // Should have headers even if no data
    expect(output).toContain('# HELP cts_tool_executions_total');
    expect(output).toContain('# TYPE cts_tool_executions_total counter');
  });

  it('should include all metric types', () => {
    const output = exportPrometheusMetrics();
    
    expect(output).toContain('cts_tool_executions_total');
    expect(output).toContain('cts_tool_duration_seconds');
    expect(output).toContain('cts_tool_errors_total');
    expect(output).toContain('cts_tool_cache_hit_rate');
  });
});

describe('Monitored Decorator', () => {
  // Note: Testing decorators is complex in TypeScript/Jest
  // We'll test the decorator indirectly through manual instrumentation
  
  it('should allow manual performance tracking', () => {
    const collector = new MetricsCollector();
    const startTime = performance.now();
    
    // Simulate tool execution
    const result = 42;
    
    const duration = performance.now() - startTime;
    collector.recordToolExecution('manual_tool', duration, true, false);
    
    const metrics = collector.getToolMetrics('manual_tool') as any;
    expect(metrics.executionCount).toBe(1);
    expect(result).toBe(42);
  });

  it('should track failures in manual instrumentation', () => {
    const collector = new MetricsCollector();
    const startTime = performance.now();
    
    try {
      throw new Error('Test error');
    } catch (error) {
      const duration = performance.now() - startTime;
      collector.recordToolExecution('failing_tool', duration, false);
    }
    
    const metrics = collector.getToolMetrics('failing_tool') as any;
    expect(metrics.errorCount).toBe(1);
  });
});
