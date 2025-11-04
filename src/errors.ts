/**
 * MCP Error Types & Codes
 * 
 * Implements JSON-RPC 2.0 error codes for Model Context Protocol
 * Provides structured error handling with diagnostic context
 */

import {
  ErrorCategory,
  ErrorSeverity,
  EnhancedErrorInfo,
  formatEnhancedError,
} from './enhanced_errors.js';

/**
 * Standard JSON-RPC 2.0 error codes
 */
export enum MCPErrorCode {
  // Standard JSON-RPC errors
  PARSE_ERROR = -32700,          // Invalid JSON
  INVALID_REQUEST = -32600,      // Invalid request object
  METHOD_NOT_FOUND = -32601,     // Method doesn't exist
  INVALID_PARAMS = -32602,       // Invalid method parameters
  INTERNAL_ERROR = -32603,       // Internal server error
  
  // Custom MCP errors (-32000 to -32099)
  TOOL_NOT_FOUND = -32000,       // Tool doesn't exist
  TOOL_EXECUTION_FAILED = -32001, // Tool threw exception
  TOOL_TIMEOUT = -32002,          // Tool exceeded time limit
  RESOURCE_NOT_FOUND = -32003,    // Resource doesn't exist
  PROMPT_NOT_FOUND = -32004,      // Prompt doesn't exist
  VALIDATION_ERROR = -32005,      // Input validation failed
  INITIALIZATION_ERROR = -32006,  // Server init failed
  TREE_SITTER_ERROR = -32007,     // Tree-sitter parsing error
  FILE_SYSTEM_ERROR = -32008,     // File I/O error
}

/**
 * MCP-specific error class with diagnostic context
 */
export class MCPError extends Error {
  code: MCPErrorCode;
  data?: unknown;
  enhanced?: EnhancedErrorInfo;
  
  constructor(
    code: MCPErrorCode,
    message: string,
    data?: unknown,
    enhanced?: EnhancedErrorInfo
  ) {
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
  getFormattedMessage(): string {
    if (this.enhanced) {
      return formatEnhancedError(this.enhanced);
    }
    return this.message;
  }
  
  /**
   * Get human-readable error category
   */
  getCategory(): string {
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
  parseError: (details?: string) => new MCPError(
    MCPErrorCode.PARSE_ERROR,
    `Parse error: ${details || 'Invalid JSON'}`,
    { details }
  ),
  
  invalidRequest: (reason?: string) => new MCPError(
    MCPErrorCode.INVALID_REQUEST,
    `Invalid request: ${reason || 'Missing required fields'}`,
    { reason }
  ),
  
  methodNotFound: (method: string) => new MCPError(
    MCPErrorCode.METHOD_NOT_FOUND,
    `Method not found: ${method}`,
    { method }
  ),
  
  invalidParams: (field: string, reason: string) => new MCPError(
    MCPErrorCode.INVALID_PARAMS,
    `Invalid parameter '${field}': ${reason}`,
    { field, reason }
  ),
  
  internalError: (message: string, stack?: string) => new MCPError(
    MCPErrorCode.INTERNAL_ERROR,
    `Internal error: ${message}`,
    { stack }
  ),
  
  toolNotFound: (toolName: string) => new MCPError(
    MCPErrorCode.TOOL_NOT_FOUND,
    `Tool not found: ${toolName}`,
    { toolName, availableTools: [] } // Will be populated by server
  ),
  
  toolExecutionFailed: (toolName: string, error: Error) => new MCPError(
    MCPErrorCode.TOOL_EXECUTION_FAILED,
    `Tool '${toolName}' execution failed: ${error.message}`,
    { toolName, originalError: error.message, stack: error.stack }
  ),
  
  toolTimeout: (toolName: string, timeoutMs: number) => new MCPError(
    MCPErrorCode.TOOL_TIMEOUT,
    `Tool '${toolName}' exceeded timeout of ${timeoutMs}ms`,
    { toolName, timeoutMs }
  ),
  
  resourceNotFound: (uri: string) => new MCPError(
    MCPErrorCode.RESOURCE_NOT_FOUND,
    `Resource not found: ${uri}`,
    { uri }
  ),
  
  promptNotFound: (promptName: string) => new MCPError(
    MCPErrorCode.PROMPT_NOT_FOUND,
    `Prompt not found: ${promptName}`,
    { promptName }
  ),
  
  validationError: (field: string, expected: string, actual: unknown) => {
    const enhanced: EnhancedErrorInfo = {
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
    
    return new MCPError(
      MCPErrorCode.VALIDATION_ERROR,
      enhanced.message,
      { field, expected, actual },
      enhanced
    );
  },
  
  treeSitterError: (filePath: string, error: Error) => {
    const enhanced: EnhancedErrorInfo = {
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
    
    return new MCPError(
      MCPErrorCode.TREE_SITTER_ERROR,
      enhanced.message,
      { filePath, originalError: error.message },
      enhanced
    );
  },
  
  fileSystemError: (operation: string, path: string, error: Error) => {
    const enhanced: EnhancedErrorInfo = {
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
    
    return new MCPError(
      MCPErrorCode.FILE_SYSTEM_ERROR,
      enhanced.message,
      { operation, path, originalError: error.message },
      enhanced
    );
  },
};
