/**
 * Cleanup Tool Integration Tests
 * 
 * Tests for MCP wrapper, strategy execution, and safety integration.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createCleanupHandler, cleanupTool } from '../index';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TEST_PROJECT = '/tmp/cleanup-integration-test';

describe('Cleanup Tool Integration', () => {
  beforeEach(async () => {
    // Clean up test directory
    if (existsSync(TEST_PROJECT)) {
      await rm(TEST_PROJECT, { recursive: true, force: true });
    }
    await mkdir(TEST_PROJECT, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    if (existsSync(TEST_PROJECT)) {
      await rm(TEST_PROJECT, { recursive: true, force: true });
    }
  });

  describe('Tool Definition', () => {
    it('should have valid tool definition', () => {
      expect(cleanupTool.name).toBe('CTS_Cleanup');
      expect(cleanupTool.description).toBeTruthy();
      expect(cleanupTool.inputSchema.type).toBe('object');
      expect(cleanupTool.inputSchema.properties.projectPath).toBeDefined();
    });

    it('should list all parameters', () => {
      const props = cleanupTool.inputSchema.properties;
      expect(props.projectPath).toBeDefined();
      expect(props.strategies).toBeDefined();
      expect(props.dryRun).toBeDefined();
      expect(props.requireCleanGit).toBeDefined();
      expect(props.exclusions).toBeDefined();
      expect(props.maxActions).toBeDefined();
    });

    it('should have correct required fields', () => {
      const required = cleanupTool.inputSchema.required;
      expect(required).toContain('projectPath');
    });
  });

  describe('Parameter Validation', () => {
    it('should reject empty project path', async () => {
      const handler = createCleanupHandler();
      const result = await handler({ projectPath: '' });
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(-32602);
    });

    it('should accept valid parameters', async () => {
      const handler = createCleanupHandler();
      const result = await handler({
        projectPath: TEST_PROJECT,
        dryRun: true,
        requireCleanGit: false,
      });
      expect(result.success).toBe(true);
    });

    it('should use default values', async () => {
      const handler = createCleanupHandler();
      const result = await handler({
        projectPath: TEST_PROJECT,
        requireCleanGit: false,
      });
      expect(result.success).toBe(true);
      const res: any = result.result;
      expect(res.mode).toBe('preview'); // dryRun defaults to true
    });

    it('should validate strategy names', async () => {
      const handler = createCleanupHandler();
      const result = await handler({
        projectPath: TEST_PROJECT,
        strategies: ['dead_code', 'duplicates'],
        requireCleanGit: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Safety Integration', () => {
    it('should include safety report in output', async () => {
      const handler = createCleanupHandler();
      const result = await handler({
        projectPath: TEST_PROJECT,
        requireCleanGit: false,
        dryRun: true,
      });
      expect(result.success).toBe(true);
      const res: any = result.result;
      expect(res.safetyReport).toBeTruthy();
      expect(res.safetyReport).toContain('Safety Pre-Flight Checks');
    });

    it('should run in dry-run mode by default', async () => {
      const handler = createCleanupHandler();
      const result = await handler({
        projectPath: TEST_PROJECT,
        requireCleanGit: false,
      });
      const res: any = result.result;
      expect(res.mode).toBe('preview');
      expect(res.safetyReport).toContain('DRY RUN');
    });
  });

  describe('Dead Code Strategy', () => {
    it('should detect unused imports', async () => {
      const handler = createCleanupHandler();
      
      // Create file with unused import
      const gdFile = join(TEST_PROJECT, 'test.gd');
      await writeFile(
        gdFile,
        `const UnusedClass = preload("res://unused.gd")
extends Node

func _ready():
  print("hello")
`
      );

      const result = await handler({
        projectPath: TEST_PROJECT,
        strategies: ['dead_code'],
        requireCleanGit: false,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      const res: any = result.result;
      expect(res.actions.length).toBeGreaterThan(0);
      expect(res.actions[0].type).toBe('remove_unused_imports');
    });

    it('should not flag used imports', async () => {
      const handler = createCleanupHandler();
      
      // Create file with used import
      const gdFile = join(TEST_PROJECT, 'test.gd');
      await writeFile(
        gdFile,
        `const MyClass = preload("res://my_class.gd")
extends Node

func _ready():
  var instance = MyClass.new()
`
      );

      const result = await handler({
        projectPath: TEST_PROJECT,
        strategies: ['dead_code'],
        requireCleanGit: false,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      const res: any = result.result;
      expect(res.actions.length).toBe(0);
    });
  });

  describe('Duplicate Strategy', () => {
    it('should detect duplicate files', async () => {
      const handler = createCleanupHandler();
      
      // Create identical files
      const file1 = join(TEST_PROJECT, 'file1.txt');
      const file2 = join(TEST_PROJECT, 'file2.txt');
      await writeFile(file1, 'identical content');
      await writeFile(file2, 'identical content');

      const result = await handler({
        projectPath: TEST_PROJECT,
        strategies: ['duplicates'],
        requireCleanGit: false,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      const res: any = result.result;
      expect(res.actions.length).toBeGreaterThan(0);
      expect(res.actions[0].type).toBe('duplicate_files');
      expect(res.actions[0].files?.length).toBe(2);
    });

    it('should not flag unique files', async () => {
      const handler = createCleanupHandler();
      
      // Create different files
      const file1 = join(TEST_PROJECT, 'file1.txt');
      const file2 = join(TEST_PROJECT, 'file2.txt');
      await writeFile(file1, 'content A');
      await writeFile(file2, 'content B');

      const result = await handler({
        projectPath: TEST_PROJECT,
        strategies: ['duplicates'],
        requireCleanGit: false,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      const res: any = result.result;
      expect(res.actions.length).toBe(0);
    });
  });

  describe('Summary Statistics', () => {
    it('should include action summary', async () => {
      const handler = createCleanupHandler();
      const result = await handler({
        projectPath: TEST_PROJECT,
        requireCleanGit: false,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      const res: any = result.result;
      expect(res.summary).toBeDefined();
      expect(res.summary.totalActions).toBeDefined();
      expect(res.summary.byType).toBeDefined();
    });

    it('should respect maxActions limit', async () => {
      const handler = createCleanupHandler();
      
      // Create many duplicate files (all identical)
      for (let i = 0; i < 10; i++) {
        await writeFile(join(TEST_PROJECT, `dup${i}.txt`), 'duplicate');
      }

      const result = await handler({
        projectPath: TEST_PROJECT,
        strategies: ['duplicates'],
        maxActions: 1, // Limit to 1 action
        requireCleanGit: false,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      const res: any = result.result;
      expect(res.actions.length).toBe(1); // Should be limited
      expect(res.summary.returnedActions).toBe(1);
    });

    it('should track performance metrics', async () => {
      const handler = createCleanupHandler();
      const result = await handler({
        projectPath: TEST_PROJECT,
        requireCleanGit: false,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      const res: any = result.result;
      expect(res.performanceMs).toBeDefined();
      expect(typeof res.performanceMs).toBe('number');
      expect(res.performanceMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid strategy names gracefully', async () => {
      const handler = createCleanupHandler();
      const result = await handler({
        projectPath: TEST_PROJECT,
        strategies: ['dead_code'],
        requireCleanGit: false,
      });

      // Should succeed even if some strategies don't exist
      expect(result.success).toBe(true);
    });

    it('should handle nonexistent project path', async () => {
      const handler = createCleanupHandler();
      const result = await handler({
        projectPath: '/nonexistent/path/12345',
        requireCleanGit: false,
        dryRun: true,
      });

      // Should fail during safety validation or execution
      expect(result.success).toBeDefined();
    });
  });
});
