/**
 * MCP Error Types & Codes
 *
 * Implements JSON-RPC 2.0 error codes for Model Context Protocol
 * Provides structured error handling with diagnostic context
 */
import { EnhancedErrorInfo } from './enhanced_errors.js';
/**
 * Standard JSON-RPC 2.0 error codes
 */
export declare enum MCPErrorCode {
    PARSE_ERROR = -32700,// Invalid JSON
    INVALID_REQUEST = -32600,// Invalid request object
    METHOD_NOT_FOUND = -32601,// Method doesn't exist
    INVALID_PARAMS = -32602,// Invalid method parameters
    INTERNAL_ERROR = -32603,// Internal server error
    TOOL_NOT_FOUND = -32000,// Tool doesn't exist
    TOOL_EXECUTION_FAILED = -32001,// Tool threw exception
    TOOL_TIMEOUT = -32002,// Tool exceeded time limit
    RESOURCE_NOT_FOUND = -32003,// Resource doesn't exist
    PROMPT_NOT_FOUND = -32004,// Prompt doesn't exist
    VALIDATION_ERROR = -32005,// Input validation failed
    INITIALIZATION_ERROR = -32006,// Server init failed
    TREE_SITTER_ERROR = -32007,// Tree-sitter parsing error
    FILE_SYSTEM_ERROR = -32008
}
/**
 * MCP-specific error class with diagnostic context
 */
export declare class MCPError extends Error {
    code: MCPErrorCode;
    data?: unknown;
    enhanced?: EnhancedErrorInfo;
    constructor(code: MCPErrorCode, message: string, data?: unknown, enhanced?: EnhancedErrorInfo);
    /**
     * Convert to JSON-RPC error response format
     */
    toJSON(): {
        code: MCPErrorCode;
        message: string;
        data: unknown;
    };
    /**
     * Get formatted error message with suggestions
     */
    getFormattedMessage(): string;
    /**
     * Get human-readable error category
     */
    getCategory(): string;
}
/**
 * Factory functions for common error types
 */
export declare const Errors: {
    parseError: (details?: string) => MCPError;
    invalidRequest: (reason?: string) => MCPError;
    methodNotFound: (method: string) => MCPError;
    invalidParams: (field: string, reason: string) => MCPError;
    internalError: (message: string, stack?: string) => MCPError;
    toolNotFound: (toolName: string) => MCPError;
    toolExecutionFailed: (toolName: string, error: Error) => MCPError;
    toolTimeout: (toolName: string, timeoutMs: number) => MCPError;
    resourceNotFound: (uri: string) => MCPError;
    promptNotFound: (promptName: string) => MCPError;
    validationError: (field: string, expected: string, actual: unknown) => MCPError;
    treeSitterError: (filePath: string, error: Error) => MCPError;
    fileSystemError: (operation: string, path: string, error: Error) => MCPError;
};
//# sourceMappingURL=errors.d.ts.map