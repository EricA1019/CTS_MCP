/**
 * Performance Monitor
 * 
 * Real-time performance monitoring with degradation detection and alerting.
 * Wraps operations to track duration and memory usage, compares against
 * historical baselines, and emits alerts when performance degrades >20%.
 * 
 * Algorithm:
 * 1. Wrap operation with start/end timing and memory tracking
 * 2. Calculate duration and memory delta
 * 3. Compare against historical baseline (if available)
 * 4. Emit degradation alert if >20% slower
 * 5. Log metric for future baseline calculation
 */

import type {
  PerformanceMetric,
  PerformanceBaseline,
  DegradationAlert,
  PerformanceStats,
} from './types.js';

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private stats: PerformanceStats = {
    totalOperations: 0,
    operationCounts: new Map(),
    totalOverhead: 0,
    avgOverhead: 0,
    alertsGenerated: 0,
  };

  /**
   * Monitor an asynchronous operation.
   * Tracks duration, memory usage, and checks for performance degradation.
   * 
   * @param operation - Operation name (e.g., 'scan', 'graph_build')
   * @param fn - Async function to monitor
   * @returns Result from the monitored function
   */
  async monitorOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const monitorStart = performance.now();
    const startTime = performance.now();
    const startMem = process.memoryUsage().heapUsed;

    try {
      // Execute operation
      const result = await fn();

      // Calculate metrics
      const duration = performance.now() - startTime;
      const memoryDelta = process.memoryUsage().heapUsed - startMem;

      // Check for degradation
      await this.checkDegradation(operation, duration);

      // Log metric
      this.logMetric({
        operation,
        duration,
        memoryDelta,
        timestamp: Date.now(),
      });

      // Track overhead
      const overhead = performance.now() - monitorStart - duration;
      this.stats.totalOverhead += overhead;
      this.stats.totalOperations++;
      this.stats.avgOverhead = this.stats.totalOverhead / this.stats.totalOperations;

      return result;
    } catch (error) {
      // Log failed operation
      this.logMetric({
        operation,
        duration: performance.now() - startTime,
        memoryDelta: process.memoryUsage().heapUsed - startMem,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });

      console.error(`[Performance Monitor] Operation failed: ${operation}`, error);
      throw error;
    }
  }

  /**
   * Monitor a synchronous operation.
   * Tracks duration and memory usage.
   * 
   * @param operation - Operation name
   * @param fn - Sync function to monitor
   * @returns Result from the monitored function
   */
  monitorSync<T>(operation: string, fn: () => T): T {
    const monitorStart = performance.now();
    const startTime = performance.now();
    const startMem = process.memoryUsage().heapUsed;

    try {
      const result = fn();

      const duration = performance.now() - startTime;
      const memoryDelta = process.memoryUsage().heapUsed - startMem;

      // Check degradation (sync - no await)
      this.checkDegradationSync(operation, duration);

      this.logMetric({
        operation,
        duration,
        memoryDelta,
        timestamp: Date.now(),
      });

      const overhead = performance.now() - monitorStart - duration;
      this.stats.totalOverhead += overhead;
      this.stats.totalOperations++;
      this.stats.avgOverhead = this.stats.totalOverhead / this.stats.totalOperations;

      return result;
    } catch (error) {
      this.logMetric({
        operation,
        duration: performance.now() - startTime,
        memoryDelta: process.memoryUsage().heapUsed - startMem,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      });

      console.error(`[Performance Monitor] Operation failed: ${operation}`, error);
      throw error;
    }
  }

  /**
   * Set performance baseline for an operation.
   * Used to compare current performance against historical data.
   */
  setBaseline(operation: string, baseline: PerformanceBaseline): void {
    this.baselines.set(operation, baseline);
    console.log(`[Performance Monitor] Baseline set for ${operation}: ${baseline.avgDuration.toFixed(2)}ms (${baseline.sampleCount} samples)`);
  }

  /**
   * Calculate baseline from historical metrics.
   * Takes last N metrics for the operation and computes average/stddev.
   */
  calculateBaseline(operation: string, sampleCount: number = 10): PerformanceBaseline | null {
    const operationMetrics = this.metrics
      .filter(m => m.operation === operation && !m.error)
      .slice(-sampleCount);

    if (operationMetrics.length < 3) {
      // Not enough samples for reliable baseline
      return null;
    }

    const durations = operationMetrics.map(m => m.duration);
    const memories = operationMetrics.map(m => m.memoryDelta);

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    const stdDuration = Math.sqrt(variance);
    const avgMemory = memories.reduce((a, b) => a + b, 0) / memories.length;

    return {
      operation,
      avgDuration,
      stdDuration,
      avgMemory,
      sampleCount: operationMetrics.length,
      baselineStart: operationMetrics[0].timestamp,
      baselineEnd: operationMetrics[operationMetrics.length - 1].timestamp,
    };
  }

  /**
   * Check for performance degradation (async version).
   */
  private async checkDegradation(operation: string, currentDuration: number): Promise<void> {
    const baseline = this.baselines.get(operation);

    if (!baseline) {
      // No baseline yet - try to calculate from recent metrics
      const calculatedBaseline = this.calculateBaseline(operation);
      if (calculatedBaseline) {
        this.setBaseline(operation, calculatedBaseline);
        return; // Don't alert on first baseline calculation
      }
      return;
    }

    // Check if degradation exceeds threshold (20%)
    const degradationThreshold = 1.2;
    if (currentDuration > baseline.avgDuration * degradationThreshold) {
      const degradationPercent = ((currentDuration - baseline.avgDuration) / baseline.avgDuration) * 100;
      
      const severity: 'warning' | 'critical' = degradationPercent > 50 ? 'critical' : 'warning';

      const alert: DegradationAlert = {
        operation,
        baseline: baseline.avgDuration,
        current: currentDuration,
        degradation: degradationPercent,
        timestamp: Date.now(),
        severity,
      };

      this.emitAlert(alert);
      this.stats.alertsGenerated++;
    }
  }

  /**
   * Check for performance degradation (sync version).
   */
  private checkDegradationSync(operation: string, currentDuration: number): void {
    const baseline = this.baselines.get(operation);

    if (!baseline) {
      const calculatedBaseline = this.calculateBaseline(operation);
      if (calculatedBaseline) {
        this.setBaseline(operation, calculatedBaseline);
      }
      return;
    }

    const degradationThreshold = 1.2;
    if (currentDuration > baseline.avgDuration * degradationThreshold) {
      const degradationPercent = ((currentDuration - baseline.avgDuration) / baseline.avgDuration) * 100;
      
      const severity: 'warning' | 'critical' = degradationPercent > 50 ? 'critical' : 'warning';

      const alert: DegradationAlert = {
        operation,
        baseline: baseline.avgDuration,
        current: currentDuration,
        degradation: degradationPercent,
        timestamp: Date.now(),
        severity,
      };

      this.emitAlert(alert);
      this.stats.alertsGenerated++;
    }
  }

  /**
   * Log performance metric.
   */
  private logMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Update operation count
    const count = this.stats.operationCounts.get(metric.operation) || 0;
    this.stats.operationCounts.set(metric.operation, count + 1);

    // Keep only last 1000 metrics to avoid memory bloat
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Emit degradation alert.
   * In real implementation, this would integrate with alerting system.
   */
  private emitAlert(alert: DegradationAlert): void {
    const icon = alert.severity === 'critical' ? '🔴' : '⚠️';
    console.warn(`${icon} [Performance Alert] ${alert.operation} degraded by ${alert.degradation.toFixed(1)}%`);
    console.warn(`  Baseline: ${alert.baseline.toFixed(2)}ms`);
    console.warn(`  Current: ${alert.current.toFixed(2)}ms`);
  }

  /**
   * Get all recorded metrics.
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for specific operation.
   */
  getMetricsForOperation(operation: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operation === operation);
  }

  /**
   * Get current baselines.
   */
  getBaselines(): Map<string, PerformanceBaseline> {
    return new Map(this.baselines);
  }

  /**
   * Get monitoring statistics.
   */
  getStats(): PerformanceStats {
    return {
      ...this.stats,
      operationCounts: new Map(this.stats.operationCounts),
    };
  }

  /**
   * Reset all metrics and statistics.
   */
  reset(): void {
    this.metrics = [];
    this.baselines.clear();
    this.stats = {
      totalOperations: 0,
      operationCounts: new Map(),
      totalOverhead: 0,
      avgOverhead: 0,
      alertsGenerated: 0,
    };
  }

  /**
   * Export metrics to JSON (for persistence/analysis).
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      baselines: Array.from(this.baselines.entries()),
      stats: {
        ...this.stats,
        operationCounts: Array.from(this.stats.operationCounts.entries()),
      },
    }, null, 2);
  }
}
