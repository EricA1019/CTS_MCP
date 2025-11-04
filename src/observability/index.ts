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

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
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
export class Logger {
  private minLevel: LogLevel;
  private context: Record<string, any>;

  constructor(minLevel: LogLevel = LogLevel.INFO, context: Record<string, any> = {}) {
    this.minLevel = this.getLogLevelFromEnv() || minLevel;
    this.context = context;
  }

  private getLogLevelFromEnv(): LogLevel | null {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    if (level && Object.values(LogLevel).includes(level as LogLevel)) {
      return level as LogLevel;
    }
    return null;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    const logData = {
      timestamp,
      level,
      message,
      ...mergedContext,
    };

    // JSON format for machine parsing
    if (process.env.LOG_FORMAT === 'json') {
      return JSON.stringify(logData);
    }

    // Human-readable format with context
    const hasContext = Object.keys(mergedContext).length > 0;
    const contextStr = hasContext ? ` ${JSON.stringify(mergedContext)}` : '';
    
    return `[${timestamp}] ${level.toUpperCase()} ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatLog(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatLog(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatLog(LogLevel.WARN, message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatLog(LogLevel.ERROR, message, context));
    }
  }

  child(context: Record<string, any>): Logger {
    return new Logger(this.minLevel, { ...this.context, ...context });
  }
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();
  private toolMetrics: Map<string, ToolMetrics> = new Map();
  private enabled: boolean;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  recordMetric(name: string, value: number, unit: string = '', tags?: Record<string, string>): void {
    if (!this.enabled) return;

    const metric: MetricData = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(metric);

    // Keep only last 1000 metrics per name to prevent memory leaks
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  recordToolExecution(
    toolName: string,
    duration: number,
    success: boolean,
    cacheHit: boolean = false
  ): void {
    if (!this.enabled) return;

    let metrics = this.toolMetrics.get(toolName);
    if (!metrics) {
      metrics = {
        toolName,
        executionCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0,
        cacheHitRate: 0,
        lastExecuted: 0,
      };
      this.toolMetrics.set(toolName, metrics);
    }

    metrics.executionCount++;
    metrics.totalDuration += duration;
    metrics.averageDuration = metrics.totalDuration / metrics.executionCount;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    if (!success) metrics.errorCount++;
    metrics.lastExecuted = Date.now();

    // Update cache hit rate
    const cacheHits = cacheHit ? 1 : 0;
    const totalRequests = metrics.executionCount;
    metrics.cacheHitRate = (metrics.cacheHitRate * (totalRequests - 1) + cacheHits) / totalRequests;

    // Record as time-series metric
    this.recordMetric(`tool.${toolName}.duration`, duration, 'ms', {
      success: success.toString(),
      cacheHit: cacheHit.toString(),
    });
  }

  getMetrics(name: string): MetricData[] {
    return this.metrics.get(name) || [];
  }

  getToolMetrics(toolName?: string): ToolMetrics | ToolMetrics[] {
    if (toolName) {
      return this.toolMetrics.get(toolName) || this.createEmptyToolMetrics(toolName);
    }
    return Array.from(this.toolMetrics.values());
  }

  getAllMetrics(): Record<string, MetricData[]> {
    const result: Record<string, MetricData[]> = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  getSummary(): {
    totalTools: number;
    totalExecutions: number;
    totalErrors: number;
    averageCacheHitRate: number;
    toolSummaries: ToolMetrics[];
  } {
    const tools = Array.from(this.toolMetrics.values());
    const totalExecutions = tools.reduce((sum, t) => sum + t.executionCount, 0);
    const totalErrors = tools.reduce((sum, t) => sum + t.errorCount, 0);
    const avgCacheHitRate = tools.reduce((sum, t) => sum + t.cacheHitRate, 0) / (tools.length || 1);

    return {
      totalTools: tools.length,
      totalExecutions,
      totalErrors,
      averageCacheHitRate: avgCacheHitRate,
      toolSummaries: tools,
    };
  }

  reset(): void {
    this.metrics.clear();
    this.toolMetrics.clear();
  }

  private createEmptyToolMetrics(toolName: string): ToolMetrics {
    return {
      toolName,
      executionCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      errorCount: 0,
      cacheHitRate: 0,
      lastExecuted: 0,
    };
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  { service: 'cts-mcp-server', version: '3.0.0' }
);

/**
 * Global metrics collector
 */
export const metrics = new MetricsCollector(true);

/**
 * Performance monitoring decorator
 */
export function monitored(toolName: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      const log = logger.child({ toolName, operation: propertyKey });

      log.debug(`Starting ${propertyKey}`, { args: args.length });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;

        metrics.recordToolExecution(toolName, duration, true);
        log.info(`Completed ${propertyKey}`, { duration });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        metrics.recordToolExecution(toolName, duration, false);
        log.error(`Failed ${propertyKey}`, {
          duration,
          error: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Export metrics in Prometheus format
 */
export function exportPrometheusMetrics(): string {
  const summary = metrics.getSummary();
  const lines: string[] = [];

  // Help and type declarations
  lines.push('# HELP cts_tool_executions_total Total number of tool executions');
  lines.push('# TYPE cts_tool_executions_total counter');
  lines.push('# HELP cts_tool_duration_seconds Tool execution duration in seconds');
  lines.push('# TYPE cts_tool_duration_seconds gauge');
  lines.push('# HELP cts_tool_errors_total Total number of tool errors');
  lines.push('# TYPE cts_tool_errors_total counter');
  lines.push('# HELP cts_tool_cache_hit_rate Cache hit rate for tool');
  lines.push('# TYPE cts_tool_cache_hit_rate gauge');

  // Metrics for each tool
  summary.toolSummaries.forEach(tool => {
    lines.push(`cts_tool_executions_total{tool="${tool.toolName}"} ${tool.executionCount}`);
    lines.push(`cts_tool_duration_seconds{tool="${tool.toolName}",stat="avg"} ${(tool.averageDuration / 1000).toFixed(6)}`);
    lines.push(`cts_tool_duration_seconds{tool="${tool.toolName}",stat="min"} ${(tool.minDuration / 1000).toFixed(6)}`);
    lines.push(`cts_tool_duration_seconds{tool="${tool.toolName}",stat="max"} ${(tool.maxDuration / 1000).toFixed(6)}`);
    lines.push(`cts_tool_errors_total{tool="${tool.toolName}"} ${tool.errorCount}`);
    lines.push(`cts_tool_cache_hit_rate{tool="${tool.toolName}"} ${tool.cacheHitRate.toFixed(4)}`);
  });

  return lines.join('\n');
}
