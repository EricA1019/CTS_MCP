/**
 * Signal Graph Builder Tests - Phase 3 HOP 3.2a
 * 
 * Tests for partial graph construction (definitions + emissions).
 * 
 * Coverage:
 * - Graph construction from AST forest
 * - Bidirectional indices (signal → sites)
 * - Metadata generation
 * - Edge cases (undefined signals, unemitted signals, duplicates)
 * - Performance validation
 * - Statistics tracking
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SignalGraphBuilder } from '../signal_graph_builder.js';
import { SignalExtractor } from '../../parsers/signal_extractor.js';
import { TreeSitterBridge } from '../../parsers/tree_sitter_bridge.js';
import type { ASTForest } from '../../scanner/types.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SignalGraphBuilder', () => {
  let builder: SignalGraphBuilder;
  let extractor: SignalExtractor;
  let bridge: TreeSitterBridge;
  let testDir: string;

  beforeEach(async () => {
    extractor = new SignalExtractor();
    builder = new SignalGraphBuilder(extractor);
    bridge = new TreeSitterBridge();
    await bridge.init();

    // Create temp directory for test files
    testDir = join(tmpdir(), `graph-builder-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  describe('buildPartialGraph', () => {
    it('should build graph from single file with definition and emission', async () => {
      const filePath = join(testDir, 'test1.gd');
      await writeFile(
        filePath,
        `
extends Node

signal player_died

func _ready():
    player_died.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);

      expect(graph.definitions.size).toBe(1);
      expect(graph.definitions.has('player_died')).toBe(true);
      expect(graph.emissions.size).toBe(1);
      expect(graph.emissions.has('player_died')).toBe(true);

      const defs = graph.definitions.get('player_died')!;
      expect(defs).toHaveLength(1);
      expect(defs[0].name).toBe('player_died');

      const emits = graph.emissions.get('player_died')!;
      expect(emits).toHaveLength(1);
      expect(emits[0].signalName).toBe('player_died');
      expect(emits[0].line).toBeGreaterThan(0);
    });

    it('should aggregate signals across multiple files', async () => {
      const file1 = join(testDir, 'file1.gd');
      await writeFile(
        file1,
        `
signal health_changed
func take_damage():
    health_changed.emit()
`
      );

      const file2 = join(testDir, 'file2.gd');
      await writeFile(
        file2,
        `
signal mana_depleted
func use_spell():
    mana_depleted.emit()
`
      );

      const tree1 = await bridge.parseFile(file1);
      const tree2 = await bridge.parseFile(file2);

      const astForest: ASTForest = [
        {
          tree: tree1,
          filePath: file1,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
        {
          tree: tree2,
          filePath: file2,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);

      expect(graph.definitions.size).toBe(2);
      expect(graph.definitions.has('health_changed')).toBe(true);
      expect(graph.definitions.has('mana_depleted')).toBe(true);
      expect(graph.emissions.size).toBe(2);
    });

    it('should handle multiple definitions of same signal', async () => {
      const file1 = join(testDir, 'file1.gd');
      await writeFile(
        file1,
        `
signal ready_signal
`
      );

      const file2 = join(testDir, 'file2.gd');
      await writeFile(
        file2,
        `
signal ready_signal
`
      );

      const tree1 = await bridge.parseFile(file1);
      const tree2 = await bridge.parseFile(file2);

      const astForest: ASTForest = [
        {
          tree: tree1,
          filePath: file1,
          sizeBytes: 50,
          parseDurationMs: 5,
          mtime: Date.now(),
        },
        {
          tree: tree2,
          filePath: file2,
          sizeBytes: 50,
          parseDurationMs: 5,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);

      expect(graph.definitions.size).toBe(1);
      const defs = graph.definitions.get('ready_signal')!;
      expect(defs).toHaveLength(2);
      expect(defs[0].filePath).not.toBe(defs[1].filePath);
    });

    it('should handle multiple emissions of same signal', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal event

func handler1():
    event.emit()

func handler2():
    event.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);

      const emits = graph.emissions.get('event')!;
      expect(emits).toHaveLength(2);
      expect(emits[0].line).not.toBe(emits[1].line);
    });

    it('should generate correct metadata', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal sig1
signal sig2

func test():
    sig1.emit()
    sig2.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 150,
          parseDurationMs: 15,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);

      expect(graph.metadata.version).toBe('3.0.0');
      expect(graph.metadata.fileCount).toBe(1);
      expect(graph.metadata.signalCount).toBe(2);
      expect(graph.metadata.emissionCount).toBe(2);
      expect(graph.metadata.timestamp).toBeGreaterThan(0);
    });

    it('should handle empty forest', async () => {
      const astForest: ASTForest = [];
      const graph = await builder.buildPartialGraph(astForest);

      expect(graph.definitions.size).toBe(0);
      expect(graph.emissions.size).toBe(0);
      expect(graph.metadata.fileCount).toBe(0);
      expect(graph.metadata.signalCount).toBe(0);
      expect(graph.metadata.emissionCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should track build statistics', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal test_signal

func test():
    test_signal.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      await builder.buildPartialGraph(astForest);
      const stats = builder.getStats();

      expect(stats.filesProcessed).toBe(1);
      expect(stats.signalsDiscovered).toBe(1);
      expect(stats.emissionsFound).toBe(1);
      expect(stats.connectionsFound).toBe(0);
      expect(stats.durationMs).toBeGreaterThan(0);
    });

    it('should reset stats between builds', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal sig
func test(): sig.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 50,
          parseDurationMs: 5,
          mtime: Date.now(),
        },
      ];

      await builder.buildPartialGraph(astForest);
      const stats1 = builder.getStats();

      await builder.buildPartialGraph(astForest);
      const stats2 = builder.getStats();

      // Stats should be from second build, not cumulative
      expect(stats2.filesProcessed).toBe(1);
      expect(stats2.signalsDiscovered).toBe(1);
    });
  });

  describe('getDefinitions', () => {
    it('should retrieve definitions for a signal', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal test_signal
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 50,
          parseDurationMs: 5,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);
      const defs = builder.getDefinitions(graph, 'test_signal');

      expect(defs).toHaveLength(1);
      expect(defs[0].name).toBe('test_signal');
    });

    it('should return empty array for nonexistent signal', async () => {
      const astForest: ASTForest = [];
      const graph = await builder.buildPartialGraph(astForest);
      const defs = builder.getDefinitions(graph, 'nonexistent');

      expect(defs).toEqual([]);
    });
  });

  describe('getEmissions', () => {
    it('should retrieve emissions for a signal', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal test_signal

func test():
    test_signal.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);
      const emits = builder.getEmissions(graph, 'test_signal');

      expect(emits).toHaveLength(1);
      expect(emits[0].signalName).toBe('test_signal');
    });

    it('should return empty array for nonexistent signal', async () => {
      const astForest: ASTForest = [];
      const graph = await builder.buildPartialGraph(astForest);
      const emits = builder.getEmissions(graph, 'nonexistent');

      expect(emits).toEqual([]);
    });
  });

  describe('getAllSignalNames', () => {
    it('should return all unique signal names (sorted)', async () => {
      const file1 = join(testDir, 'file1.gd');
      await writeFile(
        file1,
        `
signal zebra_signal
signal alpha_signal
`
      );

      const file2 = join(testDir, 'file2.gd');
      await writeFile(
        file2,
        `
signal beta_signal

func test():
    gamma_signal.emit()
`
      );

      const tree1 = await bridge.parseFile(file1);
      const tree2 = await bridge.parseFile(file2);

      const astForest: ASTForest = [
        {
          tree: tree1,
          filePath: file1,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
        {
          tree: tree2,
          filePath: file2,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);
      const names = builder.getAllSignalNames(graph);

      expect(names).toEqual(['alpha_signal', 'beta_signal', 'gamma_signal', 'zebra_signal']);
    });
  });

  describe('findUndefinedSignals', () => {
    it('should find signals emitted but not defined', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
func test():
    undefined_signal.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);
      const undefined = builder.findUndefinedSignals(graph);

      expect(undefined).toContain('undefined_signal');
    });

    it('should return empty array when all signals are defined', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal defined_signal

func test():
    defined_signal.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);
      const undefined = builder.findUndefinedSignals(graph);

      expect(undefined).toEqual([]);
    });
  });

  describe('findUnemittedSignals', () => {
    it('should find signals defined but never emitted', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal unused_signal
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 50,
          parseDurationMs: 5,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);
      const unemitted = builder.findUnemittedSignals(graph);

      expect(unemitted).toContain('unused_signal');
    });

    it('should return empty array when all signals are emitted', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal used_signal

func test():
    used_signal.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);
      const unemitted = builder.findUnemittedSignals(graph);

      expect(unemitted).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle EventBus emissions', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
func test():
    EventBus.global_event.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 100,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);

      expect(graph.emissions.has('global_event')).toBe(true);
      const emits = graph.emissions.get('global_event')!;
      expect(emits[0].emitter).toBe('EventBus');
    });

    it('should handle emissions with arguments', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal data_changed

func update_data():
    data_changed.emit(42, "test", true)
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 150,
          parseDurationMs: 15,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildPartialGraph(astForest);
      const emits = graph.emissions.get('data_changed')!;

      expect(emits[0].args).toBeDefined();
      expect(emits[0].args).toHaveLength(3);
    });

    it('should handle files with syntax errors gracefully', async () => {
      const filePath = join(testDir, 'broken.gd');
      await writeFile(
        filePath,
        `
this is not valid gdscript code {{{
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 50,
          parseDurationMs: 5,
          mtime: Date.now(),
        },
      ];

      // Should not throw
      const graph = await builder.buildPartialGraph(astForest);
      expect(graph).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should build graph for 50 files in <500ms', async () => {
      const astForest: ASTForest = [];

      // Create 50 test files
      for (let i = 0; i < 50; i++) {
        const filePath = join(testDir, `perf_${i}.gd`);
        await writeFile(
          filePath,
          `
signal sig_${i}

func test_${i}():
    sig_${i}.emit()
`
        );

        const tree = await bridge.parseFile(filePath);
        astForest.push({
          tree,
          filePath,
          sizeBytes: 100,
          parseDurationMs: 5,
          mtime: Date.now(),
        });
      }

      const startTime = Date.now();
      await builder.buildPartialGraph(astForest);
      const durationMs = Date.now() - startTime;

      expect(durationMs).toBeLessThan(500);
    });
  });
});
