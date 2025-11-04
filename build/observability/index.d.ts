/**
 * Observability Module - Structured Logging and Metrics
 *
 * Provides:
 * - Structured logging with severity levels
 * - Performance metrics tracking
 * - Tool execution monitoring
 * - Cache statistics logging
 * - Error tracking and reporting
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export interface LogContext {
    toolName?: string;
    operation?: string;
    duration?: number;
    cacheHit?: boolean;
    errorCode?: string;
    [key: string]: any;
}
export interface MetricData {
    name: string;
    value: number;
    unit: string;
    timestamp: number;
    tags?: Record<string, string>;
}
export interface ToolMetrics {
    toolName: string;
    executionCount: number;
    totalDuration: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    errorCount: number;
    cacheHitRate: number;
    lastExecuted: number;
}
/**
 * Logger with structured output
 */
export declare class Logger {
    private minLevel;
    private context;
    constructor(minLevel?: LogLevel, context?: Record<string, any>);
    private getLogLevelFromEnv;
    private shouldLog;
    private formatLog;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    child(context: Record<string, any>): Logger;
}
/**
 * Metrics collector
 */
export declare class MetricsCollector {
    private metrics;
    private toolMetrics;
    private enabled;
    constructor(enabled?: boolean);
    recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>): void;
    recordToolExecution(toolName: string, duration: number, success: boolean, cacheHit?: boolean): void;
    getMetrics(name: string): MetricData[];
    getToolMetrics(toolName?: string): ToolMetrics | ToolMetrics[];
    getAllMetrics(): Record<string, MetricData[]>;
    getSummary(): {
        totalTools: number;
        totalExecutions: number;
        totalErrors: number;
        averageCacheHitRate: number;
        toolSummaries: ToolMetrics[];
    };
    reset(): void;
    private createEmptyToolMetrics;
}
/**
 * Global logger instance
 */
export declare const logger: Logger;
/**
 * Global metrics collector
 */
export declare const metrics: MetricsCollector;
/**
 * Performance monitoring decorator
 */
export declare function monitored(toolName: string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Export metrics in Prometheus format
 */
export declare function exportPrometheusMetrics(): string;
//# sourceMappingURL=index.d.ts.map