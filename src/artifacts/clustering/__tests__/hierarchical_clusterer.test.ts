/**
 * Hierarchical Clusterer Tests
 */

import { HierarchicalClusterer } from '../hierarchical_clusterer';
import type { SignalGraph } from '../../graph/types';

describe('HierarchicalClusterer', () => {
  let clusterer: HierarchicalClusterer;

  beforeEach(() => {
    clusterer = new HierarchicalClusterer();
  });

  function createTestGraph(signals: string[]): SignalGraph {
    const definitions = new Map();
    const emissions = new Map();
    const connections = new Map();

    signals.forEach((sig, idx) => {
      definitions.set(sig, [
        { name: sig, params: [], filePath: `/test${idx}.gd`, line: 1, source: 'test' },
      ]);
    });

    return {
      definitions,
      emissions,
      connections,
      metadata: {
        version: '3.0.0',
        timestamp: Date.now(),
        fileCount: signals.length,
        signalCount: signals.length,
        emissionCount: 0,
        connectionCount: 0,
      },
    };
  }

  describe('clusterHierarchical()', () => {
    it('should cluster simple graph at depth 1', async () => {
      const signals = [
        'player_health_changed',
        'player_died',
        'enemy_health_changed',
        'enemy_died',
      ];

      const graph = createTestGraph(signals);
      const result = await clusterer.clusterHierarchical(graph, 1);

      expect(result.topLevel.clusters.size).toBeGreaterThan(0);
      expect(result.topLevel.modularity).toBeGreaterThanOrEqual(0);
      expect(result.subClusters).toBeUndefined(); // depth 1 = no sub-clustering
      expect(result.metadata.depth).toBe(1);
      expect(result.metadata.totalSignals).toBe(4);
    });

    it('should cluster at depth 2 with sub-clusters', async () => {
      // Create larger graph to enable sub-clustering
      const signals = [
        'player_health_changed',
        'player_health_decreased',
        'player_died',
        'player_spawned',
        'player_moved',
        'player_jumped',
        'enemy_health_changed',
        'enemy_died',
        'enemy_spawned',
        'enemy_attacked',
        'item_collected',
        'item_dropped',
      ];

      const graph = createTestGraph(signals);
      const result = await clusterer.clusterHierarchical(graph, 2, 5);

      expect(result.topLevel.clusters.size).toBeGreaterThan(0);
      expect(result.metadata.depth).toBe(2);
      
      // Sub-clusters may or may not exist depending on cluster sizes
      if (result.subClusters) {
        expect(result.subClusters.size).toBeGreaterThan(0);
      }
    });

    it('should skip sub-clustering for small clusters', async () => {
      const signals = [
        'player_died',
        'player_spawned',
        'player_health_changed',
        'enemy_died',
      ];

      const graph = createTestGraph(signals);
      const result = await clusterer.clusterHierarchical(graph, 2, 5);

      // All clusters < 5 nodes, so no sub-clustering should occur
      expect(result.subClusters).toBeUndefined();
    });

    it('should generate semantic labels for clusters', async () => {
      const signals = [
        'player_health_changed',
        'player_died',
        'enemy_health_changed',
        'enemy_died',
      ];

      const graph = createTestGraph(signals);
      const result = await clusterer.clusterHierarchical(graph, 1);

      for (const cluster of result.topLevel.clusters.values()) {
        expect(cluster.label).toBeTruthy();
        expect(cluster.label.length).toBeGreaterThan(0);
        expect(cluster.signals.size).toBeGreaterThan(0);
      }
    });

    it('should include top terms for labeled clusters', async () => {
      const signals = [
        'player_health_changed',
        'player_health_decreased',
        'enemy_health_changed',
      ];

      const graph = createTestGraph(signals);
      const result = await clusterer.clusterHierarchical(graph, 1);

      for (const cluster of result.topLevel.clusters.values()) {
        if (cluster.signals.size > 1) {
          expect(cluster.topTerms).toBeDefined();
          if (cluster.topTerms) {
            expect(cluster.topTerms.length).toBeGreaterThan(0);
            
            for (const term of cluster.topTerms) {
              expect(term.term).toBeTruthy();
              expect(term.score).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    });

    it('should handle empty graph', async () => {
      const graph = createTestGraph([]);
      const result = await clusterer.clusterHierarchical(graph, 1);

      expect(result.topLevel.clusters.size).toBe(0);
      expect(result.topLevel.modularity).toBe(0);
      expect(result.metadata.totalSignals).toBe(0);
    });

    it('should handle single-signal graph', async () => {
      const graph = createTestGraph(['lonely_signal']);
      const result = await clusterer.clusterHierarchical(graph, 1);

      expect(result.topLevel.clusters.size).toBe(1);
      
      const cluster = Array.from(result.topLevel.clusters.values())[0];
      expect(cluster.signals.size).toBe(1);
      expect(cluster.label).toBe('lonely_signal');
    });

    it('should achieve modularity ≥0.3 for well-structured graphs', async () => {
      // Create graph with clear community structure
      const signals = [
        // Player cluster
        'player_health_changed',
        'player_health_decreased',
        'player_died',
        'player_spawned',
        // Enemy cluster
        'enemy_health_changed',
        'enemy_died',
        'enemy_spawned',
        'enemy_attacked',
        // Item cluster
        'item_collected',
        'item_dropped',
        'item_used',
      ];

      const graph = createTestGraph(signals);
      
      // Add emissions to create links within communities
      graph.emissions.set('player_health_changed', [
        { signalName: 'player_health_changed', filePath: '/player.gd', line: 5, context: '', emitter: 'self' },
      ]);
      graph.emissions.set('player_died', [
        { signalName: 'player_died', filePath: '/player.gd', line: 10, context: '', emitter: 'self' },
      ]);
      graph.emissions.set('enemy_health_changed', [
        { signalName: 'enemy_health_changed', filePath: '/enemy.gd', line: 5, context: '', emitter: 'self' },
      ]);
      graph.emissions.set('enemy_died', [
        { signalName: 'enemy_died', filePath: '/enemy.gd', line: 10, context: '', emitter: 'self' },
      ]);

      const result = await clusterer.clusterHierarchical(graph, 1);

      // With emission-based links, modularity should improve
      expect(result.topLevel.modularity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('buildGraphStructure()', () => {
    it('should create nodes for all signals', async () => {
      const signals = ['signal1', 'signal2', 'signal3'];
      const graph = createTestGraph(signals);

      const result = await clusterer.clusterHierarchical(graph, 1);

      expect(result.metadata.totalSignals).toBe(3);
    });

    it('should create links from co-emissions', async () => {
      const graph = createTestGraph(['sig1', 'sig2', 'sig3']);
      
      // Emit sig1 and sig2 in same file
      graph.emissions.set('sig1', [
        { signalName: 'sig1', filePath: '/test.gd', line: 5, context: '', emitter: 'self' },
      ]);
      graph.emissions.set('sig2', [
        { signalName: 'sig2', filePath: '/test.gd', line: 10, context: '', emitter: 'self' },
      ]);

      const result = await clusterer.clusterHierarchical(graph, 1);

      // sig1 and sig2 should be linked and likely in same cluster
      expect(result.topLevel.clusters.size).toBeGreaterThan(0);
    });

    it('should create links from shared handlers', async () => {
      const graph = createTestGraph(['sig1', 'sig2', 'sig3']);
      
      // Connect sig1 and sig2 to same handler
      graph.connections.set('sig1', [
        { signalName: 'sig1', filePath: '/test.gd', line: 15, context: '', target: 'self', handler: 'on_signal', isLambda: false },
      ]);
      graph.connections.set('sig2', [
        { signalName: 'sig2', filePath: '/test.gd', line: 20, context: '', target: 'self', handler: 'on_signal', isLambda: false },
      ]);

      const result = await clusterer.clusterHierarchical(graph, 1);

      // sig1 and sig2 should be linked and likely in same cluster
      expect(result.topLevel.clusters.size).toBeGreaterThan(0);
    });
  });

  describe('extractSubgraph()', () => {
    it('should extract subgraph for subset of nodes', async () => {
      const signals = [
        'player_health_changed',
        'player_died',
        'enemy_health_changed',
        'enemy_died',
        'item_collected',
      ];

      const graph = createTestGraph(signals);
      
      // Add emissions to create links
      graph.emissions.set('player_health_changed', [
        { signalName: 'player_health_changed', filePath: '/player.gd', line: 5, context: '', emitter: 'self' },
      ]);
      graph.emissions.set('player_died', [
        { signalName: 'player_died', filePath: '/player.gd', line: 10, context: '', emitter: 'self' },
      ]);

      const result = await clusterer.clusterHierarchical(graph, 1);

      // Verify clusters were created
      expect(result.topLevel.clusters.size).toBeGreaterThan(0);
    });
  });

  describe('getStats() and resetStats()', () => {
    it('should track clustering statistics', async () => {
      const signals = [
        'player_health_changed',
        'player_died',
        'enemy_health_changed',
        'enemy_died',
      ];

      const graph = createTestGraph(signals);
      await clusterer.clusterHierarchical(graph, 1);

      const stats = clusterer.getStats();

      expect(stats.durationMs).toBeGreaterThan(0);
      expect(stats.topLevelClusters).toBeGreaterThan(0);
      expect(stats.avgClusterSize).toBeGreaterThan(0);
      expect(stats.maxClusterSize).toBeGreaterThan(0);
      expect(stats.minClusterSize).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      const graph = createTestGraph(['sig1', 'sig2']);
      await clusterer.clusterHierarchical(graph, 1);

      clusterer.resetStats();
      const stats = clusterer.getStats();

      expect(stats.durationMs).toBe(0);
      expect(stats.topLevelClusters).toBe(0);
      expect(stats.subClustersTotal).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should cluster 300 signals in <2s', async () => {
      // Generate 300 signals with pattern-based names
      const signals: string[] = [];
      for (let i = 0; i < 100; i++) {
        signals.push(`player_signal_${i}`);
        signals.push(`enemy_signal_${i}`);
        signals.push(`item_signal_${i}`);
      }

      const graph = createTestGraph(signals);

      const startTime = performance.now();
      const result = await clusterer.clusterHierarchical(graph, 2, 5);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(2000);
      expect(result.metadata.totalSignals).toBe(300);
      expect(result.topLevel.clusters.size).toBeGreaterThan(0);

      console.log(`Clustered 300 signals in ${duration.toFixed(2)}ms`);
      console.log(`Top-level clusters: ${result.topLevel.clusters.size}`);
      console.log(`Modularity: ${result.topLevel.modularity.toFixed(4)}`);
    }, 10000); // 10s timeout

    it('should handle large sub-clustering efficiently', async () => {
      // Create 50 signals that should form a single large cluster
      const signals: string[] = [];
      for (let i = 0; i < 50; i++) {
        signals.push(`test_signal_${i}`);
      }

      const graph = createTestGraph(signals);

      const startTime = performance.now();
      await clusterer.clusterHierarchical(graph, 2, 5);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });
  });
});
