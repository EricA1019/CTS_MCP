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
import type { PerformanceMetric, PerformanceBaseline, PerformanceStats } from './types.js';
export declare class PerformanceMonitor {
    private metrics;
    private baselines;
    private stats;
    /**
     * Monitor an asynchronous operation.
     * Tracks duration, memory usage, and checks for performance degradation.
     *
     * @param operation - Operation name (e.g., 'scan', 'graph_build')
     * @param fn - Async function to monitor
     * @returns Result from the monitored function
     */
    monitorOperation<T>(operation: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Monitor a synchronous operation.
     * Tracks duration and memory usage.
     *
     * @param operation - Operation name
     * @param fn - Sync function to monitor
     * @returns Result from the monitored function
     */
    monitorSync<T>(operation: string, fn: () => T): T;
    /**
     * Set performance baseline for an operation.
     * Used to compare current performance against historical data.
     */
    setBaseline(operation: string, baseline: PerformanceBaseline): void;
    /**
     * Calculate baseline from historical metrics.
     * Takes last N metrics for the operation and computes average/stddev.
     */
    calculateBaseline(operation: string, sampleCount?: number): PerformanceBaseline | null;
    /**
     * Check for performance degradation (async version).
     */
    private checkDegradation;
    /**
     * Check for performance degradation (sync version).
     */
    private checkDegradationSync;
    /**
     * Log performance metric.
     */
    private logMetric;
    /**
     * Emit degradation alert.
     * In real implementation, this would integrate with alerting system.
     */
    private emitAlert;
    /**
     * Get all recorded metrics.
     */
    getMetrics(): PerformanceMetric[];
    /**
     * Get metrics for specific operation.
     */
    getMetricsForOperation(operation: string): PerformanceMetric[];
    /**
     * Get current baselines.
     */
    getBaselines(): Map<string, PerformanceBaseline>;
    /**
     * Get monitoring statistics.
     */
    getStats(): PerformanceStats;
    /**
     * Reset all metrics and statistics.
     */
    reset(): void;
    /**
     * Export metrics to JSON (for persistence/analysis).
     */
    exportMetrics(): string;
}
//# sourceMappingURL=performance_monitor.d.ts.map