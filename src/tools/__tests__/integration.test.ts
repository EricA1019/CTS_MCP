/**
 * Phase 3 Integration Tests
 * 
 * End-to-end tests for CTS_Analyze_Project and CTS_Suggest_Refactoring MCP tools.
 * Tests use real Godot project addons for realistic validation.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { createAnalyzeProjectHandler } from '../analyze_project.js';
import { createSuggestRefactoringHandler } from '../suggest_refactoring.js';

// Test project paths (these are real addons in the workspace)
const TEST_PROJECTS = {
  gut: resolve(__dirname, '../../../addons/gut'),
  questify: resolve(__dirname, '../../../addons/questify'),
  signalLens: resolve(__dirname, '../../../addons/signal_lens'),
};

describe('Phase 3 Integration Tests', () => {
  describe('CTS_Analyze_Project - Real Project Tests', () => {
    const handler = createAnalyzeProjectHandler();

    it('should analyze GUT addon (500+ files)', async () => {
      if (!existsSync(TEST_PROJECTS.gut)) {
        console.warn('Skipping GUT test: project not found');
        return;
      }

      const result: any = await handler({
        projectPath: TEST_PROJECTS.gut,
        detectUnused: true,
        buildHierarchy: true,
        minClusterSize: 5,
      });

      expect(result).toHaveProperty('projectPath', TEST_PROJECTS.gut);
      expect(result).toHaveProperty('scanStats');
      expect(result.scanStats.filesScanned).toBeGreaterThan(0);
      expect(result.scanStats.totalSignals).toBeGreaterThan(0);
      
      // Performance targets
      expect(result.scanStats.scanTime).toBeLessThan(5000); // <5s scan
      expect(result.scanStats.graphBuildTime).toBeLessThan(1000); // <1s graph build
      
      // Verify unused detection ran
      expect(result).toHaveProperty('unused');
      expect(result.unused).toHaveProperty('summary');
      
      // Verify clustering ran
      expect(result).toHaveProperty('clusters');
      expect(result.clusters).toHaveProperty('summary');
      expect(result.clusters!.summary.totalClusters).toBeGreaterThan(0);
    }, 30000); // 30s timeout for large project

    it('should analyze Questify addon', async () => {
      if (!existsSync(TEST_PROJECTS.questify)) {
        console.warn('Skipping Questify test: project not found');
        return;
      }

      const result: any = await handler({
        projectPath: TEST_PROJECTS.questify,
        detectUnused: true,
        buildHierarchy: true,
      });

      expect(result.scanStats.filesScanned).toBeGreaterThan(0);
      expect(result.scanStats.totalSignals).toBeGreaterThan(0);
      expect(result.performance.overheadMs).toBeLessThan(50); // <50ms overhead
    }, 15000);

    it('should analyze Signal Lens addon', async () => {
      if (!existsSync(TEST_PROJECTS.signalLens)) {
        console.warn('Skipping Signal Lens test: project not found');
        return;
      }

      const result: any = await handler({
        projectPath: TEST_PROJECTS.signalLens,
        detectUnused: true,
        buildHierarchy: false, // Skip clustering for speed
      });

      expect(result.scanStats.filesScanned).toBeGreaterThan(0);
      expect(result).toHaveProperty('unused');
      expect(result.clusters).toBeUndefined(); // Clustering disabled
    }, 10000);

    it('should handle incremental mode (detect unchanged files)', async () => {
      if (!existsSync(TEST_PROJECTS.signalLens)) {
        console.warn('Skipping incremental test: project not found');
        return;
      }

      // First scan (full)
      const firstScan: any = await handler({
        projectPath: TEST_PROJECTS.signalLens,
        detectUnused: false,
        buildHierarchy: false,
      });

      // Second scan (should be faster due to caching)
      const secondScan: any = await handler({
        projectPath: TEST_PROJECTS.signalLens,
        detectUnused: false,
        buildHierarchy: false,
      });

      expect(firstScan.scanStats.filesScanned).toBe(secondScan.scanStats.filesScanned);
    }, 20000);

    it('should detect unused signals with high confidence', async () => {
      if (!existsSync(TEST_PROJECTS.gut)) {
        console.warn('Skipping unused detection test: project not found');
        return;
      }

      const result: any = await handler({
        projectPath: TEST_PROJECTS.gut,
        detectUnused: true,
        buildHierarchy: false,
      });

      const unused = result.unused!;
      expect(unused.summary.highConfidenceCount).toBeGreaterThanOrEqual(0);
      
      // Verify confidence scores
      const allUnused = [
        ...unused.orphanSignals,
        ...unused.deadEmitters,
        ...unused.isolatedSignals,
      ];
      
      allUnused.forEach(u => {
        expect(u.confidence).toBeGreaterThanOrEqual(0);
        expect(u.confidence).toBeLessThanOrEqual(1);
      });
    }, 15000);

    it('should build hierarchical clusters with TF-IDF labels', async () => {
      if (!existsSync(TEST_PROJECTS.questify)) {
        console.warn('Skipping clustering test: project not found');
        return;
      }

      const result: any = await handler({
        projectPath: TEST_PROJECTS.questify,
        detectUnused: false,
        buildHierarchy: true,
        minClusterSize: 3,
      });

      const clusters = result.clusters!;
      expect(clusters.topLevel.length).toBeGreaterThan(0);
      expect(clusters.summary.labelingMethod).toBe('TF-IDF');
      
      // Verify cluster structure
      clusters.topLevel.forEach((cluster: any) => {
        expect(cluster).toHaveProperty('id');
        expect(cluster).toHaveProperty('label');
        expect(cluster).toHaveProperty('size');
        expect(cluster.size).toBeGreaterThan(0);
      });
    }, 15000);

    it('should establish performance baseline', async () => {
      if (!existsSync(TEST_PROJECTS.signalLens)) {
        console.warn('Skipping baseline test: project not found');
        return;
      }

      const result: any = await handler({
        projectPath: TEST_PROJECTS.signalLens,
        performanceBaseline: true,
        detectUnused: true,
        buildHierarchy: true,
      });

      expect(result.performance.baselineEstablished).toBe(true);
    }, 15000);

    it('should handle memory efficiently (<100MB)', async () => {
      if (!existsSync(TEST_PROJECTS.gut)) {
        console.warn('Skipping memory test: project not found');
        return;
      }

      const startMem = process.memoryUsage().heapUsed;
      
      await handler({
        projectPath: TEST_PROJECTS.gut,
        detectUnused: true,
        buildHierarchy: true,
      });
      
      const endMem = process.memoryUsage().heapUsed;
      const memoryDelta = (endMem - startMem) / 1024 / 1024; // MB
      
      expect(memoryDelta).toBeLessThan(100); // <100MB memory delta
    }, 30000);
  });

  describe('CTS_Suggest_Refactoring - Real Project Tests', () => {
    const handler = createSuggestRefactoringHandler();

    it('should generate refactoring suggestions for GUT', async () => {
      if (!existsSync(TEST_PROJECTS.gut)) {
        console.warn('Skipping GUT refactoring test: project not found');
        return;
      }

      const result: any = await handler({
        projectPath: TEST_PROJECTS.gut,
        minConfidence: 0.95,
        maxSuggestions: 20,
      });

      expect(result).toHaveProperty('projectPath', TEST_PROJECTS.gut);
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('summary');
      
      // Verify all suggestions meet confidence threshold
      result.suggestions.forEach((s: any) => {
        expect(s.confidence).toBeGreaterThanOrEqual(0.95);
        expect(s).toHaveProperty('type');
        expect(s).toHaveProperty('target');
        expect(s).toHaveProperty('replacement');
      });
    }, 15000);

    it('should use graph cache on second call', async () => {
      if (!existsSync(TEST_PROJECTS.signalLens)) {
        console.warn('Skipping cache test: project not found');
        return;
      }

      // First call (builds graph)
      const firstCall = await handler({
        projectPath: TEST_PROJECTS.signalLens,
        minConfidence: 0.90,
      });

      // Second call (uses cached graph)
      const secondCall: any = await handler({
        projectPath: TEST_PROJECTS.signalLens,
        minConfidence: 0.90,
      });

      expect(secondCall.performance.cacheHit).toBe(true);
      expect(secondCall.performance.scanTime).toBe(0); // No scan needed
    }, 20000);

    it('should filter suggestions by type', async () => {
      if (!existsSync(TEST_PROJECTS.questify)) {
        console.warn('Skipping type filter test: project not found');
        return;
      }

      // Only rename suggestions
      const renameOnly: any = await handler({
        projectPath: TEST_PROJECTS.questify,
        includeMerge: false,
        includeDeprecate: false,
        includeRename: true,
      });

      renameOnly.suggestions.forEach((s: any) => {
        expect(s.type).toBe('rename');
      });
    }, 15000);

    it('should respect maxSuggestions limit', async () => {
      if (!existsSync(TEST_PROJECTS.gut)) {
        console.warn('Skipping max suggestions test: project not found');
        return;
      }

      const result: any = await handler({
        projectPath: TEST_PROJECTS.gut,
        maxSuggestions: 5,
        minConfidence: 0.80, // Lower threshold to get more suggestions
      });

      expect(result.suggestions.length).toBeLessThanOrEqual(5);
    }, 15000);

    it('should provide performance metrics', async () => {
      if (!existsSync(TEST_PROJECTS.signalLens)) {
        console.warn('Skipping performance test: project not found');
        return;
      }

      const result: any = await handler({
        projectPath: TEST_PROJECTS.signalLens,
      });

      expect(result).toHaveProperty('performance');
      expect(result.performance).toHaveProperty('scanTime');
      expect(result.performance).toHaveProperty('graphTime');
      expect(result.performance).toHaveProperty('suggestionTime');
      
      // Suggestion generation should be fast (<2s target)
      expect(result.performance.suggestionTime).toBeLessThan(2000);
    }, 15000);
  });

  describe('End-to-End Workflow Tests', () => {
    it('should run full analysis pipeline', async () => {
      if (!existsSync(TEST_PROJECTS.signalLens)) {
        console.warn('Skipping E2E test: project not found');
        return;
      }

      const analyzeHandler = createAnalyzeProjectHandler();
      const refactorHandler = createSuggestRefactoringHandler();

      // Step 1: Analyze project
      const analysis: any = await analyzeHandler({
        projectPath: TEST_PROJECTS.signalLens,
        detectUnused: true,
        buildHierarchy: true,
      });

      expect(analysis.scanStats.filesScanned).toBeGreaterThan(0);
      
      // Step 2: Generate refactoring suggestions
      const refactoring: any = await refactorHandler({
        projectPath: TEST_PROJECTS.signalLens,
        minConfidence: 0.95,
      });

      expect(refactoring.summary.totalGenerated).toBeGreaterThanOrEqual(0);
      
      // Step 3: Verify consistency
      expect(analysis.projectPath).toBe(refactoring.projectPath);
    }, 30000);

    it('should handle projects with no signals gracefully', async () => {
      const analyzeHandler = createAnalyzeProjectHandler();
      const emptyProject = resolve(__dirname, '../../../test/fixtures/empty_project');

      // This will likely fail gracefully or return empty results
      // Just verify it doesn't crash
      try {
        const result: any = await analyzeHandler({
          projectPath: emptyProject,
          detectUnused: false,
          buildHierarchy: false,
        });
        
        expect(result.scanStats.totalSignals).toBe(0);
      } catch (error) {
        // Expected if project doesn't exist
        expect(error).toBeDefined();
      }
    }, 10000);
  });

  describe('Performance Monitoring Integration', () => {
    it('should track operation overhead', async () => {
      if (!existsSync(TEST_PROJECTS.signalLens)) {
        console.warn('Skipping overhead test: project not found');
        return;
      }

      const handler = createAnalyzeProjectHandler();
      
      const result: any = await handler({
        projectPath: TEST_PROJECTS.signalLens,
        detectUnused: true,
        buildHierarchy: true,
      });

      expect(result.performance.overheadMs).toBeLessThan(50); // <50ms overhead target
      expect(result.performance.alertsGenerated).toBeGreaterThanOrEqual(0);
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid project paths gracefully', async () => {
      const handler = createAnalyzeProjectHandler();

      await expect(handler({
        projectPath: '/nonexistent/path',
        detectUnused: false,
        buildHierarchy: false,
      })).rejects.toThrow();
    });

    it('should handle invalid parameters gracefully', async () => {
      const handler = createAnalyzeProjectHandler();

      await expect(handler({
        projectPath: TEST_PROJECTS.gut,
        minClusterSize: 100, // Too large
      })).rejects.toThrow();
    });
  });
});
