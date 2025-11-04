/**
 * MCP Error Types & Codes
 *
 * Implements JSON-RPC 2.0 error codes for Model Context Protocol
 * Provides structured error handling with diagnostic context
 */
import { ErrorCategory, ErrorSeverity, formatEnhancedError, } from './enhanced_errors.js';
/**
 * Standard JSON-RPC 2.0 error codes
 */
export var MCPErrorCode;
(function (MCPErrorCode) {
    // Standard JSON-RPC errors
    MCPErrorCode[MCPErrorCode["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
    MCPErrorCode[MCPErrorCode["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    MCPErrorCode[MCPErrorCode["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    MCPErrorCode[MCPErrorCode["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    MCPErrorCode[MCPErrorCode["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
    // Custom MCP errors (-32000 to -32099)
    MCPErrorCode[MCPErrorCode["TOOL_NOT_FOUND"] = -32000] = "TOOL_NOT_FOUND";
    MCPErrorCode[MCPErrorCode["TOOL_EXECUTION_FAILED"] = -32001] = "TOOL_EXECUTION_FAILED";
    MCPErrorCode[MCPErrorCode["TOOL_TIMEOUT"] = -32002] = "TOOL_TIMEOUT";
    MCPErrorCode[MCPErrorCode["RESOURCE_NOT_FOUND"] = -32003] = "RESOURCE_NOT_FOUND";
    MCPErrorCode[MCPErrorCode["PROMPT_NOT_FOUND"] = -32004] = "PROMPT_NOT_FOUND";
    MCPErrorCode[MCPErrorCode["VALIDATION_ERROR"] = -32005] = "VALIDATION_ERROR";
    MCPErrorCode[MCPErrorCode["INITIALIZATION_ERROR"] = -32006] = "INITIALIZATION_ERROR";
    MCPErrorCode[MCPErrorCode["TREE_SITTER_ERROR"] = -32007] = "TREE_SITTER_ERROR";
    MCPErrorCode[MCPErrorCode["FILE_SYSTEM_ERROR"] = -32008] = "FILE_SYSTEM_ERROR";
})(MCPErrorCode || (MCPErrorCode = {}));
/**
 * MCP-specific error class with diagnostic context
 */
export class MCPError extends Error {
    code;
    data;
    enhanced;
    constructor(code, message, data, enhanced) {
        super(message);
        this.name = 'MCPError';
        this.code = code;
        this.data = data;
        this.enhanced = enhanced;
        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MCPError);
        }
    }
    /**
     * Convert to JSON-RPC error response format
     */
    toJSON() {
        const base = {
            code: this.code,
            message: this.message,
            data: this.data,
        };
        // Include enhanced error info if available
        if (this.enhanced) {
            return {
                ...base,
                data: {
                    ...(typeof this.data === 'object' && this.data !== null ? this.data : {}),
                    enhanced: {
                        category: this.enhanced.category,
                        severity: this.enhanced.severity,
                        suggestions: this.enhanced.suggestions,
                        details: this.enhanced.details,
                    },
                },
            };
        }
        return base;
    }
    /**
     * Get formatted error message with suggestions
     */
    getFormattedMessage() {
        if (this.enhanced) {
            return formatEnhancedError(this.enhanced);
        }
        return this.message;
    }
    /**
     * Get human-readable error category
     */
    getCategory() {
        if (this.enhanced) {
            return this.enhanced.category;
        }
        if (this.code >= -32700 && this.code <= -32600) {
            return 'Protocol Error';
        }
        if (this.code >= -32099 && this.code <= -32000) {
            return 'Application Error';
        }
        return 'Unknown Error';
    }
}
/**
 * Factory functions for common error types
 */
export const Errors = {
    parseError: (details) => new MCPError(MCPErrorCode.PARSE_ERROR, `Parse error: ${details || 'Invalid JSON'}`, { details }),
    invalidRequest: (reason) => new MCPError(MCPErrorCode.INVALID_REQUEST, `Invalid request: ${reason || 'Missing required fields'}`, { reason }),
    methodNotFound: (method) => new MCPError(MCPErrorCode.METHOD_NOT_FOUND, `Method not found: ${method}`, { method }),
    invalidParams: (field, reason) => new MCPError(MCPErrorCode.INVALID_PARAMS, `Invalid parameter '${field}': ${reason}`, { field, reason }),
    internalError: (message, stack) => new MCPError(MCPErrorCode.INTERNAL_ERROR, `Internal error: ${message}`, { stack }),
    toolNotFound: (toolName) => new MCPError(MCPErrorCode.TOOL_NOT_FOUND, `Tool not found: ${toolName}`, { toolName, availableTools: [] } // Will be populated by server
    ),
    toolExecutionFailed: (toolName, error) => new MCPError(MCPErrorCode.TOOL_EXECUTION_FAILED, `Tool '${toolName}' execution failed: ${error.message}`, { toolName, originalError: error.message, stack: error.stack }),
    toolTimeout: (toolName, timeoutMs) => new MCPError(MCPErrorCode.TOOL_TIMEOUT, `Tool '${toolName}' exceeded timeout of ${timeoutMs}ms`, { toolName, timeoutMs }),
    resourceNotFound: (uri) => new MCPError(MCPErrorCode.RESOURCE_NOT_FOUND, `Resource not found: ${uri}`, { uri }),
    promptNotFound: (promptName) => new MCPError(MCPErrorCode.PROMPT_NOT_FOUND, `Prompt not found: ${promptName}`, { promptName }),
    validationError: (field, expected, actual) => {
        const enhanced = {
            category: ErrorCategory.VALIDATION,
            severity: ErrorSeverity.ERROR,
            message: `Validation error for '${field}': expected ${expected}, got ${typeof actual}`,
            details: { field, expected, actual: typeof actual },
            suggestions: [
                {
                    action: 'Verify parameter type',
                    details: `Ensure '${field}' matches the expected type`,
                    example: `${field} should be ${expected}`,
                },
            ],
        };
        return new MCPError(MCPErrorCode.VALIDATION_ERROR, enhanced.message, { field, expected, actual }, enhanced);
    },
    treeSitterError: (filePath, error) => {
        const enhanced = {
            category: ErrorCategory.PARSING,
            severity: ErrorSeverity.ERROR,
            message: `Tree-sitter parsing failed for ${filePath}: ${error.message}`,
            details: { filePath, originalError: error.message },
            suggestions: [
                {
                    action: 'Check GDScript syntax',
                    details: 'The file may contain syntax errors',
                },
                {
                    action: 'Verify tree-sitter installation',
                    details: 'tree-sitter-gdscript native module may be missing',
                    example: 'Run: npm rebuild tree-sitter-gdscript',
                },
            ],
        };
        return new MCPError(MCPErrorCode.TREE_SITTER_ERROR, enhanced.message, { filePath, originalError: error.message }, enhanced);
    },
    fileSystemError: (operation, path, error) => {
        const enhanced = {
            category: ErrorCategory.FILESYSTEM,
            severity: ErrorSeverity.ERROR,
            message: `File ${operation} failed for ${path}: ${error.message}`,
            details: { operation, path, originalError: error.message },
            suggestions: [
                {
                    action: 'Verify file path',
                    details: 'Ensure the path exists and is accessible',
                    example: 'Use absolute paths: /home/user/project instead of ./project',
                },
                {
                    action: 'Check permissions',
                    details: 'Ensure read/write permissions are set correctly',
                },
            ],
        };
        return new MCPError(MCPErrorCode.FILE_SYSTEM_ERROR, enhanced.message, { operation, path, originalError: error.message }, enhanced);
    },
};
//# sourceMappingURL=errors.js.map