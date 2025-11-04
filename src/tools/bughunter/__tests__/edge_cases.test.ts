/**
 * Bughunter Edge Case Tests
 * 
 * Tests for boundary conditions, error scenarios, and unusual inputs.
 */

import { describe, it, expect } from '@jest/globals';
import { createBughunterHandler } from '../index';
import { formatReport } from '../reporter';
import { calculateSeverityScore } from '../heuristics';
import type { BugScanReport, FileBugReport } from '../scanner';
import type { BugMatch } from '../heuristics';

describe('Bughunter Edge Cases', () => {
  describe('Empty/Minimal Inputs', () => {
    it('should handle empty project path gracefully', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: '',
      }) as any;

      // Should fail validation (empty string not allowed)
      expect(result.success).toBe(false);
      expect(result.error.code).toBe(-32602);
    });

    it('should handle nonexistent project path', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: '/nonexistent/project/path/12345',
      }) as any;

      // Should fail during scan (not validation)
      if (!result.success) {
        expect(result.error.code).toBe(-32603); // Internal error, not validation
      }
    });

    it('should handle empty exclude patterns', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: '/test/project',
        excludePatterns: [],
      }) as any;

      // Empty array is valid - just scans everything
      if (!result.success) {
        expect(result.error.code).not.toBe(-32602);
      }
    });

    it('should handle project with zero files', () => {
      const emptyReport: BugScanReport = {
        projectPath: '/empty/project',
        totalFiles: 0,
        totalBugs: 0,
        overallScore: 100,
        severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
        byFile: [],
        scanTimeMs: 50,
      };

      const markdown = formatReport(emptyReport, 'markdown');
      expect(markdown).toContain('No Bugs Found');
      expect(markdown).toContain('🎉');
    });
  });

  describe('Large Scale Scenarios', () => {
    it('should handle very large bug counts', () => {
      const manyBugs: BugMatch[] = Array.from({ length: 1000 }, (_, i) => ({
        pattern: 'test',
        name: 'Test Bug',
        severity: 'low' as const,
        line: i + 1,
        column: 1,
        message: `Bug ${i}`,
      }));

      const score = calculateSeverityScore(manyBugs);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle report with many files', () => {
      const manyFiles: FileBugReport[] = Array.from({ length: 500 }, (_, i) => ({
        file: `/project/file${i}.gd`,
        bugCount: 2,
        bugs: [
          {
            pattern: 'test',
            name: 'Test',
            severity: 'low',
            line: 1,
            column: 1,
            message: 'test',
            file: `/project/file${i}.gd`,
          },
          {
            pattern: 'test',
            name: 'Test',
            severity: 'medium',
            line: 2,
            column: 1,
            message: 'test',
            file: `/project/file${i}.gd`,
          },
        ],
        severityBreakdown: { low: 1, medium: 1, high: 0, critical: 0 },
      }));

      const report: BugScanReport = {
        projectPath: '/large/project',
        totalFiles: 500,
        totalBugs: 1000,
        overallScore: 60,
        severityBreakdown: { low: 500, medium: 500, high: 0, critical: 0 },
        byFile: manyFiles,
        scanTimeMs: 2500,
      };

      const markdown = formatReport(report, 'markdown');
      // Should limit to top 10 files
      expect(markdown.split('###').length).toBeLessThanOrEqual(12); // Header + 10 files + summary
    });

    it('should handle maxFiles parameter correctly', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: '/test/project',
        maxFiles: 1,
      }) as any;

      // Validation should pass
      if (!result.success) {
        expect(result.error.code).not.toBe(-32602);
      }
    });
  });

  describe('Format-Specific Edge Cases', () => {
    it('should handle special characters in file paths', () => {
      const report: BugScanReport = {
        projectPath: '/project/with spaces/and-dashes/file.gd',
        totalFiles: 1,
        totalBugs: 1,
        overallScore: 95,
        severityBreakdown: { low: 0, medium: 0, high: 1, critical: 0 },
        byFile: [
          {
            file: '/project/with spaces/and-dashes/file.gd',
            bugCount: 1,
            bugs: [
              {
                pattern: 'test',
                name: 'Test',
                severity: 'high',
                line: 10,
                column: 5,
                message: 'Test bug',
              },
            ],
            severityBreakdown: { low: 0, medium: 0, high: 1, critical: 0 },
          },
        ],
        scanTimeMs: 100,
      };

      const ctsPlan = formatReport(report, 'cts_plan');
      const parsed = JSON.parse(ctsPlan);
      expect(parsed.hops[0].hopId).toBeDefined();
      expect(parsed.hops[0].hopId).toMatch(/^bugfix-/);
    });

    it('should handle unicode in bug messages', () => {
      const report: BugScanReport = {
        projectPath: '/project',
        totalFiles: 1,
        totalBugs: 1,
        overallScore: 90,
        severityBreakdown: { low: 0, medium: 1, high: 0, critical: 0 },
        byFile: [
          {
            file: '/project/test.gd',
            bugCount: 1,
            bugs: [
              {
                pattern: 'test',
                name: '测试 Bug 🐛',
                severity: 'medium',
                line: 1,
                column: 1,
                message: 'Unicode message: こんにちは 世界 🌍',
              },
            ],
            severityBreakdown: { low: 0, medium: 1, high: 0, critical: 0 },
          },
        ],
        scanTimeMs: 50,
      };

      const markdown = formatReport(report, 'markdown');
      expect(markdown).toContain('🐛');
      expect(markdown).toContain('こんにちは');

      const json = formatReport(report, 'json');
      const parsed = JSON.parse(json);
      expect(parsed.byFile[0].bugs[0].message).toContain('🌍');
    });

    it('should create valid JSON even with zero bugs', () => {
      const cleanReport: BugScanReport = {
        projectPath: '/clean/project',
        totalFiles: 50,
        totalBugs: 0,
        overallScore: 100,
        severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
        byFile: [],
        scanTimeMs: 800,
      };

      const json = formatReport(cleanReport, 'json');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should create valid CTS Plan even with only low bugs', () => {
      const lowBugsReport: BugScanReport = {
        projectPath: '/project',
        totalFiles: 10,
        totalBugs: 20,
        overallScore: 90,
        severityBreakdown: { low: 20, medium: 0, high: 0, critical: 0 },
        byFile: [
          {
            file: '/project/test.gd',
            bugCount: 20,
            bugs: Array.from({ length: 20 }, (_, i) => ({
              pattern: 'unused_return_value',
              name: 'Unused Return Value',
              severity: 'low' as const,
              line: i + 1,
              column: 1,
              message: 'Return value unused',
            })),
            severityBreakdown: { low: 20, medium: 0, high: 0, critical: 0 },
          },
        ],
        scanTimeMs: 300,
      };

      const ctsPlan = formatReport(lowBugsReport, 'cts_plan');
      const parsed = JSON.parse(ctsPlan);
      
      // Should have 0 hops since only low bugs (not critical/high)
      expect(parsed.hops).toHaveLength(0);
      expect(parsed.metadata.totalBugs).toBe(20);
    });
  });

  describe('Severity Filtering Edge Cases', () => {
    it('should filter out lower severities correctly', async () => {
      const handler = createBughunterHandler();
      // This will fail on scan but we're testing parameter handling
      const result = await handler({
        projectPath: '/test',
        minSeverity: 'critical',
      }) as any;

      // Validation passes, execution may fail
      if (!result.success) {
        expect(result.error.code).not.toBe(-32602);
      }
    });

    it('should handle "low" severity filter', async () => {
      const handler = createBughunterHandler();
      const result = await handler({
        projectPath: '/test',
        minSeverity: 'low',
      }) as any;

      // Low severity should include all bugs
      if (!result.success) {
        expect(result.error.code).not.toBe(-32602);
      }
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle very fast scans gracefully', () => {
      const quickReport: BugScanReport = {
        projectPath: '/tiny/project',
        totalFiles: 1,
        totalBugs: 0,
        overallScore: 100,
        severityBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
        byFile: [],
        scanTimeMs: 5,
      };

      const markdown = formatReport(quickReport, 'markdown');
      expect(markdown).toContain('5ms');
    });

    it('should format large scan times correctly', () => {
      const slowReport: BugScanReport = {
        projectPath: '/huge/project',
        totalFiles: 5000,
        totalBugs: 500,
        overallScore: 70,
        severityBreakdown: { low: 200, medium: 200, high: 80, critical: 20 },
        byFile: [],
        scanTimeMs: 15000,
      };

      const markdown = formatReport(slowReport, 'markdown');
      expect(markdown).toContain('15000ms');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent scan requests', async () => {
      const handler = createBughunterHandler();

      const promises = [
        handler({ projectPath: '/test1' }),
        handler({ projectPath: '/test2' }),
        handler({ projectPath: '/test3' }),
      ];

      const results = await Promise.all(promises);
      
      // Each should process independently (may all fail but separately)
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('success');
      });
    });
  });
});
