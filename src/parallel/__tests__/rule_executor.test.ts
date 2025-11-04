/**
 * Tests for Parallel Rule Executor
 * 
 * Tests cover:
 * - Basic parallel execution
 * - Worker crash recovery
 * - Progress reporting
 * - Sequential fallback
 * - Performance benchmarks
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { executeRulesParallel, shouldUseParallel } from '../rule_executor.js';
import type { ComplianceRule, AuditContext, ComplianceResult } from '../../tools/audit/checkers.js';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Parallel Rule Executor', () => {
  let tempDir: string;
  let context: AuditContext;

  beforeEach(() => {
    // Create temporary project directory
    tempDir = mkdtempSync(join(tmpdir(), 'cts-parallel-test-'));
    
    // Create test files
    const testFiles = Array.from({ length: 50 }, (_, i) => {
      const fileName = `test_${i}.gd`;
      const content = `# Test file ${i}\n`.repeat(100); // 100 lines each
      writeFileSync(join(tempDir, fileName), content);
      return fileName;
    });

    context = {
      projectPath: tempDir,
      files: testFiles,
    };
  });

  afterEach(() => {
    // Cleanup temp directory
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Basic Parallel Execution', () => {
    it('should execute multiple rules in parallel', async () => {
      const mockRules: ComplianceRule[] = Array.from({ length: 10 }, (_, i) => ({
        id: `rule_${i}`,
        name: `Test Rule ${i}`,
        category: 'cts' as const,
        description: `Test rule ${i}`,
        check: async (_ctx: AuditContext): Promise<ComplianceResult> => {
          // Simulate some work
          await new Promise((resolve) => setTimeout(resolve, 50));
          return {
            passed: true,
            violations: [],
            score: 100,
          };
        },
      }));

      const startTime = performance.now();
      const results = await executeRulesParallel(mockRules, context, 4);
      const duration = performance.now() - startTime;

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.passed)).toBe(true);
      
      // Parallel execution should be faster than sequential (10 * 50ms = 500ms)
      // With 4 workers: ~150ms (3 batches: 4+4+2)
      expect(duration).toBeLessThan(400); // Allow some overhead
    });

    it('should return results in original rule order', async () => {
      const mockRules: ComplianceRule[] = Array.from({ length: 5 }, (_, i) => ({
        id: `rule_${i}`,
        name: `Test Rule ${i}`,
        category: 'code_quality' as const,
        description: `Test rule ${i}`,
        check: async (_ctx: AuditContext): Promise<ComplianceResult> => {
          // Random delay to simulate varying execution times
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
          return {
            passed: true,
            violations: [],
            score: 90 + i, // Different scores
          };
        },
      }));

      const results = await executeRulesParallel(mockRules, context, 4);

      expect(results).toHaveLength(5);
      // Check that results are in original rule order
      results.forEach((result, i) => {
        expect(result.rule.id).toBe(`rule_${i}`);
        expect(result.score).toBe(90 + i);
      });
    });
  });

  describe('Worker Crash Recovery', () => {
    it('should handle worker crashes gracefully', async () => {
      const mockRules: ComplianceRule[] = [
        {
          id: 'good_rule',
          name: 'Good Rule',
          category: 'cts' as const,
          description: 'A rule that works',
          check: async (_ctx: AuditContext): Promise<ComplianceResult> => ({
            passed: true,
            violations: [],
            score: 100,
          }),
        },
        {
          id: 'crash_rule',
          name: 'Crash Rule',
          category: 'cts' as const,
          description: 'A rule that crashes',
          check: async (_ctx: AuditContext): Promise<ComplianceResult> => {
            throw new Error('Simulated worker crash');
          },
        },
        {
          id: 'another_good_rule',
          name: 'Another Good Rule',
          category: 'cts' as const,
          description: 'Another rule that works',
          check: async (_ctx: AuditContext): Promise<ComplianceResult> => ({
            passed: true,
            violations: [],
            score: 100,
          }),
        },
      ];

      const results = await executeRulesParallel(mockRules, context, 4);

      expect(results).toHaveLength(3);
      
      // Good rules should pass
      expect(results[0].passed).toBe(true);
      expect(results[2].passed).toBe(true);
      
      // Crashed rule should have error result
      expect(results[1].passed).toBe(false);
      expect(results[1].score).toBe(0);
      expect(results[1].violations).toHaveLength(1);
      expect(results[1].violations[0].message).toContain('crash');
    });

    it('should not fail entire audit when worker crashes', async () => {
      const mockRules: ComplianceRule[] = Array.from({ length: 8 }, (_, i) => ({
        id: `rule_${i}`,
        name: `Test Rule ${i}`,
        category: 'cts' as const,
        description: `Test rule ${i}`,
        check: async (_ctx: AuditContext): Promise<ComplianceResult> => {
          // Crash rules 2, 5, 7
          if ([2, 5, 7].includes(i)) {
            throw new Error(`Crash in rule ${i}`);
          }
          return {
            passed: true,
            violations: [],
            score: 100,
          };
        },
      }));

      const results = await executeRulesParallel(mockRules, context, 4);

      expect(results).toHaveLength(8);
      
      // Non-crashed rules should pass
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(true);
      expect(results[3].passed).toBe(true);
      expect(results[4].passed).toBe(true);
      expect(results[6].passed).toBe(true);
      
      // Crashed rules should have errors
      expect(results[2].passed).toBe(false);
      expect(results[5].passed).toBe(false);
      expect(results[7].passed).toBe(false);
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress as rules complete', async () => {
      const progressUpdates: Array<{ completed: number; total: number; ruleId: string }> = [];
      
      const mockRules: ComplianceRule[] = Array.from({ length: 6 }, (_, i) => ({
        id: `rule_${i}`,
        name: `Test Rule ${i}`,
        category: 'cts' as const,
        description: `Test rule ${i}`,
        check: async (_ctx: AuditContext): Promise<ComplianceResult> => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          return {
            passed: true,
            violations: [],
            score: 100,
          };
        },
      }));

      await executeRulesParallel(
        mockRules,
        context,
        4,
        (completed, total, ruleId) => {
          progressUpdates.push({ completed, total, ruleId });
        }
      );

      // Should have 6 progress updates (one per rule)
      expect(progressUpdates).toHaveLength(6);
      
      // Total should always be 6
      expect(progressUpdates.every((u) => u.total === 6)).toBe(true);
      
      // Completed should increase from 1 to 6
      const completedCounts = progressUpdates.map((u) => u.completed);
      expect(completedCounts).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('Sequential Fallback', () => {
    it('should use sequential execution for small projects', async () => {
      const mockRules: ComplianceRule[] = Array.from({ length: 2 }, (_, i) => ({
        id: `rule_${i}`,
        name: `Test Rule ${i}`,
        category: 'cts' as const,
        description: `Test rule ${i}`,
        check: async (_ctx: AuditContext): Promise<ComplianceResult> => ({
          passed: true,
          violations: [],
          score: 100,
        }),
      }));

      const smallContext: AuditContext = {
        projectPath: tempDir,
        files: ['test1.gd', 'test2.gd'], // Only 2 files
      };

      // Should use sequential execution (less than 3 rules)
      const results = await executeRulesParallel(mockRules, smallContext, 4);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.passed)).toBe(true);
    });

    it('shouldUseParallel() should correctly determine execution mode', () => {
      // Small projects: sequential
      expect(shouldUseParallel(2, 100)).toBe(false); // Too few rules
      expect(shouldUseParallel(5, 15)).toBe(false); // Too few files
      
      // Large projects: parallel
      expect(shouldUseParallel(10, 50)).toBe(true);
      expect(shouldUseParallel(15, 100)).toBe(true);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should achieve 3x speedup for 10+ rules', async () => {
      const mockRules: ComplianceRule[] = Array.from({ length: 12 }, (_, i) => ({
        id: `rule_${i}`,
        name: `Test Rule ${i}`,
        category: 'cts' as const,
        description: `Test rule ${i}`,
        check: async (_ctx: AuditContext): Promise<ComplianceResult> => {
          // Simulate 100ms work per rule
          await new Promise((resolve) => setTimeout(resolve, 100));
          return {
            passed: true,
            violations: [],
            score: 100,
          };
        },
      }));

      // Sequential execution time
      const sequentialStart = performance.now();
      const sequentialResults: ComplianceResult[] = [];
      for (const rule of mockRules) {
        const result = await rule.check(context);
        sequentialResults.push(result);
      }
      const sequentialTime = performance.now() - sequentialStart;

      // Parallel execution time
      const parallelStart = performance.now();
      const parallelResults = await executeRulesParallel(mockRules, context, 4);
      const parallelTime = performance.now() - parallelStart;

      // Calculate speedup
      const speedup = sequentialTime / parallelTime;

      console.log(`Sequential: ${Math.round(sequentialTime)}ms, Parallel: ${Math.round(parallelTime)}ms, Speedup: ${speedup.toFixed(2)}x`);

      // Should achieve at least 2.5x speedup (target is 3x, allow some margin)
      expect(speedup).toBeGreaterThanOrEqual(2.5);
      
      // Results should be identical
      expect(parallelResults).toHaveLength(12);
      expect(parallelResults.every((r) => r.passed)).toBe(true);
    });

    it('should handle large number of rules efficiently', async () => {
      const mockRules: ComplianceRule[] = Array.from({ length: 20 }, (_, i) => ({
        id: `rule_${i}`,
        name: `Test Rule ${i}`,
        category: 'cts' as const,
        description: `Test rule ${i}`,
        check: async (_ctx: AuditContext): Promise<ComplianceResult> => {
          await new Promise((resolve) => setTimeout(resolve, 30));
          return {
            passed: true,
            violations: [],
            score: 95 + (i % 5),
          };
        },
      }));

      const startTime = performance.now();
      const results = await executeRulesParallel(mockRules, context, 4);
      const duration = performance.now() - startTime;

      expect(results).toHaveLength(20);
      expect(results.every((r) => r.passed)).toBe(true);
      
      // With 4 workers and 30ms per rule:
      // Sequential: 20 * 30ms = 600ms
      // Parallel: 5 batches * 30ms = 150ms + overhead
      expect(duration).toBeLessThan(400); // Should be much faster than sequential
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rule list', async () => {
      const results = await executeRulesParallel([], context, 4);
      expect(results).toEqual([]);
    });

    it('should handle single rule', async () => {
      const mockRule: ComplianceRule = {
        id: 'single_rule',
        name: 'Single Rule',
        category: 'cts' as const,
        description: 'A single rule',
        check: async (_ctx: AuditContext): Promise<ComplianceResult> => ({
          passed: true,
          violations: [],
          score: 100,
        }),
      };

      const results = await executeRulesParallel([mockRule], context, 4);
      
      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    it('should respect maxWorkers limit', async () => {
      // This test verifies that no more than maxWorkers run concurrently
      // We can't directly observe worker count, but we can verify timing
      const mockRules: ComplianceRule[] = Array.from({ length: 8 }, (_, i) => ({
        id: `rule_${i}`,
        name: `Test Rule ${i}`,
        category: 'cts' as const,
        description: `Test rule ${i}`,
        check: async (_ctx: AuditContext): Promise<ComplianceResult> => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return {
            passed: true,
            violations: [],
            score: 100,
          };
        },
      }));

      const startTime = performance.now();
      const results = await executeRulesParallel(mockRules, context, 2); // Only 2 workers
      const duration = performance.now() - startTime;

      expect(results).toHaveLength(8);
      
      // With 2 workers: 4 batches * 50ms = 200ms + overhead
      // Should take longer than with 4 workers
      expect(duration).toBeGreaterThan(180);
      expect(duration).toBeLessThan(300);
    });
  });
});
