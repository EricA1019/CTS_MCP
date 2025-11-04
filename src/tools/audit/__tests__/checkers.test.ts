/**
 * Audit Compliance Checkers Tests
 * 
 * Tests for rule validation and metrics collection.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  ALL_RULES,
  getRulesByCategory,
  type AuditContext,
} from '../checkers';
import { collectMetrics, getComplexityBreakdown, getTopComplexFiles, getTopLargestFiles } from '../metrics';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TEST_PROJECT = '/tmp/audit-test-project';

describe('Audit Compliance Checkers', () => {
  beforeEach(async () => {
    if (existsSync(TEST_PROJECT)) {
      await rm(TEST_PROJECT, { recursive: true, force: true });
    }
    await mkdir(TEST_PROJECT, { recursive: true });
  });

  afterEach(async () => {
    if (existsSync(TEST_PROJECT)) {
      await rm(TEST_PROJECT, { recursive: true, force: true });
    }
  });

  describe('Rule Registry', () => {
    it('should have 10 compliance rules', () => {
      expect(ALL_RULES.length).toBe(10);
    });

    it('should have 4 CTS rules', () => {
      const ctsRules = getRulesByCategory('cts');
      expect(ctsRules.length).toBe(4);
    });

    it('should have 4 code quality rules', () => {
      const qualityRules = getRulesByCategory('code_quality');
      expect(qualityRules.length).toBe(4);
    });

    it('should have 2 project structure rules', () => {
      const structureRules = getRulesByCategory('project_structure');
      expect(structureRules.length).toBe(2);
    });

    it('should have unique rule IDs', () => {
      const ids = ALL_RULES.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('CTS File Size Rule', () => {
    it('should pass for files under 500 lines', async () => {
      const file = join(TEST_PROJECT, 'small.gd');
      await writeFile(file, 'extends Node\n'.repeat(100));

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['small.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'cts_file_size')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(true);
      expect(result.violations.length).toBe(0);
      expect(result.score).toBe(100);
    });

    it('should fail for files over 500 lines', async () => {
      const file = join(TEST_PROJECT, 'large.gd');
      await writeFile(file, 'extends Node\n'.repeat(600));

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['large.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'cts_file_size')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBe(1);
      expect(result.violations[0].severity).toBe('error');
      expect(result.score).toBeLessThan(100);
    });
  });

  describe('CTS Signal-First Rule', () => {
    it('should pass for classes with signals', async () => {
      const file = join(TEST_PROJECT, 'signaled.gd');
      await writeFile(
        file,
        `extends Node

signal health_changed(value)
signal died()

func take_damage(amount):
  health -= amount
  health_changed.emit(health)
  if health <= 0:
    died.emit()
`
      );

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['signaled.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'cts_signal_first')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(true);
    });

    it('should warn for classes without signals', async () => {
      const file = join(TEST_PROJECT, 'no_signals.gd');
      await writeFile(
        file,
        `extends Node

func func1():
  pass

func func2():
  pass

func func3():
  pass

func func4():
  pass
`
      );

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['no_signals.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'cts_signal_first')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Type Hints Rule', () => {
    it('should pass for functions with type hints', async () => {
      const file = join(TEST_PROJECT, 'typed.gd');
      await writeFile(
        file,
        `extends Node

func calculate(x: int, y: int) -> int:
  return x + y
`
      );

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['typed.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'type_hints')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(true);
    });

    it('should warn for functions without type hints', async () => {
      const file = join(TEST_PROJECT, 'untyped.gd');
      await writeFile(
        file,
        `extends Node

func calculate(x, y):
  return x + y
`
      );

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['untyped.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'type_hints')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].message).toContain('calculate');
    });
  });

  describe('Error Handling Rule', () => {
    it('should pass for files with error checking', async () => {
      const file = join(TEST_PROJECT, 'checked.gd');
      await writeFile(
        file,
        `extends Node

func process_data(data):
  if not data:
    return null
  assert(data.size() > 0)
  return data[0]
`
      );

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['checked.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'error_handling')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(true);
    });
  });

  describe('Complexity Rule', () => {
    it('should pass for simple functions', async () => {
      const file = join(TEST_PROJECT, 'simple.gd');
      await writeFile(
        file,
        `extends Node

func simple_func(x):
  if x > 0:
    return x * 2
  return 0
`
      );

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['simple.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'complexity')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(true);
    });

    it('should warn for complex functions', async () => {
      const file = join(TEST_PROJECT, 'complex.gd');
      const complexCode = `extends Node

func complex_func(data):
  if data.size() > 0:
    for item in data:
      if item.valid:
        while item.processing:
          if item.status == "ready" and item.ready:
            for child in item.children:
              if child.active and child.ready or child.forced:
                if child.enabled:
                  match child.type:
                    "A":
                      if true:
                        pass
                    "B":
                      if false:
                        pass
`;
      await writeFile(file, complexCode);

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['complex.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'complexity')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].message).toContain('complexity');
    });
  });

  describe('Naming Conventions Rule', () => {
    it('should pass for snake_case names', async () => {
      const file = join(TEST_PROJECT, 'snake_case.gd');
      await writeFile(
        file,
        `extends Node

var player_health = 100

func update_health(new_value):
  player_health = new_value
`
      );

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['snake_case.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'naming_conventions')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(true);
    });

    it('should warn for camelCase names', async () => {
      const file = join(TEST_PROJECT, 'camelCase.gd');
      await writeFile(
        file,
        `extends Node

var playerHealth = 100

func updateHealth(newValue):
  playerHealth = newValue
`
      );

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['camelCase.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'naming_conventions')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Addon Integration Rule', () => {
    it('should pass for properly configured addons', async () => {
      await mkdir(join(TEST_PROJECT, 'addons', 'my_addon'), {
        recursive: true,
      });
      await writeFile(join(TEST_PROJECT, 'addons/my_addon/plugin.cfg'), '');

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['addons/my_addon/plugin.cfg', 'addons/my_addon/plugin.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'addon_integration')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(true);
    });

    it('should warn for addons without plugin.cfg', async () => {
      await mkdir(join(TEST_PROJECT, 'addons', 'bad_addon'), {
        recursive: true,
      });

      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['addons/bad_addon/plugin.gd'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'addon_integration')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('Directory Organization Rule', () => {
    it('should pass for projects with standard structure', async () => {
      const ctx: AuditContext = {
        projectPath: TEST_PROJECT,
        files: ['scripts/player.gd', 'scenes/main.tscn', 'assets/icon.png'],
      };

      const rule = ALL_RULES.find((r) => r.id === 'directory_organization')!;
      const result = await rule.check(ctx);

      expect(result.passed).toBe(true);
    });
  });

  describe('Metrics Collection', () => {
    it('should collect LOC metrics', async () => {
      const file1 = join(TEST_PROJECT, 'file1.gd');
      const file2 = join(TEST_PROJECT, 'file2.gd');
      await writeFile(file1, 'extends Node\n'.repeat(100));
      await writeFile(file2, 'extends Node\n'.repeat(200));

      const metrics = await collectMetrics(TEST_PROJECT, [
        'file1.gd',
        'file2.gd',
      ]);

      expect(metrics.loc.total).toBeGreaterThanOrEqual(300);
      expect(metrics.loc.byFile['file1.gd']).toBeGreaterThanOrEqual(100);
      expect(metrics.loc.byFile['file2.gd']).toBeGreaterThanOrEqual(200);
      expect(metrics.loc.average).toBeGreaterThanOrEqual(150);
    });

    it('should calculate complexity', async () => {
      const file = join(TEST_PROJECT, 'complex.gd');
      await writeFile(
        file,
        `extends Node
func test():
  if true:
    for i in range(10):
      while i > 0:
        pass
`
      );

      const metrics = await collectMetrics(TEST_PROJECT, ['complex.gd']);

      expect(metrics.complexity.total).toBeGreaterThan(0);
      expect(metrics.complexity.byFile['complex.gd']).toBeGreaterThan(0);
    });

    it('should count file types', async () => {
      const metrics = await collectMetrics(TEST_PROJECT, [
        'file1.gd',
        'file2.gd',
        'scene.tscn',
        'resource.tres',
      ]);

      expect(metrics.files.total).toBe(4);
      expect(metrics.files.gdscript).toBe(2);
      expect(metrics.files.scenes).toBe(1);
      expect(metrics.files.resources).toBe(1);
    });

    it('should get complexity breakdown', async () => {
      const metrics = {
        loc: { total: 0, byFile: {}, average: 0 },
        complexity: {
          total: 0,
          byFile: {
            'low.gd': 5,
            'medium.gd': 15,
            'high.gd': 25,
          },
          average: 15,
          max: 25,
          maxFile: 'high.gd',
        },
        files: { total: 3, gdscript: 3, scenes: 0, resources: 0 },
        testCoverage: 0,
      };

      const breakdown = getComplexityBreakdown(metrics);

      expect(breakdown.low).toBe(1);
      expect(breakdown.medium).toBe(1);
      expect(breakdown.high).toBe(1);
    });

    it('should get top complex files', async () => {
      const metrics = {
        loc: { total: 0, byFile: {}, average: 0 },
        complexity: {
          total: 0,
          byFile: {
            'a.gd': 10,
            'b.gd': 30,
            'c.gd': 20,
          },
          average: 20,
          max: 30,
          maxFile: 'b.gd',
        },
        files: { total: 3, gdscript: 3, scenes: 0, resources: 0 },
        testCoverage: 0,
      };

      const top = getTopComplexFiles(metrics, 2);

      expect(top.length).toBe(2);
      expect(top[0].file).toBe('b.gd');
      expect(top[0].complexity).toBe(30);
      expect(top[1].file).toBe('c.gd');
      expect(top[1].complexity).toBe(20);
    });

    it('should get top largest files', async () => {
      const metrics = {
        loc: {
          total: 0,
          byFile: {
            'a.gd': 100,
            'b.gd': 300,
            'c.gd': 200,
          },
          average: 200,
        },
        complexity: { total: 0, byFile: {}, average: 0, max: 0, maxFile: '' },
        files: { total: 3, gdscript: 3, scenes: 0, resources: 0 },
        testCoverage: 0,
      };

      const top = getTopLargestFiles(metrics, 2);

      expect(top.length).toBe(2);
      expect(top[0].file).toBe('b.gd');
      expect(top[0].loc).toBe(300);
    });
  });
});
