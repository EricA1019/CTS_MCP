/**
 * Structured Logger for MCP Server
 * 
 * Provides diagnostic logging with configurable levels
 * Includes request/response tracing for debugging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogContext {
  requestId?: string | number;
  method?: string;
  toolName?: string;
  duration?: number;
  [key: string]: unknown;
}

export class Logger {
  private level: LogLevel;
  private namespace: string;
  
  constructor(namespace: string = 'CTS MCP', level?: LogLevel) {
    this.namespace = namespace;
    this.level = level ?? this.getLogLevelFromEnv();
  }
  
  /**
   * Get log level from LOG_LEVEL environment variable
   */
  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return LogLevel.INFO; // Default to INFO
    }
  }
  
  /**
   * Format log message with timestamp and context
   */
  private format(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${this.namespace}] [${level}] ${message}${contextStr}`;
  }
  
  /**
   * Log at ERROR level (always shown)
   */
  error(message: string, error?: Error | LogContext, context?: LogContext) {
    if (this.level < LogLevel.ERROR) return;
    
    const ctx = error instanceof Error 
      ? { ...context, error: error.message, stack: error.stack }
      : error;
    
    console.error(this.format('ERROR', message, ctx));
  }
  
  /**
   * Log at WARN level
   */
  warn(message: string, context?: LogContext) {
    if (this.level < LogLevel.WARN) return;
    console.warn(this.format('WARN', message, context));
  }
  
  /**
   * Log at INFO level
   */
  info(message: string, context?: LogContext) {
    if (this.level < LogLevel.INFO) return;
    console.error(this.format('INFO', message, context));
  }
  
  /**
   * Log at DEBUG level (most verbose)
   */
  debug(message: string, context?: LogContext) {
    if (this.level < LogLevel.DEBUG) return;
    console.error(this.format('DEBUG', message, context));
  }
  
  /**
   * Trace incoming MCP request
   */
  traceRequest(requestId: string | number, method: string, params?: unknown) {
    this.debug('Incoming request', {
      requestId,
      method,
      params: params ? JSON.stringify(params).substring(0, 200) : undefined,
    });
  }
  
  /**
   * Trace outgoing MCP response
   */
  traceResponse(requestId: string | number, duration: number, success: boolean) {
    this.debug('Outgoing response', {
      requestId,
      duration,
      success,
    });
  }
  
  /**
   * Log tool execution start
   */
  toolStart(toolName: string, params?: unknown) {
    this.info(`Tool execution started: ${toolName}`, {
      toolName,
      params: params ? JSON.stringify(params).substring(0, 100) : undefined,
    });
  }
  
  /**
   * Log tool execution completion
   */
  toolComplete(toolName: string, duration: number, success: boolean) {
    const level = success ? 'info' : 'warn';
    this[level](`Tool execution ${success ? 'completed' : 'failed'}: ${toolName}`, {
      toolName,
      duration,
      success,
    });
  }
  
  /**
   * Log tool execution error
   */
  toolError(toolName: string, error: Error, duration?: number) {
    this.error(`Tool execution error: ${toolName}`, error, {
      toolName,
      duration,
    });
  }
  
  /**
   * Create child logger with different namespace
   */
  child(namespace: string): Logger {
    return new Logger(`${this.namespace}:${namespace}`, this.level);
  }
}

// Global logger instance
export const logger = new Logger();
