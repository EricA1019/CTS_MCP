/**
 * Structured Logger for MCP Server
 *
 * Provides diagnostic logging with configurable levels
 * Includes request/response tracing for debugging
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export class Logger {
    level;
    namespace;
    constructor(namespace = 'CTS MCP', level) {
        this.namespace = namespace;
        this.level = level ?? this.getLogLevelFromEnv();
    }
    /**
     * Get log level from LOG_LEVEL environment variable
     */
    getLogLevelFromEnv() {
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
    format(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${this.namespace}] [${level}] ${message}${contextStr}`;
    }
    /**
     * Log at ERROR level (always shown)
     */
    error(message, error, context) {
        if (this.level < LogLevel.ERROR)
            return;
        const ctx = error instanceof Error
            ? { ...context, error: error.message, stack: error.stack }
            : error;
        console.error(this.format('ERROR', message, ctx));
    }
    /**
     * Log at WARN level
     */
    warn(message, context) {
        if (this.level < LogLevel.WARN)
            return;
        console.warn(this.format('WARN', message, context));
    }
    /**
     * Log at INFO level
     */
    info(message, context) {
        if (this.level < LogLevel.INFO)
            return;
        console.error(this.format('INFO', message, context));
    }
    /**
     * Log at DEBUG level (most verbose)
     */
    debug(message, context) {
        if (this.level < LogLevel.DEBUG)
            return;
        console.error(this.format('DEBUG', message, context));
    }
    /**
     * Trace incoming MCP request
     */
    traceRequest(requestId, method, params) {
        this.debug('Incoming request', {
            requestId,
            method,
            params: params ? JSON.stringify(params).substring(0, 200) : undefined,
        });
    }
    /**
     * Trace outgoing MCP response
     */
    traceResponse(requestId, duration, success) {
        this.debug('Outgoing response', {
            requestId,
            duration,
            success,
        });
    }
    /**
     * Log tool execution start
     */
    toolStart(toolName, params) {
        this.info(`Tool execution started: ${toolName}`, {
            toolName,
            params: params ? JSON.stringify(params).substring(0, 100) : undefined,
        });
    }
    /**
     * Log tool execution completion
     */
    toolComplete(toolName, duration, success) {
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
    toolError(toolName, error, duration) {
        this.error(`Tool execution error: ${toolName}`, error, {
            toolName,
            duration,
        });
    }
    /**
     * Create child logger with different namespace
     */
    child(namespace) {
        return new Logger(`${this.namespace}:${namespace}`, this.level);
    }
}
// Global logger instance
export const logger = new Logger();
//# sourceMappingURL=logger.js.map