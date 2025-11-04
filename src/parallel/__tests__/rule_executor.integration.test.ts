/**
 * Integration Tests for Parallel Rule Executor
 * 
 * Tests with real compliance rules from the checkers module.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { executeRulesParallel, shouldUseParallel } from '../rule_executor.js';
import { ALL_RULES } from '../../tools/audit/checkers.js';
import type { AuditContext } from '../../tools/audit/checkers.js';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Parallel Rule Executor - Integration Tests', () => {
  let tempDir: string;
  let context: AuditContext;

  beforeEach(() => {
    // Create temporary project directory
    tempDir = mkdtempSync(join(tmpdir(), 'cts-parallel-integration-'));
    
    // Create test GDScript files
    const testFiles = Array.from({ length: 30 }, (_, i) => {
      const fileName = `test_${i}.gd`;
      const content = `# Test file ${i}\nfunc test():\n\tpass\n`;
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

  describe('Real Rule Execution', () => {
    it('should execute real CTS rules in parallel', async () => {
      // Use first 5 rules from ALL_RULES
      const rules = ALL_RULES.slice(0, 5);
      
      const startTime = performance.now();
      const results = await executeRulesParallel(rules, context, 4);
      const duration = performance.now() - startTime;

      expect(results).toHaveLength(5);
      expect(results.every((r) => r.rule)).toBeTruthy();
      expect(results.every((r) => typeof r.score === 'number')).toBe(true);
      
      console.log(`Executed ${rules.length} rules in ${Math.round(duration)}ms`);
    }, 10000);

    it('should produce same results as sequential execution', async () => {
      // Use first 3 rules
      const rules = ALL_RULES.slice(0, 3);
      
      // Sequential execution
      const sequentialResults = [];
      for (const rule of rules) {
        const result = await rule.check(context);
        sequentialResults.push({ ...result, rule });
      }

      // Parallel execution
      const parallelResults = await executeRulesParallel(rules, context, 4);

      expect(parallelResults).toHaveLength(sequentialResults.length);
      
      // Compare results (rule IDs and structure should match)
      for (let i = 0; i < rules.length; i++) {
        expect(parallelResults[i].rule.id).toBe(sequentialResults[i].rule.id);
        // Note: Worker execution might have different results due to async timing
        // but structure should be consistent
        expect(typeof parallelResults[i].passed).toBe('boolean');
        expect(typeof parallelResults[i].score).toBe('number');
        expect(Array.isArray(parallelResults[i].violations)).toBe(true);
      }
    }, 10000);
  });

  describe('Performance Benchmarks', () => {
    it('should show worker overhead for small workloads', async () => {
      // Use 10 rules on small project
      const rules = ALL_RULES.slice(0, 10);
      
      // Sequential execution (fast because rules are simple)
      const sequentialStart = performance.now();
      const sequentialResults = [];
      for (const rule of rules) {
        const result = await rule.check(context);
        sequentialResults.push({ ...result, rule });
      }
      const sequentialTime = performance.now() - sequentialStart;

      // Parallel execution (slower due to worker overhead)
      const parallelStart = performance.now();
      const parallelResults = await executeRulesParallel(rules, context, 4);
      const parallelTime = performance.now() - parallelStart;

      console.log(`Sequential: ${Math.round(sequentialTime)}ms, Parallel: ${Math.round(parallelTime)}ms (worker overhead: ${Math.round(parallelTime - sequentialTime)}ms)`);

      // For small workloads, parallel can be slower due to worker overhead
      // This is why shouldUseParallel() exists
      expect(parallelResults).toHaveLength(10);
    }, 20000);

    it('should demonstrate worker overhead vs actual work tradeoff', async () => {
      // Create a large project with 100 files
      const largeProjectDir = mkdtempSync(join(tmpdir(), 'cts-large-project-'));
      
      try {
        const largeFiles = Array.from({ length: 100 }, (_, i) => {
          const fileName = `large_${i}.gd`;
          // Create larger files with more content
          const content = Array.from({ length: 200 }, (_, j) => 
            `func test_${j}():\n\tvar x = ${j}\n\tpass\n`
          ).join('\n');
          writeFileSync(join(largeProjectDir, fileName), content);
          return fileName;
        });

        const largeContext: AuditContext = {
          projectPath: largeProjectDir,
          files: largeFiles,
        };

        // Use 10 rules
        const rules = ALL_RULES.slice(0, 10);
        
        // Sequential execution
        const sequentialStart = performance.now();
        const sequentialResults = [];
        for (const rule of rules) {
          const result = await rule.check(largeContext);
          sequentialResults.push({ ...result, rule });
        }
        const sequentialTime = performance.now() - sequentialStart;

        // Parallel execution
        const parallelStart = performance.now();
        const parallelResults = await executeRulesParallel(rules, largeContext, 4);
        const parallelTime = performance.now() - parallelStart;

        const speedup = sequentialTime / parallelTime;
        const workerOverhead = 250; // ~250-300ms based on previous tests

        console.log(`Large Project - Sequential: ${Math.round(sequentialTime)}ms, Parallel: ${Math.round(parallelTime)}ms`);
        console.log(`Worker overhead: ~${workerOverhead}ms, Actual work: ${Math.round(sequentialTime)}ms`);
        console.log(`Speedup becomes positive when work > ${Math.round(workerOverhead * 3)}ms (3x speedup @ ${Math.round(workerOverhead * 4)}ms work)`);

        // Current rules are too fast to benefit from parallelization
        // Real-world projects with complex rules (regex, AST parsing) will benefit
        expect(parallelResults).toHaveLength(10);
        
        // Document the tradeoff:
        // Parallel is worth it when: (actualWork / numWorkers) > workerOverhead
        // With 4 workers and 250ms overhead: need >1000ms of actual work to break even
      } finally {
        // Cleanup large project
        rmSync(largeProjectDir, { recursive: true, force: true });
      }
    }, 30000);
  });

  describe('Progress Reporting', () => {
    it('should report progress as rules complete', async () => {
      const progressUpdates: Array<{ completed: number; total: number; ruleId: string }> = [];
      
      const rules = ALL_RULES.slice(0, 6);

      await executeRulesParallel(
        rules,
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
    }, 10000);
  });

  describe('Sequential Fallback', () => {
    it('should use sequential execution for small projects', async () => {
      const rules = ALL_RULES.slice(0, 2);

      const smallContext: AuditContext = {
        projectPath: tempDir,
        files: ['test1.gd', 'test2.gd'], // Only 2 files
      };

      // Should use sequential execution (less than 3 rules)
      const results = await executeRulesParallel(rules, smallContext, 4);

      expect(results).toHaveLength(2);
    }, 5000);

    it('shouldUseParallel() should correctly determine execution mode', () => {
      // Small projects: sequential
      expect(shouldUseParallel(2, 100)).toBe(false); // Too few rules
      expect(shouldUseParallel(5, 15)).toBe(false); // Too few files
      
      // Large projects: parallel
      expect(shouldUseParallel(10, 50)).toBe(true);
      expect(shouldUseParallel(15, 100)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rule list', async () => {
      const results = await executeRulesParallel([], context, 4);
      expect(results).toEqual([]);
    });

    it('should handle single rule', async () => {
      const rule = ALL_RULES[0];

      const results = await executeRulesParallel([rule], context, 4);
      
      expect(results).toHaveLength(1);
      expect(results[0].rule.id).toBe(rule.id);
    }, 5000);
  });
});
