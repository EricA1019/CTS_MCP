/**
 * Project Scanner Tests
 * 
 * Unit and integration tests for ProjectScanner with parallel parsing.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProjectScanner } from '../../src/artifacts/scanner/project_scanner.js';
import { TreeSitterBridge } from '../../src/artifacts/parsers/tree_sitter_bridge.js';
import { GraphCacheManager } from '../../src/artifacts/scanner/cache_manager.js';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { ScanStats } from '../../src/artifacts/scanner/types.js';

describe('ProjectScanner', () => {
  let scanner: ProjectScanner;
  let testProjectDir: string;

  beforeEach(async () => {
    scanner = new ProjectScanner();
    testProjectDir = join(tmpdir(), `test_project_${Date.now()}`);
    await mkdir(testProjectDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('File Discovery', () => {
    it('should discover all .gd files in project', async () => {
      // Create test files
      await writeFile(join(testProjectDir, 'main.gd'), 'extends Node');
      await writeFile(join(testProjectDir, 'player.gd'), 'extends CharacterBody2D');

      await mkdir(join(testProjectDir, 'scripts'));
      await writeFile(join(testProjectDir, 'scripts', 'utils.gd'), 'class_name Utils');

      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees.length).toBe(3);
      expect(trees.every(t => t.filePath.endsWith('.gd'))).toBe(true);
    });

    it('should exclude .godot directory', async () => {
      // Create .godot directory (Godot build cache)
      await mkdir(join(testProjectDir, '.godot'), { recursive: true });
      await writeFile(join(testProjectDir, '.godot', 'cache.gd'), 'should be excluded');

      // Create normal file
      await writeFile(join(testProjectDir, 'main.gd'), 'extends Node');

      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees.length).toBe(1);
      expect(trees[0].filePath).toContain('main.gd');
      expect(trees[0].filePath).not.toContain('.godot');
    });

    it('should exclude node_modules', async () => {
      await mkdir(join(testProjectDir, 'node_modules'), { recursive: true });
      await writeFile(join(testProjectDir, 'node_modules', 'lib.gd'), 'should be excluded');

      await writeFile(join(testProjectDir, 'script.gd'), 'extends Node');

      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees.length).toBe(1);
      expect(trees[0].filePath).toContain('script.gd');
    });

    it('should handle empty project', async () => {
      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees).toEqual([]);
    });

    it('should recurse into subdirectories', async () => {
      await mkdir(join(testProjectDir, 'a', 'b', 'c'), { recursive: true });
      await writeFile(join(testProjectDir, 'a', 'b', 'c', 'deep.gd'), 'extends Node');

      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees.length).toBe(1);
      expect(trees[0].filePath).toContain(join('a', 'b', 'c', 'deep.gd'));
    });
  });

  describe('Parsing Modes', () => {
    it('should parse all files in full mode', async () => {
      await writeFile(join(testProjectDir, 'file1.gd'), 'extends Node');
      await writeFile(join(testProjectDir, 'file2.gd'), 'extends Node');

      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees.length).toBe(2);

      const stats = scanner.getStats();
      expect(stats.filesParsed).toBe(2);
      expect(stats.filesSkipped).toBe(0);
    });

    it('should skip cached files in incremental mode', async () => {
      await writeFile(join(testProjectDir, 'cached.gd'), 'extends Node');
      await writeFile(join(testProjectDir, 'fresh.gd'), 'extends Node');

      // First scan (populate cache)
      await scanner.scanProject(testProjectDir, 'incremental');

      // Second scan (should use cache)
      const trees = await scanner.scanProject(testProjectDir, 'incremental');

      const stats = scanner.getStats();
      expect(stats.filesSkipped).toBe(2); // Both files cached
      expect(stats.filesParsed).toBe(0);
    });
  });

  describe('Parallel vs Serial Parsing', () => {
    it('should use serial mode for <8 files', async () => {
      // Create 5 files (below parallel threshold)
      for (let i = 0; i < 5; i++) {
        await writeFile(join(testProjectDir, `file${i}.gd`), 'extends Node');
      }

      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees.length).toBe(5);

      const stats = scanner.getStats();
      expect(stats.workerCount).toBe(0); // Serial mode
    });

    it('should use parallel mode for ≥8 files', async () => {
      // Create 10 files (above parallel threshold)
      for (let i = 0; i < 10; i++) {
        await writeFile(join(testProjectDir, `file${i}.gd`), 'extends Node');
      }

      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees.length).toBe(10);

      const stats = scanner.getStats();
      expect(stats.workerCount).toBeGreaterThan(0); // Parallel mode
    });
  });

  describe('Event Emissions', () => {
    it('should emit scan_started event', async () => {
      const startedHandler = jest.fn();
      scanner.on('project:scan_started', startedHandler);

      await writeFile(join(testProjectDir, 'test.gd'), 'extends Node');
      await scanner.scanProject(testProjectDir, 'full');

      expect(startedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          projectPath: expect.any(String),
          mode: 'full',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should emit scan_completed event', async () => {
      const completedHandler = jest.fn();
      scanner.on('project:scan_completed', completedHandler);

      await writeFile(join(testProjectDir, 'test.gd'), 'extends Node');
      await scanner.scanProject(testProjectDir, 'full');

      expect(completedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          filesDiscovered: 1,
          filesParsed: 1,
          treeCount: 1,
          durationMs: expect.any(Number),
        })
      );
    });

    it('should emit scan_failed event on error', async () => {
      const failedHandler = jest.fn();
      scanner.on('project:scan_failed', failedHandler);

      // Try to scan non-existent directory
      try {
        await scanner.scanProject('/nonexistent/project', 'full');
      } catch (error) {
        // Expected to fail
      }

      expect(failedHandler).toHaveBeenCalled();
    });
  });

  describe('AST Metadata', () => {
    it('should include file metadata in results', async () => {
      const testContent = 'extends Node\nsignal test_signal\nfunc _ready():\n\tpass';
      await writeFile(join(testProjectDir, 'test.gd'), testContent);

      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees.length).toBe(1);
      const treeData = trees[0];

      expect(treeData.filePath).toContain('test.gd');
      expect(treeData.sizeBytes).toBeGreaterThan(0);
      expect(treeData.parseDurationMs).toBeGreaterThanOrEqual(0);
      expect(treeData.mtime).toBeGreaterThan(0);
      expect(treeData.tree).toBeDefined();
    });

    it('should track parsing duration', async () => {
      await writeFile(join(testProjectDir, 'test.gd'), 'extends Node');

      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees[0].parseDurationMs).toBeGreaterThanOrEqual(0);
      expect(trees[0].parseDurationMs).toBeLessThan(1000); // Should be fast
    });
  });

  describe('Statistics', () => {
    it('should track scan statistics', async () => {
      for (let i = 0; i < 5; i++) {
        await writeFile(join(testProjectDir, `file${i}.gd`), 'extends Node');
      }

      await scanner.scanProject(testProjectDir, 'full');

      const stats = scanner.getStats();

      expect(stats.filesDiscovered).toBe(5);
      expect(stats.filesParsed).toBe(5);
      expect(stats.filesSkipped).toBe(0);
      expect(stats.durationMs).toBeGreaterThan(0);
      expect(stats.peakMemoryBytes).toBeGreaterThan(0);
    });

    it('should reset statistics between scans', async () => {
      await writeFile(join(testProjectDir, 'test.gd'), 'extends Node');

      // First scan
      await scanner.scanProject(testProjectDir, 'full');
      const stats1 = scanner.getStats();

      // Second scan
      await scanner.scanProject(testProjectDir, 'full');
      const stats2 = scanner.getStats();

      // Stats should be independent (not cumulative)
      expect(stats2.filesDiscovered).toBe(stats1.filesDiscovered);
    });
  });

  describe('Performance', () => {
    it('should scan 100 files in reasonable time', async () => {
      // Create 100 small files
      for (let i = 0; i < 100; i++) {
        await writeFile(join(testProjectDir, `file${i}.gd`), 'extends Node\n');
      }

      const startTime = Date.now();
      const trees = await scanner.scanProject(testProjectDir, 'full');
      const duration = Date.now() - startTime;

      expect(trees.length).toBe(100);
      expect(duration).toBeLessThan(10000); // <10s for 100 files (target: <5s for 500)
    }, 15000); // 15s timeout

    it('should stay under memory budget', async () => {
      // Create 50 files
      for (let i = 0; i < 50; i++) {
        const content = `extends Node\n${'# Comment line\n'.repeat(100)}`; // ~1.5KB each
        await writeFile(join(testProjectDir, `file${i}.gd`), content);
      }

      const memBefore = process.memoryUsage().heapUsed;
      await scanner.scanProject(testProjectDir, 'full');
      const memAfter = process.memoryUsage().heapUsed;

      const memDelta = memAfter - memBefore;
      expect(memDelta).toBeLessThan(100 * 1024 * 1024); // <100MB
    }, 20000);
  });

  describe('Error Handling', () => {
    it('should handle non-existent project path', async () => {
      await expect(
        scanner.scanProject('/nonexistent/project', 'full')
      ).rejects.toThrow();
    });

    it('should handle parse errors gracefully', async () => {
      // Create file with invalid syntax (tree-sitter is fault-tolerant)
      await writeFile(join(testProjectDir, 'invalid.gd'), '@@@ INVALID SYNTAX @@@');

      // Should still complete scan (may include error node in AST)
      const trees = await scanner.scanProject(testProjectDir, 'full');

      expect(trees.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Integration with Cache Manager', () => {
    it('should use provided cache manager', async () => {
      const customCache = new GraphCacheManager();
      const scannerWithCache = new ProjectScanner(undefined, customCache);

      await writeFile(join(testProjectDir, 'test.gd'), 'extends Node');

      await scannerWithCache.scanProject(testProjectDir, 'incremental');

      expect(customCache.getCacheSize()).toBe(1);
    });

    it('should access cache manager for debugging', () => {
      const cacheManager = scanner.getCacheManager();

      expect(cacheManager).toBeInstanceOf(GraphCacheManager);
    });
  });
});
