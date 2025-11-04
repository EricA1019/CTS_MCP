/**
 * Structured Logger for MCP Server
 *
 * Provides diagnostic logging with configurable levels
 * Includes request/response tracing for debugging
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
interface LogContext {
    requestId?: string | number;
    method?: string;
    toolName?: string;
    duration?: number;
    [key: string]: unknown;
}
export declare class Logger {
    private level;
    private namespace;
    constructor(namespace?: string, level?: LogLevel);
    /**
     * Get log level from LOG_LEVEL environment variable
     */
    private getLogLevelFromEnv;
    /**
     * Format log message with timestamp and context
     */
    private format;
    /**
     * Log at ERROR level (always shown)
     */
    error(message: string, error?: Error | LogContext, context?: LogContext): void;
    /**
     * Log at WARN level
     */
    warn(message: string, context?: LogContext): void;
    /**
     * Log at INFO level
     */
    info(message: string, context?: LogContext): void;
    /**
     * Log at DEBUG level (most verbose)
     */
    debug(message: string, context?: LogContext): void;
    /**
     * Trace incoming MCP request
     */
    traceRequest(requestId: string | number, method: string, params?: unknown): void;
    /**
     * Trace outgoing MCP response
     */
    traceResponse(requestId: string | number, duration: number, success: boolean): void;
    /**
     * Log tool execution start
     */
    toolStart(toolName: string, params?: unknown): void;
    /**
     * Log tool execution completion
     */
    toolComplete(toolName: string, duration: number, success: boolean): void;
    /**
     * Log tool execution error
     */
    toolError(toolName: string, error: Error, duration?: number): void;
    /**
     * Create child logger with different namespace
     */
    child(namespace: string): Logger;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map