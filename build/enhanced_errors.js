/**
 * Enhanced Error Handling System
 * Categorized errors with severity levels and recovery suggestions
 */
/**
 * Error categories for classification
 */
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["PARSING"] = "PARSING";
    ErrorCategory["EXECUTION"] = "EXECUTION";
    ErrorCategory["FILESYSTEM"] = "FILESYSTEM";
    ErrorCategory["CONFIGURATION"] = "CONFIGURATION";
    ErrorCategory["NETWORK"] = "NETWORK";
    ErrorCategory["INTERNAL"] = "INTERNAL";
    ErrorCategory["RESOURCE"] = "RESOURCE";
})(ErrorCategory || (ErrorCategory = {}));
/**
 * Error severity levels
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["ERROR"] = "ERROR";
    ErrorSeverity["WARNING"] = "WARNING";
    ErrorSeverity["INFO"] = "INFO";
})(ErrorSeverity || (ErrorSeverity = {}));
/**
 * Create categorized error with suggestions
 */
export function createEnhancedError(category, severity, message, details, suggestions = []) {
    return {
        category,
        severity,
        message,
        details,
        suggestions,
    };
}
/**
 * Common recovery suggestions by category
 */
export const CommonSuggestions = {
    VALIDATION: {
        checkType: {
            action: 'Verify parameter type',
            details: 'Ensure the parameter matches the expected type (string, number, boolean, etc.)',
            example: 'projectPath should be a string, not a number',
        },
        checkRequired: {
            action: 'Provide required parameter',
            details: 'This parameter is required and cannot be omitted',
        },
        checkRange: {
            action: 'Ensure value is within valid range',
            details: 'The parameter value must be within the specified minimum and maximum',
            example: 'minConfidence must be between 0.0 and 1.0',
        },
    },
    PARSING: {
        checkSyntax: {
            action: 'Fix syntax errors in source file',
            details: 'The file contains syntax errors that prevent parsing',
            example: 'Missing closing brace, invalid indentation, etc.',
        },
        checkEncoding: {
            action: 'Verify file encoding',
            details: 'File must be UTF-8 encoded',
            example: 'Convert from Latin-1 or other encoding to UTF-8',
        },
        checkTreeSitter: {
            action: 'Verify tree-sitter installation',
            details: 'tree-sitter-gdscript native module may be missing',
            example: 'Run: npm rebuild tree-sitter-gdscript',
        },
    },
    FILESYSTEM: {
        checkPath: {
            action: 'Verify file/directory path',
            details: 'Path must exist and be accessible',
            example: 'Use absolute paths: /home/user/project instead of ./project',
        },
        checkPermissions: {
            action: 'Check file permissions',
            details: 'Ensure read/write permissions are set correctly',
            example: 'Run: chmod +r file.gd',
        },
        checkDiskSpace: {
            action: 'Check available disk space',
            details: 'Ensure sufficient space for cache and temporary files',
        },
    },
    CONFIGURATION: {
        checkEnv: {
            action: 'Verify environment variables',
            details: 'Required environment variables may be missing or invalid',
            example: 'Set LOG_LEVEL to ERROR, WARN, INFO, or DEBUG',
        },
        checkConfig: {
            action: 'Validate configuration file',
            details: 'Configuration values must be within valid ranges',
            example: 'CTS_MAX_FILE_SIZE must be at least 1024 bytes',
        },
    },
    RESOURCE: {
        reduceScope: {
            action: 'Reduce operation scope',
            details: 'Try processing fewer files or smaller file sizes',
            example: 'Use maxFiles parameter to limit scan',
        },
        increaseLimit: {
            action: 'Increase resource limits',
            details: 'Adjust CTS_MAX_FILE_SIZE or CTS_MAX_FILES environment variables',
        },
    },
    INTERNAL: {
        retry: {
            action: 'Retry operation',
            details: 'Temporary failure, may succeed on retry',
        },
        reportBug: {
            action: 'Report bug to developers',
            details: 'This appears to be an internal error',
            documentationUrl: 'https://github.com/broken-divinity/prototypeBD/issues',
        },
    },
};
/**
 * Create error with common suggestions
 */
export function createValidationError(message, paramName, expectedType) {
    const suggestions = [
        CommonSuggestions.VALIDATION.checkType,
    ];
    if (expectedType) {
        suggestions[0].example = `${paramName} should be ${expectedType}`;
    }
    return createEnhancedError(ErrorCategory.VALIDATION, ErrorSeverity.ERROR, message, { paramName, expectedType }, suggestions);
}
export function createParsingError(message, filePath, line) {
    return createEnhancedError(ErrorCategory.PARSING, ErrorSeverity.ERROR, message, { filePath, line }, [
        CommonSuggestions.PARSING.checkSyntax,
        CommonSuggestions.PARSING.checkEncoding,
    ]);
}
export function createFilesystemError(message, path, operation) {
    return createEnhancedError(ErrorCategory.FILESYSTEM, ErrorSeverity.ERROR, message, { path, operation }, [
        CommonSuggestions.FILESYSTEM.checkPath,
        CommonSuggestions.FILESYSTEM.checkPermissions,
    ]);
}
export function createConfigurationError(message, configKey, currentValue) {
    return createEnhancedError(ErrorCategory.CONFIGURATION, ErrorSeverity.ERROR, message, { configKey, currentValue }, [
        CommonSuggestions.CONFIGURATION.checkEnv,
        CommonSuggestions.CONFIGURATION.checkConfig,
    ]);
}
export function createResourceError(message, resourceType, limit, actual) {
    return createEnhancedError(ErrorCategory.RESOURCE, ErrorSeverity.WARNING, message, { resourceType, limit, actual }, [
        CommonSuggestions.RESOURCE.reduceScope,
        CommonSuggestions.RESOURCE.increaseLimit,
    ]);
}
/**
 * Format error for user display
 */
export function formatEnhancedError(error) {
    const lines = [];
    lines.push(`[${error.category}] ${error.severity}: ${error.message}`);
    if (error.details && Object.keys(error.details).length > 0) {
        lines.push('\nDetails:');
        for (const [key, value] of Object.entries(error.details)) {
            lines.push(`  ${key}: ${JSON.stringify(value)}`);
        }
    }
    if (error.suggestions.length > 0) {
        lines.push('\nSuggested Actions:');
        error.suggestions.forEach((suggestion, index) => {
            lines.push(`  ${index + 1}. ${suggestion.action}`);
            lines.push(`     ${suggestion.details}`);
            if (suggestion.example) {
                lines.push(`     Example: ${suggestion.example}`);
            }
            if (suggestion.documentationUrl) {
                lines.push(`     Docs: ${suggestion.documentationUrl}`);
            }
        });
    }
    return lines.join('\n');
}
//# sourceMappingURL=enhanced_errors.js.map