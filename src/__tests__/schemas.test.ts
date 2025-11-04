/**
 * Tool Response Schema Validation Tests
 * Updated to match implementation-aligned schemas (Task 2C.3/2C.4)
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateToolResponse,
  ScanSignalsResponseSchema,
  BughunterResponseSchema,
  AuditResponseSchema
} from '../schemas.js';

describe('Tool Response Schemas', () => {
  describe('CTS_Scan_Project_Signals Schema', () => {
    it('validates correct response structure with implementation-aligned fields', () => {
      const validResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Scan_Project_Signals',
        duration_ms: 150,
        result: {
          projectPath: '/test/project',
          totalSignals: 2,
          eventBusSignals: 1,
          signalBusSignals: 1,
          signals: [
            {
              name: 'player_died',
              file: 'Player.gd',
              line: 42,
              source: 'EventBus',
              params: ['cause', 'killer'],  // String array, not objects
            },
          ],
          rendered: false,
        },
      };

      const { valid, errors } = validateToolResponse('CTS_Scan_Project_Signals', validResponse);
      
      expect(valid).toBe(true);
      expect(errors).toBeUndefined();
    });

    it('validates optional html and cached fields', () => {
      const validResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Scan_Project_Signals',
        result: {
          projectPath: '/test/project',
          totalSignals: 0,
          eventBusSignals: 0,
          signalBusSignals: 0,
          signals: [],
          rendered: true,
          html: '<html>...</html>',
          cached: true,
        },
      };

      const { valid } = validateToolResponse('CTS_Scan_Project_Signals', validResponse);
      
      expect(valid).toBe(true);
    });

    it('rejects invalid signal structure', () => {
      const invalidResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Scan_Project_Signals',
        result: {
          projectPath: '/test/project',
          totalSignals: 1,
          eventBusSignals: 1,
          signalBusSignals: 0,
          signals: [
            {
              name: 'test',
              // Missing required 'file', 'line', 'source', 'params' fields
            },
          ],
          rendered: false,
        },
      };

      const { valid, errors } = validateToolResponse('CTS_Scan_Project_Signals', invalidResponse);
      
      expect(valid).toBe(false);
      expect(errors).toBeDefined();
    });

    it('requires toolName literal to match', () => {
      const invalidResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'WrongToolName',
        result: {
          projectPath: '/test',
          totalSignals: 0,
          eventBusSignals: 0,
          signalBusSignals: 0,
          signals: [],
          rendered: false,
        },
      };

      const { valid } = validateToolResponse('CTS_Scan_Project_Signals', invalidResponse);
      
      expect(valid).toBe(false);
    });
  });

  describe('CTS_Bughunter Schema', () => {
    it('validates correct bug report structure', () => {
      const validResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Bughunter',
        result: {
          bugs: [
            {
              file: 'test.gd',
              line: 10,
              severity: 'high' as const,
              category: 'null_check',
              message: 'Potential null reference',
              suggestion: 'Add null check before access',
              codeSnippet: 'var x = obj.property',
            },
          ],
          stats: {
            totalBugs: 1,
            bySeverity: { high: 1, medium: 0, low: 0, critical: 0 },
            byCategory: { null_check: 1 },
            filesScanned: 5,
            duration_ms: 100,
          },
        },
      };

      const { valid } = validateToolResponse('CTS_Bughunter', validResponse);
      
      expect(valid).toBe(true);
    });

    it('validates optional bug fields', () => {
      const validResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Bughunter',
        result: {
          bugs: [
            {
              file: 'test.gd',
              line: 10,
              severity: 'low' as const,
              category: 'style',
              message: 'Style issue',
              // suggestion and codeSnippet are optional
            },
          ],
          stats: {
            totalBugs: 1,
            bySeverity: { critical: 0, high: 0, medium: 0, low: 1 },
            byCategory: { style: 1 },
            filesScanned: 1,
            duration_ms: 50,
          },
        },
      };

      const { valid } = validateToolResponse('CTS_Bughunter', validResponse);
      
      expect(valid).toBe(true);
    });

    it('rejects invalid severity levels', () => {
      const invalidResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Bughunter',
        result: {
          bugs: [
            {
              file: 'test.gd',
              line: 10,
              severity: 'super-critical', // Invalid severity
              category: 'null_check',
              message: 'Test',
            },
          ],
          stats: {
            totalBugs: 1,
            bySeverity: {},
            byCategory: {},
            filesScanned: 1,
            duration_ms: 100,
          },
        },
      };

      const { valid } = validateToolResponse('CTS_Bughunter', invalidResponse);
      
      expect(valid).toBe(false);
    });
  });

  describe('cts_audit Schema', () => {
    it('validates complete audit report with new structure', () => {
      const validResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'cts_audit',
        result: {
          report: {
            overallScore: 75,
            categoryScores: {
              cts: 60,
              code_quality: 90,
              project_structure: 70,
            },
            violations: [
              {
                file: 'test.gd',
                line: 0,
                severity: 'error' as const,
                message: 'File too large',
                ruleId: 'cts_file_size',
                category: 'cts',
              },
            ],
            violationsByRule: {
              cts_file_size: 1,
            },
            recommendations: [
              {
                priority: 'high' as const,
                action: 'Split large file',
                affectedFiles: ['test.gd'],
                estimatedEffort: 'medium' as const,
                ruleId: 'cts_file_size',
              },
            ],
            metrics: {
              loc: {
                total: 1000,
                byFile: { 'test.gd': 600 },
                average: 500,
              },
              complexity: {
                total: 50,
                byFile: { 'test.gd': 30 },
                average: 25,
              },
              testCoverage: 85,
            },
            summary: {
              totalViolations: 1,
              errorCount: 1,
              warningCount: 0,
              infoCount: 0,
            },
          },
          performance: {
            durationMs: 250,
            rulesChecked: 15,
            metricsCollected: true,
          },
          format: 'json' as const,
        },
      };

      const { valid } = validateToolResponse('cts_audit', validResponse);
      
      expect(valid).toBe(true);
    });

    it('validates markdown format option', () => {
      const validResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'cts_audit',
        result: {
          report: {
            overallScore: 85,
            categoryScores: { cts: 80, code_quality: 90, project_structure: 85 },
            violations: [],
            violationsByRule: {},
            recommendations: [],
            metrics: {
              loc: { total: 500, byFile: {}, average: 100 },
              complexity: { total: 20, byFile: {}, average: 4 },
            },
            summary: {
              totalViolations: 0,
              errorCount: 0,
              warningCount: 0,
              infoCount: 0,
            },
          },
          performance: {
            durationMs: 150,
            rulesChecked: 10,
            metricsCollected: true,
          },
          format: 'markdown' as const,
          markdown: '# Audit Report\n\n...',
        },
      };

      const { valid } = validateToolResponse('cts_audit', validResponse);
      
      expect(valid).toBe(true);
    });

    it('validates score ranges', () => {
      const invalidScore = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'cts_audit',
        result: {
          report: {
            overallScore: 150, // Invalid: > 100
            categoryScores: { cts: 50, code_quality: 50, project_structure: 50 },
            violations: [],
            violationsByRule: {},
            recommendations: [],
            metrics: {
              loc: { total: 0, byFile: {}, average: 0 },
              complexity: { total: 0, byFile: {}, average: 0 },
            },
            summary: {
              totalViolations: 0,
              errorCount: 0,
              warningCount: 0,
              infoCount: 0,
            },
          },
          performance: {
            durationMs: 100,
            rulesChecked: 5,
            metricsCollected: true,
          },
          format: 'json' as const,
        },
      };

      const { valid } = validateToolResponse('cts_audit', invalidScore);
      
      expect(valid).toBe(false);
    });

    it('validates priority enum values', () => {
      const invalidPriority = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'cts_audit',
        result: {
          report: {
            overallScore: 75,
            categoryScores: { cts: 75, code_quality: 75, project_structure: 75 },
            violations: [],
            violationsByRule: {},
            recommendations: [
              {
                priority: 'urgent' as any, // Invalid: should be 'critical', 'high', 'medium', or 'low'
                action: 'Test',
                affectedFiles: [],
                estimatedEffort: 'low' as const,
                ruleId: 'test',
              },
            ],
            metrics: {
              loc: { total: 0, byFile: {}, average: 0 },
              complexity: { total: 0, byFile: {}, average: 0 },
            },
            summary: {
              totalViolations: 0,
              errorCount: 0,
              warningCount: 0,
              infoCount: 0,
            },
          },
          performance: {
            durationMs: 100,
            rulesChecked: 5,
            metricsCollected: true,
          },
          format: 'json' as const,
        },
      };

      const { valid } = validateToolResponse('cts_audit', invalidPriority);
      
      expect(valid).toBe(false);
    });
  });

  describe('Base Response Fields', () => {
    it('requires success field', () => {
      const result = ScanSignalsResponseSchema.safeParse({
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Scan_Project_Signals',
        result: { 
          projectPath: '/test',
          totalSignals: 0,
          eventBusSignals: 0,
          signalBusSignals: 0,
          signals: [],
          rendered: false,
        },
      });

      expect(result.success).toBe(false);
    });

    it('requires valid timestamp format', () => {
      const result = ScanSignalsResponseSchema.safeParse({
        success: true,
        timestamp: 'invalid-date',
        toolName: 'CTS_Scan_Project_Signals',
        result: { 
          projectPath: '/test',
          totalSignals: 0,
          eventBusSignals: 0,
          signalBusSignals: 0,
          signals: [],
          rendered: false,
        },
      });

      expect(result.success).toBe(false);
    });

    it('requires toolName field', () => {
      const result = ScanSignalsResponseSchema.safeParse({
        success: true,
        timestamp: new Date().toISOString(),
        result: { 
          projectPath: '/test',
          totalSignals: 0,
          eventBusSignals: 0,
          signalBusSignals: 0,
          signals: [],
          rendered: false,
        },
      });

      expect(result.success).toBe(false);
    });

    it('accepts optional duration_ms and metadata', () => {
      const validResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Scan_Project_Signals',
        duration_ms: 100,
        metadata: { test: 'value' },
        result: {
          projectPath: '/test',
          totalSignals: 0,
          eventBusSignals: 0,
          signalBusSignals: 0,
          signals: [],
          rendered: false,
        },
      };

      const { valid } = validateToolResponse('CTS_Scan_Project_Signals', validResponse);
      
      expect(valid).toBe(true);
    });

    it('validates success must be literal true', () => {
      const result = ScanSignalsResponseSchema.safeParse({
        success: false, // Invalid: must be literal true for success responses
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Scan_Project_Signals',
        result: { 
          projectPath: '/test',
          totalSignals: 0,
          eventBusSignals: 0,
          signalBusSignals: 0,
          signals: [],
          rendered: false,
        },
      });

      expect(result.success).toBe(false);
    });
  });
});
