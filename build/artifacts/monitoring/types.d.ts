/**
 * Performance Monitoring Types
 *
 * Type definitions for real-time performance monitoring and degradation alerts.
 */
/**
 * Performance metric for a single operation.
 */
export interface PerformanceMetric {
    /** Operation name (e.g., 'scan', 'graph_build', 'detection') */
    operation: string;
    /** Duration in milliseconds */
    duration: number;
    /** Memory delta in bytes (heap used before vs after) */
    memoryDelta: number;
    /** Timestamp when operation completed */
    timestamp: number;
    /** Optional error if operation failed */
    error?: string;
}
/**
 * Performance baseline calculated from historical data.
 */
export interface PerformanceBaseline {
    /** Operation name */
    operation: string;
    /** Average duration from baseline period (ms) */
    avgDuration: number;
    /** Standard deviation of duration */
    stdDuration: number;
    /** Average memory delta from baseline period (bytes) */
    avgMemory: number;
    /** Number of samples in baseline */
    sampleCount: number;
    /** Baseline period start timestamp */
    baselineStart: number;
    /** Baseline period end timestamp */
    baselineEnd: number;
}
/**
 * Performance degradation alert.
 */
export interface DegradationAlert {
    /** Operation that degraded */
    operation: string;
    /** Baseline performance (ms) */
    baseline: number;
    /** Current performance (ms) */
    current: number;
    /** Degradation percentage (e.g., 25.5 for 25.5% slower) */
    degradation: number;
    /** Timestamp of alert */
    timestamp: number;
    /** Alert severity: 'warning' (20-50%), 'critical' (>50%) */
    severity: 'warning' | 'critical';
}
/**
 * Performance monitoring statistics.
 */
export interface PerformanceStats {
    /** Total operations monitored */
    totalOperations: number;
    /** Operations by type */
    operationCounts: Map<string, number>;
    /** Total monitoring overhead (ms) */
    totalOverhead: number;
    /** Average overhead per operation (ms) */
    avgOverhead: number;
    /** Alerts generated */
    alertsGenerated: number;
}
//# sourceMappingURL=types.d.ts.map