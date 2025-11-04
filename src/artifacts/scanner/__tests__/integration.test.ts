/**
 * Integration Test for Project Scanner
 * 
 * Tests scanner against small Godot addon (addons/gut with ~80 files)
 */

import { describe, it, expect } from '@jest/globals';
import { ProjectScanner } from '../project_scanner.js';
import { resolve } from 'path';

describe('ProjectScanner Integration (Real Godot Project)', () => {
  it('should scan addons/gut successfully', async () => {
    const scanner = new ProjectScanner();
    const gutPath = resolve(process.cwd(), '../../../addons/gut');

    let scanStarted = false;
    let scanCompleted = false;

    scanner.on('project:scan_started', () => {
      scanStarted = true;
    });

    scanner.on('project:scan_completed', () => {
      scanCompleted = true;
    });

    const trees = await scanner.scanProject(gutPath, 'full');

    expect(scanStarted).toBe(true);
    expect(scanCompleted).toBe(true);
    expect(trees.length).toBeGreaterThan(0);

    const stats = scanner.getStats();
    expect(stats.filesDiscovered).toBeGreaterThan(0);
    expect(stats.filesParsed).toBe(stats.filesDiscovered);
    expect(stats.durationMs).toBeGreaterThan(0);
    expect(stats.durationMs).toBeLessThan(30000); // <30s for ~80 files (generous)

    // Verify all trees have metadata
    for (const treeData of trees) {
      expect(treeData.filePath).toBeTruthy();
      expect(treeData.tree).toBeDefined();
      expect(treeData.sizeBytes).toBeGreaterThan(0);
      expect(treeData.mtime).toBeGreaterThan(0);
    }
  }, 60000); // 60s timeout

  it('should use cache in incremental mode', async () => {
    const scanner = new ProjectScanner();
    const gutPath = resolve(process.cwd(), '../../../addons/gut');

    // First scan
    await scanner.scanProject(gutPath, 'incremental');
    const stats1 = scanner.getStats();

    // Second scan (should use cache)
    await scanner.scanProject(gutPath, 'incremental');
    const stats2 = scanner.getStats();

    expect(stats2.filesSkipped).toBe(stats1.filesDiscovered);
    expect(stats2.filesParsed).toBe(0);
  }, 60000);
});
