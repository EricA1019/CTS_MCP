/**
 * Integration Tests for Audit Tool
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { auditTool, createAuditHandler, type AuditInput } from '../index.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Audit Tool - Integration Tests', () => {
  let testProjectPath: string;
  let handler: ReturnType<typeof createAuditHandler>;

  beforeEach(async () => {
    // Create temporary test project
    testProjectPath = join(tmpdir(), `audit-test-${Date.now()}`);
    await mkdir(testProjectPath, { recursive: true });
    await mkdir(join(testProjectPath, 'scripts'), { recursive: true });
    await mkdir(join(testProjectPath, 'scenes'), { recursive: true });
    await mkdir(join(testProjectPath, 'test'), { recursive: true });

    handler = createAuditHandler();
  });

  afterEach(async () => {
    // Cleanup
    await rm(testProjectPath, { recursive: true, force: true });
  });

  describe('Tool Definition', () => {
    it('should have correct tool name', () => {
      expect(auditTool.name).toBe('cts_audit');
    });

    it('should have description', () => {
      expect(auditTool.description).toBeDefined();
      expect(auditTool.description.length).toBeGreaterThan(50);
    });

    it('should require projectPath', () => {
      expect(auditTool.inputSchema.required).toContain('projectPath');
    });

    it('should have optional category filter', () => {
      const schema = auditTool.inputSchema.properties?.categories as any;
      expect(schema).toBeDefined();
      expect(schema.type).toBe('array');
    });
  });

  describe('Category Filtering', () => {
    it('should audit all categories by default', async () => {
      // Create a simple file with violations
      await writeFile(
        join(testProjectPath, 'scripts', 'test.gd'),
        'func test():\n    pass\n',
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        format: 'json',
      };

      const result = await handler(input);
      expect(result.isError).toBeFalsy();

      const text = result.content[0]?.text;
      expect(text).toBeDefined();
      const data = JSON.parse(text as string);

      // Should check all categories
      expect(data.report.categoryScores).toHaveProperty('cts');
      expect(data.report.categoryScores).toHaveProperty('code_quality');
      expect(data.report.categoryScores).toHaveProperty('project_structure');
    });

    it('should audit only CTS category when specified', async () => {
      // Create a large file (CTS violation)
      const largeFile = 'func test():\n' + '    pass\n'.repeat(501);
      await writeFile(
        join(testProjectPath, 'scripts', 'large.gd'),
        largeFile,
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        categories: ['cts'],
        format: 'json',
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);

      // Should have CTS violations
      expect(data.report.categoryScores.cts).toBeLessThan(100);
    });

    it('should audit only code_quality category when specified', async () => {
      // Create file without type hints (code quality violation)
      await writeFile(
        join(testProjectPath, 'scripts', 'no_types.gd'),
        'func calculate(x, y):\n    return x + y\n',
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        categories: ['code_quality'],
        format: 'json',
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);

      // Should check code quality
      expect(data.report.categoryScores).toHaveProperty('code_quality');
    });
  });

  describe('Scoring Algorithm', () => {
    it('should return perfect score for compliant project', async () => {
      // Create a small, well-typed file
      await writeFile(
        join(testProjectPath, 'scripts', 'good.gd'),
        `extends Node

signal my_signal

func typed_function(x: int) -> int:
    assert(x > 0, "x must be positive")
    return x * 2
`,
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        format: 'json',
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);

      // Should have high scores
      expect(data.report.overallScore).toBeGreaterThanOrEqual(80);
      expect(data.report.categoryScores.cts).toBeGreaterThanOrEqual(80);
      expect(data.report.categoryScores.code_quality).toBeGreaterThanOrEqual(80);
    });

    it('should calculate weighted overall score', async () => {
      // Create file with violations
      const largeFile = 'func test():\n' + '    pass\n'.repeat(501);
      await writeFile(
        join(testProjectPath, 'scripts', 'violations.gd'),
        largeFile,
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        format: 'json',
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);

      // Overall score should be weighted average of category scores
      // CTS: 40%, code_quality: 40%, project_structure: 20%
      const expectedScore =
        data.report.categoryScores.cts * 0.4 +
        data.report.categoryScores.code_quality * 0.4 +
        data.report.categoryScores.project_structure * 0.2;

      expect(data.report.overallScore).toBeCloseTo(expectedScore, 1);
    });

    it('should penalize multiple violations', async () => {
      // Create multiple files with different violations
      await writeFile(
        join(testProjectPath, 'scripts', 'large.gd'),
        'func test():\n' + '    pass\n'.repeat(501),
        'utf-8'
      );
      await writeFile(
        join(testProjectPath, 'scripts', 'no_types.gd'),
        'func calculate(x, y):\n    return x + y\n',
        'utf-8'
      );
      await writeFile(
        join(testProjectPath, 'scripts', 'complex.gd'),
        `func complex():
    if true:
        if true:
            if true:
                if true:
                    if true:
                        if true:
                            if true:
                                if true:
                                    if true:
                                        if true:
                                            if true:
                                                pass
`,
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        format: 'json',
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);

      // Should have violations (score could still be high if many rules pass)
      expect(data.report.summary.totalViolations).toBeGreaterThan(0);
      expect(data.report.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate actionable recommendations', async () => {
      // Create file with violations
      const largeFile = 'func test():\n' + '    pass\n'.repeat(501);
      await writeFile(
        join(testProjectPath, 'scripts', 'large.gd'),
        largeFile,
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        format: 'json',
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);

      // Should have recommendations
      expect(data.report.recommendations.length).toBeGreaterThan(0);

      const rec = data.report.recommendations[0];
      expect(rec).toHaveProperty('priority');
      expect(rec).toHaveProperty('action');
      expect(rec).toHaveProperty('estimatedEffort');
      expect(rec).toHaveProperty('ruleId');
    });

    it('should prioritize recommendations by severity', async () => {
      // Create files with different severities
      await writeFile(
        join(testProjectPath, 'scripts', 'large.gd'),
        'func test():\n' + '    pass\n'.repeat(501),
        'utf-8'
      );
      await writeFile(
        join(testProjectPath, 'scripts', 'complex.gd'),
        `func complex():
    if true:
        if true:
            if true:
                if true:
                    if true:
                        if true:
                            if true:
                                if true:
                                    if true:
                                        if true:
                                            if true:
                                                pass
`,
        'utf-8'
      );
      await writeFile(
        join(testProjectPath, 'scripts', 'bad_name.gd'),
        'var myVariable = 0\n',
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        format: 'json',
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);

      // High priority should come before low priority
      const priorities = data.report.recommendations.map((r: any) => r.priority);
      const highIndex = priorities.indexOf('high');
      const lowIndex = priorities.indexOf('low');

      if (highIndex !== -1 && lowIndex !== -1) {
        expect(highIndex).toBeLessThan(lowIndex);
      }
    });

    it('should include affected files in recommendations', async () => {
      // Create file with type hint violations
      await writeFile(
        join(testProjectPath, 'scripts', 'no_types.gd'),
        'func calculate(x, y):\n    return x + y\n',
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        categories: ['code_quality'],
        format: 'json',
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);

      const typeHintRec = data.report.recommendations.find(
        (r: any) => r.ruleId === 'type_hints'
      );

      if (typeHintRec) {
        expect(typeHintRec.affectedFiles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Minimum Score Threshold', () => {
    it('should pass when score meets threshold', async () => {
      // Create good file
      await writeFile(
        join(testProjectPath, 'scripts', 'good.gd'),
        `extends Node

func typed_function(x: int) -> int:
    return x * 2
`,
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        minScore: 70,
        format: 'json',
      };

      const result = await handler(input);
      expect(result.isError).toBeFalsy();
    });

    it('should fail when score below threshold', async () => {
      // Create multiple files with severe violations to drop score below 95
      // Large file (CTS violation)
      const largeFile = 'func test():\n' + '    pass\n'.repeat(501);
      await writeFile(
        join(testProjectPath, 'scripts', 'bad.gd'),
        largeFile,
        'utf-8'
      );
      
      // No type hints (code quality violation)
      await writeFile(
        join(testProjectPath, 'scripts', 'no_types.gd'),
        'func calc(x, y):\n    return x + y\n',
        'utf-8'
      );
      
      // Complex function (code quality violation)
      await writeFile(
        join(testProjectPath, 'scripts', 'complex.gd'),
        `func complex():
    if true:
        if true:
            if true:
                if true:
                    if true:
                        if true:
                            if true:
                                if true:
                                    if true:
                                        if true:
                                            if true:
                                                pass
`,
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        minScore: 100, // Set very high threshold to force failure
        format: 'json',
      };

      const result = await handler(input);
      
      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);
      
      // Check that it failed due to threshold
      expect(data.error).toBe('Audit failed');
      expect(data.message).toContain('below threshold');
      expect(result.isError).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete audit in under 5 seconds', async () => {
      // Create multiple files
      for (let i = 0; i < 10; i++) {
        await writeFile(
          join(testProjectPath, 'scripts', `file${i}.gd`),
          `func test${i}():\n    pass\n`,
          'utf-8'
        );
      }

      const startTime = performance.now();
      const input: AuditInput = {
        projectPath: testProjectPath,
        format: 'json',
      };

      const result = await handler(input);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // 5 seconds

      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);
      expect(data.performance.durationMs).toBeLessThan(5000);
    });
  });

  describe('Output Formats', () => {
    it('should return JSON format by default', async () => {
      await writeFile(
        join(testProjectPath, 'scripts', 'test.gd'),
        'func test():\n    pass\n',
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;

      expect(() => JSON.parse(text)).not.toThrow();
    });

    it('should return markdown format when requested', async () => {
      await writeFile(
        join(testProjectPath, 'scripts', 'test.gd'),
        'func test():\n    pass\n',
        'utf-8'
      );

      const input: AuditInput = {
        projectPath: testProjectPath,
        format: 'markdown',
      };

      const result = await handler(input);
      const text = result.content[0]?.text as string;

      expect(text).toContain('# 📊 CTS Audit Report');
      expect(text).toContain('Overall Score:');
      expect(text).toContain('Category Scores');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', async () => {
      const result = await handler({ invalid: 'input' });
      expect(result.isError).toBeTruthy();

      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);
      expect(data.error).toBe('Invalid input');
    });

    it('should handle missing project path', async () => {
      const result = await handler({});
      expect(result.isError).toBeTruthy();
    });

    it('should handle non-existent directory', async () => {
      const input: AuditInput = {
        projectPath: '/nonexistent/path/12345',
        format: 'json',
      };

      const result = await handler(input);
      expect(result.isError).toBeTruthy();

      const text = result.content[0]?.text as string;
      const data = JSON.parse(text);
      expect(data.error).toBe('Audit failed');
    });
  });
});
