/**
 * Full Signal Graph Tests - Phase 3 HOP 3.2b
 * 
 * Tests for complete signal graph construction and serialization.
 * 
 * Coverage:
 * - Full graph construction (definitions + emissions + connections)
 * - Graph serialization/deserialization
 * - Cache validation
 * - Integration with all extraction methods
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SignalGraphBuilder } from '../signal_graph_builder.js';
import { GraphSerializer } from '../graph_serializer.js';
import { SignalExtractor } from '../../parsers/signal_extractor.js';
import { TreeSitterBridge } from '../../parsers/tree_sitter_bridge.js';
import type { ASTForest } from '../../scanner/types.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Full Signal Graph (HOP 3.2b)', () => {
  let builder: SignalGraphBuilder;
  let serializer: GraphSerializer;
  let extractor: SignalExtractor;
  let bridge: TreeSitterBridge;
  let testDir: string;

  beforeEach(async () => {
    extractor = new SignalExtractor();
    builder = new SignalGraphBuilder(extractor);
    serializer = new GraphSerializer();
    bridge = new TreeSitterBridge();
    await bridge.init();

    // Create temp directory for test files
    testDir = join(tmpdir(), `full-graph-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  describe('buildFullGraph', () => {
    it('should build complete graph with definitions, emissions, and connections', async () => {
      const filePath = join(testDir, 'complete.gd');
      await writeFile(
        filePath,
        `
extends Node

signal player_died

func _ready():
    player_died.connect(self, "_on_player_died")

func take_damage():
    player_died.emit()

func _on_player_died():
    print("Player died!")
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 200,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const graph = await builder.buildFullGraph(astForest);

      // Verify all components present
      expect(graph.definitions.size).toBe(1);
      expect(graph.definitions.has('player_died')).toBe(true);
      
      expect(graph.emissions.size).toBe(1);
      expect(graph.emissions.has('player_died')).toBe(true);
      
      expect(graph.connections.size).toBe(1);
      expect(graph.connections.has('player_died')).toBe(true);

      // Verify metadata
      expect(graph.metadata.version).toBe('3.0.0');
      expect(graph.metadata.fileCount).toBe(1);
      expect(graph.metadata.signalCount).toBe(1);
      expect(graph.metadata.emissionCount).toBe(1);
      expect(graph.metadata.connectionCount).toBe(1);
    });

    it('should aggregate across multiple files', async () => {
      const file1 = join(testDir, 'player.gd');
      await writeFile(
        file1,
        `
signal health_changed

func take_damage():
    health_changed.emit()
`
      );

      const file2 = join(testDir, 'ui.gd');
      await writeFile(
        file2,
        `
func _ready():
    player.health_changed.connect(self, "on_health_changed")
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

      const graph = await builder.buildFullGraph(astForest);

      expect(graph.metadata.fileCount).toBe(2);
      expect(graph.definitions.has('health_changed')).toBe(true);
      expect(graph.emissions.has('health_changed')).toBe(true);
      expect(graph.connections.has('health_changed')).toBe(true);
    });

    it('should track statistics correctly', async () => {
      const filePath = join(testDir, 'stats.gd');
      await writeFile(
        filePath,
        `
signal sig1
signal sig2

func test():
    sig1.emit()
    sig1.connect(self, "handler1")
    sig2.emit()
    sig2.connect(self, "handler2")
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 200,
          parseDurationMs: 15,
          mtime: Date.now(),
        },
      ];

      await builder.buildFullGraph(astForest);
      const stats = builder.getStats();

      expect(stats.filesProcessed).toBe(1);
      expect(stats.signalsDiscovered).toBe(2);
      expect(stats.emissionsFound).toBe(2);
      expect(stats.connectionsFound).toBe(2);
      expect(stats.durationMs).toBeGreaterThan(0);
    });

    it('should handle empty forest', async () => {
      const astForest: ASTForest = [];
      const graph = await builder.buildFullGraph(astForest);

      expect(graph.definitions.size).toBe(0);
      expect(graph.emissions.size).toBe(0);
      expect(graph.connections.size).toBe(0);
      expect(graph.metadata.fileCount).toBe(0);
    });
  });

  describe('getConnections', () => {
    it('should retrieve connections for a signal', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(
        filePath,
        `
signal test_signal

func _ready():
    test_signal.connect(self, "handler")
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

      const graph = await builder.buildFullGraph(astForest);
      const connections = builder.getConnections(graph, 'test_signal');

      expect(connections).toHaveLength(1);
      expect(connections[0].handler).toBe('handler');
    });

    it('should return empty array for nonexistent signal', async () => {
      const astForest: ASTForest = [];
      const graph = await builder.buildFullGraph(astForest);
      const connections = builder.getConnections(graph, 'nonexistent');

      expect(connections).toEqual([]);
    });
  });

  describe('GraphSerializer', () => {
    it('should serialize and deserialize graph without data loss', async () => {
      const filePath = join(testDir, 'serialize.gd');
      await writeFile(
        filePath,
        `
signal test_signal

func _ready():
    test_signal.connect(self, "handler")

func trigger():
    test_signal.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const astForest: ASTForest = [
        {
          tree,
          filePath,
          sizeBytes: 150,
          parseDurationMs: 10,
          mtime: Date.now(),
        },
      ];

      const originalGraph = await builder.buildFullGraph(astForest);

      // Serialize
      const cachePath = join(testDir, 'cache.json');
      await serializer.save(originalGraph, cachePath);

      // Deserialize
      const loadedGraph = await serializer.load(cachePath);

      expect(loadedGraph).not.toBeNull();
      expect(loadedGraph!.metadata.signalCount).toBe(originalGraph.metadata.signalCount);
      expect(loadedGraph!.metadata.emissionCount).toBe(originalGraph.metadata.emissionCount);
      expect(loadedGraph!.metadata.connectionCount).toBe(originalGraph.metadata.connectionCount);
      
      // Verify data integrity
      expect(loadedGraph!.definitions.size).toBe(originalGraph.definitions.size);
      expect(loadedGraph!.emissions.size).toBe(originalGraph.emissions.size);
      expect(loadedGraph!.connections.size).toBe(originalGraph.connections.size);
    });

    it('should return null for nonexistent cache', async () => {
      const cachePath = join(testDir, 'nonexistent.json');
      const loaded = await serializer.load(cachePath);

      expect(loaded).toBeNull();
    });

    it('should reject incompatible cache version', async () => {
      const cachePath = join(testDir, 'old_version.json');
      
      // Write cache with old version
      await writeFile(
        cachePath,
        JSON.stringify({
          version: '2.0.0',
          metadata: { version: '2.0.0', timestamp: Date.now(), fileCount: 0, signalCount: 0, emissionCount: 0 },
          definitions: {},
          emissions: {},
          connections: {},
        })
      );

      const loaded = await serializer.load(cachePath);
      expect(loaded).toBeNull();
    });

    it('should detect stale cache', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(filePath, 'signal test_signal');

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

      const graph = await builder.buildFullGraph(astForest);

      // Save cache
      const cachePath = join(testDir, 'cache.json');
      await serializer.save(graph, cachePath);

      // Check staleness with future timestamp (simulating file modification)
      const futureTimestamp = Date.now() + 10000;
      const isStale = await serializer.isStale(cachePath, futureTimestamp);

      expect(isStale).toBe(true);
    });

    it('should get cache stats', async () => {
      const filePath = join(testDir, 'test.gd');
      await writeFile(filePath, 'signal test_signal');

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

      const graph = await builder.buildFullGraph(astForest);

      const cachePath = join(testDir, 'cache.json');
      await serializer.save(graph, cachePath);

      const stats = await serializer.getStats(cachePath);

      expect(stats).not.toBeNull();
      expect(stats!.sizeBytes).toBeGreaterThan(0);
      expect(stats!.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex real-world signal graph', async () => {
      const player = join(testDir, 'Player.gd');
      await writeFile(
        player,
        `
extends CharacterBody2D

signal health_changed(new_health)
signal died

var health = 100

func take_damage(amount):
    health -= amount
    health_changed.emit(health)
    if health <= 0:
        died.emit()
`
      );

      const ui = join(testDir, 'HealthBar.gd');
      await writeFile(
        ui,
        `
extends Control

func _ready():
    player.health_changed.connect(self, "_on_health_changed")
    player.died.connect(lambda: print("Game Over"))

func _on_health_changed(new_health):
    $ProgressBar.value = new_health
`
      );

      const manager = join(testDir, 'GameManager.gd');
      await writeFile(
        manager,
        `
extends Node

func _ready():
    player.died.connect(self, "_on_player_died")

func _on_player_died():
    get_tree().reload_current_scene()
`
      );

      const astForest: ASTForest = [];
      for (const file of [player, ui, manager]) {
        const tree = await bridge.parseFile(file);
        astForest.push({
          tree,
          filePath: file,
          sizeBytes: 200,
          parseDurationMs: 10,
          mtime: Date.now(),
        });
      }

      const graph = await builder.buildFullGraph(astForest);

      expect(graph.metadata.fileCount).toBe(3);
      expect(graph.metadata.signalCount).toBeGreaterThanOrEqual(2);
      expect(graph.metadata.emissionCount).toBeGreaterThanOrEqual(2);
      expect(graph.metadata.connectionCount).toBeGreaterThanOrEqual(3);

      // Verify specific signals
      expect(graph.definitions.has('health_changed')).toBe(true);
      expect(graph.definitions.has('died')).toBe(true);

      // Verify connections include lambda
      const diedConnections = builder.getConnections(graph, 'died');
      expect(diedConnections.some(c => c.isLambda)).toBe(true);
    });

    it('should build graph for 50 files in <1s', async () => {
      const astForest: ASTForest = [];

      // Create 50 test files
      for (let i = 0; i < 50; i++) {
        const filePath = join(testDir, `perf_${i}.gd`);
        await writeFile(
          filePath,
          `
signal sig_${i}

func _ready():
    sig_${i}.connect(self, "handler_${i}")

func trigger():
    sig_${i}.emit()

func handler_${i}():
    pass
`
        );

        const tree = await bridge.parseFile(filePath);
        astForest.push({
          tree,
          filePath,
          sizeBytes: 150,
          parseDurationMs: 5,
          mtime: Date.now(),
        });
      }

      const startTime = Date.now();
      const graph = await builder.buildFullGraph(astForest);
      const durationMs = Date.now() - startTime;

      expect(durationMs).toBeLessThan(1000); // <1s target
      expect(graph.metadata.fileCount).toBe(50);
      expect(graph.metadata.signalCount).toBe(50);
      expect(graph.metadata.emissionCount).toBe(50);
      expect(graph.metadata.connectionCount).toBe(50);
    });
  });
});
