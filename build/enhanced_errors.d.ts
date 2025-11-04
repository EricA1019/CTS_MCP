/**
 * Enhanced Error Handling System
 * Categorized errors with severity levels and recovery suggestions
 */
/**
 * Error categories for classification
 */
export declare enum ErrorCategory {
    VALIDATION = "VALIDATION",// Input validation failures
    PARSING = "PARSING",// File/syntax parsing errors
    EXECUTION = "EXECUTION",// Tool execution failures
    FILESYSTEM = "FILESYSTEM",// File I/O errors
    CONFIGURATION = "CONFIGURATION",// Config/setup errors
    NETWORK = "NETWORK",// External service failures
    INTERNAL = "INTERNAL",// Unexpected internal errors
    RESOURCE = "RESOURCE"
}
/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    ERROR = "ERROR",// Fatal errors that prevent execution
    WARNING = "WARNING",// Non-fatal issues that may affect results
    INFO = "INFO"
}
/**
 * Recovery suggestion for errors
 */
export interface RecoverySuggestion {
    action: string;
    details: string;
    example?: string;
    documentationUrl?: string;
}
/**
 * Enhanced error information
 */
export interface EnhancedErrorInfo {
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    details?: Record<string, unknown>;
    suggestions: RecoverySuggestion[];
    errorCode?: string;
}
/**
 * Create categorized error with suggestions
 */
export declare function createEnhancedError(category: ErrorCategory, severity: ErrorSeverity, message: string, details?: Record<string, unknown>, suggestions?: RecoverySuggestion[]): EnhancedErrorInfo;
/**
 * Common recovery suggestions by category
 */
export declare const CommonSuggestions: {
    VALIDATION: {
        checkType: {
            action: string;
            details: string;
            example: string;
        };
        checkRequired: {
            action: string;
            details: string;
        };
        checkRange: {
            action: string;
            details: string;
            example: string;
        };
    };
    PARSING: {
        checkSyntax: {
            action: string;
            details: string;
            example: string;
        };
        checkEncoding: {
            action: string;
            details: string;
            example: string;
        };
        checkTreeSitter: {
            action: string;
            details: string;
            example: string;
        };
    };
    FILESYSTEM: {
        checkPath: {
            action: string;
            details: string;
            example: string;
        };
        checkPermissions: {
            action: string;
            details: string;
            example: string;
        };
        checkDiskSpace: {
            action: string;
            details: string;
        };
    };
    CONFIGURATION: {
        checkEnv: {
            action: string;
            details: string;
            example: string;
        };
        checkConfig: {
            action: string;
            details: string;
            example: string;
        };
    };
    RESOURCE: {
        reduceScope: {
            action: string;
            details: string;
            example: string;
        };
        increaseLimit: {
            action: string;
            details: string;
        };
    };
    INTERNAL: {
        retry: {
            action: string;
            details: string;
        };
        reportBug: {
            action: string;
            details: string;
            documentationUrl: string;
        };
    };
};
/**
 * Create error with common suggestions
 */
export declare function createValidationError(message: string, paramName: string, expectedType?: string): EnhancedErrorInfo;
export declare function createParsingError(message: string, filePath: string, line?: number): EnhancedErrorInfo;
export declare function createFilesystemError(message: string, path: string, operation: 'read' | 'write' | 'access'): EnhancedErrorInfo;
export declare function createConfigurationError(message: string, configKey: string, currentValue?: unknown): EnhancedErrorInfo;
export declare function createResourceError(message: string, resourceType: string, limit: number, actual: number): EnhancedErrorInfo;
/**
 * Format error for user display
 */
export declare function formatEnhancedError(error: EnhancedErrorInfo): string;
//# sourceMappingURL=enhanced_errors.d.ts.map