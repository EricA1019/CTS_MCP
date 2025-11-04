/**
 * Bughunter MCP Integration Tests
 * 
 * Tests MCP tool wrapper, validation, report formatting, and end-to-end scanning.
 */

import { describe, it, expect } from '@jest/globals';
import { bughunterTool, createBughunterHandler } from '../index';
import { formatReport } from '../reporter';
import { BugScanReport } from '../scanner';

// Mock bug report for testing
const mockReport: BugScanReport = {
  projectPath: '/test/project',
  totalFiles: 10,
  totalBugs: 25,
  overallScore: 75,
  severityBreakdown: {
    low: 8,
    medium: 10,
    high: 5,
    critical: 2,
  },
  byFile: [
    {
      file: '/test/project/player.gd',
      bugCount: 12,
      bugs: [
        {
          pattern: 'signal_leak',
          name: 'Signal Not Disconnected',
          severity: 'high',
          line: 25,
          column: 5,
          message: 'Signal connected but not disconnected',
          file: '/test/project/player.gd',
        },
        {
          pattern: 'node_not_freed',
          name: 'Node Not Freed',
          severity: 'critical',
          line: 40,
          column: 10,
          message: 'Dynamically created node may not be freed',
          suggestion: 'Call queue_free() when done',
          file: '/test/project/player.gd',
        },
      ],
      severityBreakdown: {
        low: 3,
        medium: 5,
        high: 3,
        critical: 1,
      },
    },
  ],
  scanTimeMs: 1500,
};

describe('Bughunter MCP Integration', () => {
  describe('Tool Definition', () => {
    it('should have correct tool name', () => {
      expect(bughunterTool.name).toBe('CTS_Bughunter');
    });

    it('should have comprehensive description', () => {
      expect(bughunterTool.description).toContain('heuristic');
      expect(bughunterTool.description).toContain('pattern detection');
    });

    it('should have proper input schema', () => {
      expect(bughunterTool.inputSchema.type).toBe('object');
      expect(bughunterTool.inputSchema.properties).toHaveProperty('projectPath');
      expect(bughunterTool.inputSchema.properties).toHaveProperty('minSeverity');
      expect(bughunterTool.inputSchema.properties).toHaveProperty('exportFormat');
      expect(bughunterTool.inputSchema.required).toContain('projectPath');
    });

    it('should have severity enum in schema', () => {
      const minSeverity = bughunterTool.inputSchema.properties.minSeverity as any;
      expect(minSeverity.enum).toEqual(['low', 'medium', 'high', 'critical']);
    });

    it('should have format enum in schema', () => {
      const exportFormat = bughunterTool.inputSchema.properties.exportFormat as any;
      expect(exportFormat.enum).toEqual(['json', 'markdown', 'cts_plan']);
    });
  });

  describe('Handler Creation', () => {
    it('should create valid handler function', () => {
      const handler = createBughunterHandler();
      expect(typeof handler).toBe('function');
      expect(handler.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Report Formatting', () => {
    it('should format as JSON', () => {
      const formatted = formatReport(mockReport, 'json');
      expect(() => JSON.parse(formatted)).not.toThrow();
      
      const parsed = JSON.parse(formatted);
      expect(parsed.totalBugs).toBe(25);
      expect(parsed.overallScore).toBe(75);
    });

    it('should format as Markdown', () => {
      const formatted = formatReport(mockReport, 'markdown');
      expect(formatted).toContain('# 🐛 Bug Hunter Report');
      expect(formatted).toContain('Total Bugs Found');
      expect(formatted).toContain('Quality Score');
      expect(formatted).toContain('player.gd');
    });

    it('should format as CTS Plan', () => {
      const formatted = formatReport(mockReport, 'cts_plan');
      expect(() => JSON.parse(formatted)).not.toThrow();
      
      const parsed = JSON.parse(formatted);
      expect(parsed).toHaveProperty('planName');
      expect(parsed).toHaveProperty('hops');
      expect(Array.isArray(parsed.hops)).toBe(true);
    });

    it('should include emojis in Markdown', () => {
      const formatted = formatReport(mockReport, 'markdown');
      expect(formatted).toMatch(/[🔴🟠🟡⚪]/);
    });

    it('should create tasks from bugs in CTS Plan', () => {
      const formatted = formatReport(mockReport, 'cts_plan');
      const parsed = JSON.parse(formatted);
      
      expect(parsed.hops.length).toBeGreaterThan(0);
      expect(parsed.hops[0]).toHaveProperty('hopId');
      expect(parsed.hops[0]).toHaveProperty('name');
      expect(parsed.hops[0]).toHaveProperty('deliverables');
      expect(parsed.hops[0]).toHaveProperty('acceptanceCriteria');
    });

    it('should include metadata in CTS Plan', () => {
      const formatted = formatReport(mockReport, 'cts_plan');
      const parsed = JSON.parse(formatted);
      
      expect(parsed).toHaveProperty('metadata');
      expect(parsed.metadata.generatedBy).toBe('CTS_Bughunter');
      expect(parsed.metadata.totalBugs).toBe(25);
    });
  });

  describe('Parameter Validation', () => {
    it('should reject missing projectPath', async () => {
      const handler = createBughunterHandler();
      const result = await handler({}) as any;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(-32602);
    });

    it('should reject invalid minSeverity', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: '/test/project',
        minSeverity: 'invalid',
      }) as any;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(-32602);
    });

    it('should reject invalid exportFormat', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: '/test/project',
        exportFormat: 'xml',
      }) as any;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(-32602);
    });

    it('should accept valid minimal parameters', async () => {
      const handler = createBughunterHandler();
      // This will fail because the path doesn't exist, but validation should pass
      const result = await handler({
        projectPath: '/nonexistent/project',
      }) as any;

      // Either success or internal error (not validation error)
      if (!result.success) {
        expect(result.error.code).not.toBe(-32602);
      }
    });

    it('should accept all optional parameters', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: '/test/project',
        excludePatterns: ['**/test/**'],
        minSeverity: 'high',
        exportFormat: 'markdown',
        maxFiles: 100,
      }) as any;

      // Validation should pass (will fail on execution due to nonexistent path)
      if (!result.success) {
        expect(result.error.code).not.toBe(-32602);
      }
    });

    it('should enforce maxFiles bounds', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: '/test/project',
        maxFiles: 0,
      }) as any;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(-32602);
    });
  });

  describe('Error Handling', () => {
    it('should return structured error for validation failures', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: 123 as any,
      }) as any;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32602);
      expect(result.error.message).toContain('Invalid');
    });

    it('should include validation details in error', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        minSeverity: 'wrong',
      }) as any;

      expect(result.success).toBe(false);
      expect(result.error.data).toHaveProperty('validationErrors');
      expect(Array.isArray(result.error.data.validationErrors)).toBe(true);
    });
  });
});
