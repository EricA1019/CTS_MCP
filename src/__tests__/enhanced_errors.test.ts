/**
 * Enhanced Error Handling Tests
 */

import { describe, it, expect } from '@jest/globals';
import {
  ErrorCategory,
  ErrorSeverity,
  RecoverySuggestion,
  createValidationError,
  createParsingError,
  createFilesystemError,
  formatEnhancedError,
} from '../enhanced_errors.js';
import { MCPError, Errors } from '../errors.js';

describe('Enhanced Error System', () => {
  describe('Error Creation', () => {
    it('creates validation errors with suggestions', () => {
      const error = createValidationError('projectPath is required', 'projectPath', 'string');
      
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.message).toBe('projectPath is required');
      expect(error.suggestions.length).toBeGreaterThan(0);
      expect(error.suggestions[0].action).toContain('Verify parameter type');
    });

    it('creates parsing errors with helpful suggestions', () => {
      const error = createParsingError('Invalid syntax', 'test.gd', 42);
      
      expect(error.category).toBe(ErrorCategory.PARSING);
      expect(error.details?.filePath).toBe('test.gd');
      expect(error.details?.line).toBe(42);
      expect(error.suggestions.some((s: RecoverySuggestion) => s.action.includes('syntax'))).toBe(true);
    });

    it('creates filesystem errors with recovery actions', () => {
      const error = createFilesystemError(
        'File not found',
        '/path/to/file.gd',
        'read'
      );
      
      expect(error.category).toBe(ErrorCategory.FILESYSTEM);
      expect(error.details?.operation).toBe('read');
      expect(error.suggestions.some((s: RecoverySuggestion) => s.action.includes('path'))).toBe(true);
    });
  });

  describe('Error Formatting', () => {
    it('formats errors with suggestions for display', () => {
      const error = createValidationError('Missing parameter', 'projectPath', 'string');
      const formatted = formatEnhancedError(error);
      
      expect(formatted).toContain('[VALIDATION]');
      expect(formatted).toContain('ERROR');
      expect(formatted).toContain('Missing parameter');
      expect(formatted).toContain('Suggested Actions');
    });

    it('includes details in formatted output', () => {
      const error = createParsingError('Syntax error', 'test.gd', 10);
      const formatted = formatEnhancedError(error);
      
      expect(formatted).toContain('Details:');
      expect(formatted).toContain('filePath');
      expect(formatted).toContain('test.gd');
    });
  });

  describe('MCP Error Integration', () => {
    it('creates validation error with enhanced info', () => {
      const error = Errors.validationError('projectPath', 'string', 123);
      
      expect(error).toBeInstanceOf(MCPError);
      expect(error.enhanced).toBeDefined();
      expect(error.enhanced?.category).toBe(ErrorCategory.VALIDATION);
      expect(error.enhanced?.suggestions.length).toBeGreaterThan(0);
    });

    it('creates tree-sitter error with recovery suggestions', () => {
      const originalError = new Error('Parsing failed');
      const error = Errors.treeSitterError('/test/file.gd', originalError);
      
      expect(error.enhanced).toBeDefined();
      expect(error.enhanced?.category).toBe(ErrorCategory.PARSING);
      expect(error.enhanced?.suggestions.some(
        (s: RecoverySuggestion) => s.action.includes('tree-sitter')
      )).toBe(true);
    });

    it('creates filesystem error with path suggestions', () => {
      const originalError = new Error('ENOENT');
      const error = Errors.fileSystemError('read', '/missing/file.gd', originalError);
      
      expect(error.enhanced).toBeDefined();
      expect(error.enhanced?.category).toBe(ErrorCategory.FILESYSTEM);
      expect(error.enhanced?.suggestions.some(
        (s: RecoverySuggestion) => s.example?.includes('absolute paths')
      )).toBe(true);
    });

    it('includes enhanced info in JSON serialization', () => {
      const error = Errors.validationError('test', 'string', 123);
      const json = error.toJSON();
      
      expect(json.data).toBeDefined();
      expect((json.data as any).enhanced).toHaveProperty('category');
      expect((json.data as any).enhanced).toHaveProperty('suggestions');
    });

    it('formats enhanced error messages', () => {
      const error = Errors.validationError('projectPath', 'string', undefined);
      const formatted = error.getFormattedMessage();
      
      expect(formatted).toContain('[VALIDATION]');
      expect(formatted).toContain('Suggested Actions');
    });
  });
});
