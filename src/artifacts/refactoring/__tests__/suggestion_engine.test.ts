/**
 * Refactoring Engine Tests - HOP 3.4
 * 
 * Tests for refactoring suggestion generation with similarity detection and naming validation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { RefactoringEngine } from '../suggestion_engine.js';
import { RefactorType } from '../types.js';
import type { SignalGraph } from '../../graph/types.js';
import type { SignalDefinition } from '../../parsers/gdscript_parser.js';

describe('RefactoringEngine', () => {
  let engine: RefactoringEngine;

  beforeEach(() => {
    engine = new RefactoringEngine();
  });

  describe('Similarity Detection', () => {
    it('should detect similar signals with distance 1', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/player.gd')]],
          ['health_change', [createDef('health_change', '/player.gd')]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      const mergeSuggestions = suggestions.filter(s => s.type === RefactorType.Merge);
      expect(mergeSuggestions).toHaveLength(1);
      expect(mergeSuggestions[0].distance).toBe(1);
      expect(mergeSuggestions[0].confidence).toBeGreaterThanOrEqual(0.98);
    });

    it('should detect similar signals with distance 2', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['player_died', [createDef('player_died', '/player.gd')]],
          ['player_dead', [createDef('player_dead', '/player.gd')]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      const mergeSuggestions = suggestions.filter(s => s.type === RefactorType.Merge);
      expect(mergeSuggestions).toHaveLength(1);
      expect(mergeSuggestions[0].distance).toBe(2);
      expect(mergeSuggestions[0].confidence).toBeGreaterThanOrEqual(0.98);
    });

    it('should give higher confidence for snake_case signals', async () => {
      const graph1 = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/a.gd')]],
          ['health_change', [createDef('health_change', '/a.gd')]],
        ]),
      });

      const graph2 = createTestGraph({
        definitions: new Map([
          ['healthChanged', [createDef('healthChanged', '/b.gd')]],
          ['healthChange', [createDef('healthChange', '/b.gd')]],
        ]),
      });

      const suggestions1 = await engine.generateSuggestions(graph1);
      const suggestions2 = await engine.generateSuggestions(graph2);

      const merge1 = suggestions1.find(s => s.type === RefactorType.Merge);
      const merge2 = suggestions2.find(s => s.type === RefactorType.Merge);

      expect(merge1?.confidence).toBeGreaterThan(merge2?.confidence ?? 0);
    });

    it('should not suggest merge for distance > 2', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/a.gd')]],
          ['health_modify', [createDef('health_modify', '/a.gd')]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      const mergeSuggestions = suggestions.filter(s => s.type === RefactorType.Merge);
      expect(mergeSuggestions).toHaveLength(0);
    });
  });

  describe('Early Termination', () => {
    it('should skip comparisons with different first character', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/a.gd')]],
          ['player_died', [createDef('player_died', '/b.gd')]],
          ['enemy_spawned', [createDef('enemy_spawned', '/c.gd')]],
        ]),
      });

      await engine.generateSuggestions(graph);
      const stats = engine.getStats();

      // 3 signals → 3 comparisons total (health-player, health-enemy, player-enemy)
      // All have different first chars → all skipped
      expect(stats.similarityStats.comparisonsSkipped).toBe(3);
      expect(stats.similarityStats.comparisonsPerformed).toBe(0);
    });

    it('should skip comparisons with length difference > 3', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['hi', [createDef('hi', '/a.gd')]],
          ['hello_world', [createDef('hello_world', '/b.gd')]],
        ]),
      });

      await engine.generateSuggestions(graph);
      const stats = engine.getStats();

      // Length diff: 11 - 2 = 9 > 3 → skipped
      expect(stats.similarityStats.comparisonsSkipped).toBe(1);
      expect(stats.similarityStats.comparisonsPerformed).toBe(0);
    });

    it('should perform comparisons when heuristics pass', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/a.gd')]],
          ['health_change', [createDef('health_change', '/a.gd')]],
          ['health_modify', [createDef('health_modify', '/a.gd')]],
        ]),
      });

      await engine.generateSuggestions(graph);
      const stats = engine.getStats();

      // 3 signals → 3 comparisons
      // All start with 'h' and have similar lengths
      expect(stats.similarityStats.comparisonsPerformed).toBe(3);
      expect(stats.similarityStats.comparisonsSkipped).toBe(0);
    });
  });

  describe('Naming Convention Validation', () => {
    it('should suggest rename for camelCase', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['healthChanged', [createDef('healthChanged', '/player.gd')]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      const renameSuggestion = suggestions.find(
        s => s.type === RefactorType.Rename && s.target === 'healthChanged'
      );
      expect(renameSuggestion).toBeDefined();
      expect(renameSuggestion?.replacement).toBe('health_changed');
      expect(renameSuggestion?.confidence).toBe(1.0);
    });

    it('should suggest rename for PascalCase', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['PlayerDied', [createDef('PlayerDied', '/player.gd')]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      const renameSuggestion = suggestions.find(
        s => s.type === RefactorType.Rename && s.target === 'PlayerDied'
      );
      expect(renameSuggestion).toBeDefined();
      expect(renameSuggestion?.replacement).toBe('player_died');
    });

    it('should suggest rename for spaces', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health changed', [createDef('health changed', '/player.gd')]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      const renameSuggestion = suggestions.find(
        s => s.type === RefactorType.Rename && s.target === 'health changed'
      );
      expect(renameSuggestion).toBeDefined();
      expect(renameSuggestion?.replacement).toBe('health_changed');
    });

    it('should not suggest rename for valid snake_case', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/player.gd')]],
          ['player_died', [createDef('player_died', '/player.gd')]],
          ['_private_signal', [createDef('_private_signal', '/test.gd')]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      const renameSuggestions = suggestions.filter(s => s.type === RefactorType.Rename);
      expect(renameSuggestions).toHaveLength(0);
    });

    it('should include affected files in rename suggestions', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['HealthChanged', [
            createDef('HealthChanged', '/player.gd'),
            createDef('HealthChanged', '/enemy.gd'),
          ]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      const renameSuggestion = suggestions.find(s => s.type === RefactorType.Rename);
      expect(renameSuggestion?.affectedFiles).toContain('/player.gd');
      expect(renameSuggestion?.affectedFiles).toContain('/enemy.gd');
    });
  });

  describe('Mixed Scenarios', () => {
    it('should handle both similarity and naming suggestions', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/a.gd')]],
          ['health_change', [createDef('health_change', '/a.gd')]],
          ['PlayerDied', [createDef('PlayerDied', '/b.gd')]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      
      const mergeSuggestion = suggestions.find(s => s.type === RefactorType.Merge);
      const renameSuggestion = suggestions.find(s => s.type === RefactorType.Rename);

      expect(mergeSuggestion).toBeDefined();
      expect(renameSuggestion).toBeDefined();
    });

    it('should sort suggestions by confidence (highest first)', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/a.gd')]],
          ['health_change', [createDef('health_change', '/a.gd')]],
          ['PlayerDied', [createDef('PlayerDied', '/b.gd')]],
          ['player_dead', [createDef('player_dead', '/c.gd')]],
        ]),
      });

      const suggestions = await engine.generateSuggestions(graph);

      // Rename (1.0) should come before merge (0.98-0.99)
      if (suggestions.length >= 2) {
        for (let i = 0; i < suggestions.length - 1; i++) {
          expect(suggestions[i].confidence).toBeGreaterThanOrEqual(suggestions[i + 1].confidence);
        }
      }
    });

    it('should handle empty graph', async () => {
      const graph = createTestGraph({
        definitions: new Map(),
      });

      const suggestions = await engine.generateSuggestions(graph);

      expect(suggestions).toHaveLength(0);
    });

    it('should handle large graph efficiently', async () => {
      const definitions = new Map();
      for (let i = 0; i < 300; i++) {
        definitions.set(`signal_${i}`, [createDef(`signal_${i}`, `/test_${i}.gd`)]);
      }

      const graph = createTestGraph({ definitions });

      const startTime = performance.now();
      await engine.generateSuggestions(graph);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(2000); // <2s for 300 signals
    });
  });

  describe('Statistics', () => {
    it('should track generation statistics', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/a.gd')]],
          ['health_change', [createDef('health_change', '/a.gd')]],
          ['PlayerDied', [createDef('PlayerDied', '/b.gd')]],
        ]),
      });

      await engine.generateSuggestions(graph);
      const stats = engine.getStats();

      expect(stats.totalSuggestions).toBeGreaterThanOrEqual(2);
      expect(stats.mergeSuggestions).toBeGreaterThanOrEqual(1);
      expect(stats.renameSuggestions).toBeGreaterThanOrEqual(1);
      expect(stats.durationMs).toBeGreaterThan(0);
      expect(stats.avgConfidence).toBeGreaterThan(0);
      expect(stats.avgConfidence).toBeLessThanOrEqual(1.0);
    });

    it('should track similarity detection stats', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [createDef('health_changed', '/a.gd')]],
          ['health_change', [createDef('health_change', '/a.gd')]],
          ['player_died', [createDef('player_died', '/b.gd')]],
        ]),
      });

      await engine.generateSuggestions(graph);
      const stats = engine.getStats();

      expect(stats.similarityStats.signalsAnalyzed).toBe(3);
      expect(stats.similarityStats.comparisonsPerformed).toBeGreaterThan(0);
      expect(stats.similarityStats.durationMs).toBeGreaterThan(0);
    });

    it('should reset statistics', () => {
      engine.resetStats();
      const stats = engine.getStats();

      expect(stats.totalSuggestions).toBe(0);
      expect(stats.mergeSuggestions).toBe(0);
      expect(stats.renameSuggestions).toBe(0);
      expect(stats.deprecateSuggestions).toBe(0);
      expect(stats.durationMs).toBe(0);
      expect(stats.avgConfidence).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should analyze 300 signals in <2s', async () => {
      const definitions = new Map();
      
      // Create 300 signals with realistic names
      for (let i = 0; i < 100; i++) {
        definitions.set(`health_changed_${i}`, [createDef(`health_changed_${i}`, `/a.gd`)]);
        definitions.set(`player_died_${i}`, [createDef(`player_died_${i}`, `/b.gd`)]);
        definitions.set(`enemy_spawned_${i}`, [createDef(`enemy_spawned_${i}`, `/c.gd`)]);
      }

      const graph = createTestGraph({ definitions });

      const startTime = performance.now();
      const suggestions = await engine.generateSuggestions(graph);
      const duration = performance.now() - startTime;

      console.log(`Generated ${suggestions.length} suggestions for 300 signals in ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2000);
    });

    it('should skip majority of comparisons via early termination', async () => {
      const definitions = new Map();
      
      // Create 100 signals with diverse first characters
      for (let i = 0; i < 100; i++) {
        const firstChar = String.fromCharCode(97 + (i % 26)); // a-z
        definitions.set(`${firstChar}_signal_${i}`, [createDef(`${firstChar}_signal_${i}`, `/test.gd`)]);
      }

      const graph = createTestGraph({ definitions });

      await engine.generateSuggestions(graph);
      const stats = engine.getStats();

      // Total possible comparisons: 100 * 99 / 2 = 4950
      // With early termination, should skip most
      const totalPossible = 100 * 99 / 2;
      const percentSkipped = (stats.similarityStats.comparisonsSkipped / totalPossible) * 100;

      expect(percentSkipped).toBeGreaterThan(50); // At least 50% skipped
    });
  });
});

/**
 * Helper: Create test signal graph
 */
function createTestGraph(data: {
  definitions: Map<string, SignalDefinition[]>;
}): SignalGraph {
  return {
    definitions: data.definitions,
    emissions: new Map(),
    connections: new Map(),
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 1,
      signalCount: data.definitions.size,
      emissionCount: 0,
      connectionCount: 0,
    },
  };
}

/**
 * Helper: Create signal definition
 */
function createDef(name: string, filePath: string): SignalDefinition {
  return {
    name,
    params: [],
    filePath,
    line: 1,
    source: 'test',
  };
}
