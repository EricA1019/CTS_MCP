/**
 * Clustered Signal Map Renderer Test Suite
 * Tests community detection and clustered visualization for large signal graphs
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ClusteredSignalMapRenderer } from '../artifacts/renderers/d3_signal_map_v2.js';
import { detectCommunities, GraphNode, GraphLink } from '../artifacts/clustering/community_detection.js';

describe('Community Detection Algorithm', () => {
  describe('Edge Cases', () => {
    it('should handle empty graph', () => {
      const result = detectCommunities([], []);
      
      expect(result.clusters.size).toBe(0);
      expect(result.nodeToCluster.size).toBe(0);
      expect(result.modularity).toBe(0);
    });

    it('should handle single node', () => {
      const nodes: GraphNode[] = [{ id: 'node1' }];
      const result = detectCommunities(nodes, []);
      
      expect(result.clusters.size).toBe(1);
      expect(result.nodeToCluster.get('node1')).toBe(0);
      expect(result.modularity).toBe(0);
    });

    it('should handle disconnected nodes', () => {
      const nodes: GraphNode[] = [
        { id: 'node1' },
        { id: 'node2' },
        { id: 'node3' },
      ];
      
      const result = detectCommunities(nodes, []);
      
      expect(result.clusters.size).toBe(3); // Each node in own cluster
      expect(result.modularity).toBe(0);
    });
  });

  describe('Simple Topologies', () => {
    it('should cluster fully connected triangle', () => {
      const nodes: GraphNode[] = [
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ];
      
      const links: GraphLink[] = [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'c', target: 'a' },
      ];
      
      const result = detectCommunities(nodes, links);
      
      // Should form single cluster
      expect(result.clusters.size).toBe(1);
      
      const clusterId = result.nodeToCluster.get('a')!;
      expect(result.nodeToCluster.get('b')).toBe(clusterId);
      expect(result.nodeToCluster.get('c')).toBe(clusterId);
      
      expect(result.modularity).toBeGreaterThanOrEqual(0);
    });

    it('should detect two separate triangles', () => {
      const nodes: GraphNode[] = [
        { id: 'a1' }, { id: 'a2' }, { id: 'a3' },
        { id: 'b1' }, { id: 'b2' }, { id: 'b3' },
      ];
      
      const links: GraphLink[] = [
        // Triangle A
        { source: 'a1', target: 'a2' },
        { source: 'a2', target: 'a3' },
        { source: 'a3', target: 'a1' },
        // Triangle B
        { source: 'b1', target: 'b2' },
        { source: 'b2', target: 'b3' },
        { source: 'b3', target: 'b1' },
      ];
      
      const result = detectCommunities(nodes, links);
      
      // Should form 2 clusters
      expect(result.clusters.size).toBe(2);
      
      const clusterA = result.nodeToCluster.get('a1')!;
      const clusterB = result.nodeToCluster.get('b1')!;
      
      expect(clusterA).not.toBe(clusterB);
      expect(result.nodeToCluster.get('a2')).toBe(clusterA);
      expect(result.nodeToCluster.get('a3')).toBe(clusterA);
      expect(result.nodeToCluster.get('b2')).toBe(clusterB);
      expect(result.nodeToCluster.get('b3')).toBe(clusterB);
    });

    it('should detect bridge between clusters', () => {
      const nodes: GraphNode[] = [
        { id: 'a1' }, { id: 'a2' }, { id: 'a3' },
        { id: 'bridge' },
        { id: 'b1' }, { id: 'b2' }, { id: 'b3' },
      ];
      
      const links: GraphLink[] = [
        // Cluster A
        { source: 'a1', target: 'a2' },
        { source: 'a2', target: 'a3' },
        { source: 'a3', target: 'a1' },
        // Bridge
        { source: 'a2', target: 'bridge' },
        { source: 'bridge', target: 'b2' },
        // Cluster B
        { source: 'b1', target: 'b2' },
        { source: 'b2', target: 'b3' },
        { source: 'b3', target: 'b1' },
      ];
      
      const result = detectCommunities(nodes, links);
      
      // Should form 2-3 clusters (bridge might join either cluster)
      expect(result.clusters.size).toBeGreaterThanOrEqual(2);
      expect(result.clusters.size).toBeLessThanOrEqual(3);
      expect(result.modularity).toBeGreaterThan(0);
    });
  });

  describe('Large Graph Performance', () => {
    it('should handle 150-node graph in <200ms', () => {
      // Generate 150-node graph with file-based clustering
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      
      // 10 files with 15 signals each
      for (let fileId = 0; fileId < 10; fileId++) {
        for (let sigId = 0; sigId < 15; sigId++) {
          nodes.push({ id: `file${fileId}_sig${sigId}` });
        }
      }
      
      // Connect signals within same file (create clusters)
      for (let fileId = 0; fileId < 10; fileId++) {
        for (let i = 0; i < 15; i++) {
          for (let j = i + 1; j < 15; j++) {
            links.push({
              source: `file${fileId}_sig${i}`,
              target: `file${fileId}_sig${j}`,
            });
          }
        }
      }
      
      // Add some cross-file connections
      for (let fileId = 0; fileId < 9; fileId++) {
        links.push({
          source: `file${fileId}_sig0`,
          target: `file${fileId + 1}_sig0`,
        });
      }
      
      const start = performance.now();
      const result = detectCommunities(nodes, links);
      const duration = performance.now() - start;
      
      expect(nodes.length).toBe(150);
      expect(duration).toBeLessThan(200); // Target: <200ms for clustering alone
      expect(result.clusters.size).toBeGreaterThanOrEqual(5);
      expect(result.clusters.size).toBeLessThanOrEqual(15);
      expect(result.modularity).toBeGreaterThan(0);
    });

    it('should produce meaningful clusters for 150 nodes', () => {
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      
      // 10 dense clusters of 15 nodes each
      for (let clusterId = 0; clusterId < 10; clusterId++) {
        for (let nodeId = 0; nodeId < 15; nodeId++) {
          nodes.push({ id: `cluster${clusterId}_node${nodeId}` });
        }
        
        // Fully connect within cluster
        for (let i = 0; i < 15; i++) {
          for (let j = i + 1; j < 15; j++) {
            links.push({
              source: `cluster${clusterId}_node${i}`,
              target: `cluster${clusterId}_node${j}`,
            });
          }
        }
      }
      
      const result = detectCommunities(nodes, links);
      
      expect(result.clusters.size).toBeGreaterThanOrEqual(5);
      expect(result.clusters.size).toBeLessThanOrEqual(15);
      
      // Check cluster sizes are reasonable (not all singleton)
      const clusterSizes = Array.from(result.clusters.values()).map(s => s.size);
      const avgSize = clusterSizes.reduce((a, b) => a + b, 0) / clusterSizes.length;
      expect(avgSize).toBeGreaterThan(5); // Average cluster should have >5 nodes
      
      expect(result.modularity).toBeGreaterThan(0.5); // High modularity for well-defined clusters
    });
  });

  describe('Modularity Calculation', () => {
    it('should compute modularity for known structure', () => {
      // Karate club-like structure (simplified)
      const nodes: GraphNode[] = [
        { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' },
        { id: '5' }, { id: '6' }, { id: '7' }, { id: '8' },
      ];
      
      const links: GraphLink[] = [
        // Group 1 (fully connected)
        { source: '1', target: '2' },
        { source: '1', target: '3' },
        { source: '1', target: '4' },
        { source: '2', target: '3' },
        { source: '2', target: '4' },
        { source: '3', target: '4' },
        // Group 2 (fully connected)
        { source: '5', target: '6' },
        { source: '5', target: '7' },
        { source: '5', target: '8' },
        { source: '6', target: '7' },
        { source: '6', target: '8' },
        { source: '7', target: '8' },
        // Bridge
        { source: '4', target: '5' },
      ];
      
      const result = detectCommunities(nodes, links);
      
      // Should have high modularity (well-separated groups)
      expect(result.modularity).toBeGreaterThan(0.3);
      expect(result.clusters.size).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('ClusteredSignalMapRenderer', () => {
  let renderer: ClusteredSignalMapRenderer;

  beforeEach(() => {
    renderer = new ClusteredSignalMapRenderer();
  });

  it('should have correct type identifier', () => {
    expect(renderer.type).toBe('clustered_signal_map');
  });

  it('should render HTML with clustering for empty signals', async () => {
    const data = {
      signals: [],
      projectPath: '/test/project',
    };

    const html = await renderer.render(data);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Clustered Signal Map');
    expect(html).toContain('detectCommunities');
    expect(html).toContain('Total Signals:');
    expect(html).toContain('Clusters:');
  });

  it('should render HTML with signal data', async () => {
    const data = {
      signals: [
        {
          name: 'test_signal_1',
          source: 'EventBus',
          filePath: '/test/file1.gd',
          line: 10,
          params: ['arg1', 'arg2'],
          paramTypes: { arg1: 'int', arg2: 'String' },
        },
        {
          name: 'test_signal_2',
          source: 'SignalBus',
          filePath: '/test/file1.gd',
          line: 20,
          params: [],
          paramTypes: {},
        },
        {
          name: 'test_signal_3',
          source: 'Component',
          filePath: '/test/file2.gd',
          line: 15,
          params: ['data'],
          paramTypes: { data: 'Dictionary' },
        },
      ],
      projectPath: '/test/project',
      metadata: {
        eventBusCount: 1,
        signalBusCount: 1,
      },
    };

    const html = await renderer.render(data);

    expect(html).toContain('Clustered Signal Map');
    expect(html).toContain('test_signal_1');
    expect(html).toContain('test_signal_2');
    expect(html).toContain('test_signal_3');
    expect(html).toContain('EventBus');
    expect(html).toContain('SignalBus');
    expect(html).toContain('Component');
    expect(html).toContain('arg1');
    expect(html).toContain('arg2');
    expect(html).toContain('int');
    expect(html).toContain('String');
  });

  it('should include community detection script', async () => {
    const data = {
      signals: [
        { name: 'sig1', source: 'EventBus', filePath: '/test/f1.gd', line: 1, params: [], paramTypes: {} },
        { name: 'sig2', source: 'SignalBus', filePath: '/test/f1.gd', line: 2, params: [], paramTypes: {} },
      ],
      projectPath: '/test',
    };

    const html = await renderer.render(data);

    expect(html).toContain('function detectCommunities');
    expect(html).toContain('calculateModularityGain');
    expect(html).toContain('calculateModularity');
  });

  it('should include cluster visualization elements', async () => {
    const data = {
      signals: [
        { name: 's1', source: 'EventBus', filePath: '/f1.gd', line: 1, params: [], paramTypes: {} },
        { name: 's2', source: 'SignalBus', filePath: '/f1.gd', line: 2, params: [], paramTypes: {} },
      ],
      projectPath: '/test',
    };

    const html = await renderer.render(data);

    expect(html).toContain('cluster-hull');
    expect(html).toContain('cluster-legend');
    expect(html).toContain('toggleCluster');
    expect(html).toContain('Clusters:');
    expect(html).toContain('Modularity:');
    expect(html).toContain('Clustered Signal Map');
  });

  it('should include performance overlay', async () => {
    const data = {
      signals: [
        { name: 's1', source: 'EventBus', filePath: '/f.gd', line: 1, params: [], paramTypes: {} },
      ],
      projectPath: '/test',
    };

    const html = await renderer.render(data);

    expect(html).toContain('performance-overlay');
    expect(html).toContain('perfStart');
    expect(html).toContain('Clustering:');
    expect(html).toContain('Simulation:');
  });

  it('should handle large signal sets (150+ signals)', async () => {
    // Generate 150 signals across 10 files
    const signals = [];
    for (let fileId = 0; fileId < 10; fileId++) {
      for (let sigId = 0; sigId < 15; sigId++) {
        signals.push({
          name: `signal_${fileId}_${sigId}`,
          source: fileId % 2 === 0 ? 'EventBus' : 'SignalBus',
          filePath: `/test/file${fileId}.gd`,
          line: sigId * 5 + 1,
          params: [],
          paramTypes: {},
        });
      }
    }

    const data = {
      signals,
      projectPath: '/test/project',
    };

    const start = performance.now();
    const html = await renderer.render(data);
    const duration = performance.now() - start;

    // Rendering should be fast (actual clustering happens client-side)
    expect(duration).toBeLessThan(100);
    expect(html).toContain('Clustered Signal Map');
    expect(html).toContain('signal_0_0');
    expect(html).toContain('signal_9_14');
    expect(html.length).toBeGreaterThan(10000); // Substantial HTML
  });

  it('should preserve backward compatibility with Phase 1 data format', async () => {
    const phase1Data = {
      signals: [
        {
          name: 'legacy_signal',
          source: 'EventBus',
          filePath: '/legacy/file.gd',
          line: 42,
          params: ['old_param'],
          paramTypes: { old_param: 'int' },
        },
      ],
      projectPath: '/legacy/project',
      metadata: {
        eventBusCount: 1,
        signalBusCount: 0,
      },
    };

    const html = await renderer.render(phase1Data);

    expect(html).toContain('legacy_signal');
    expect(html).toContain('old_param');
    expect(html).toContain('legacy/file.gd');
    expect(html).toBeTruthy();
  });
});

describe('Clustered Renderer Integration', () => {
  it('should create synthetic links from file proximity', async () => {
    const renderer = new ClusteredSignalMapRenderer();
    
    const data = {
      signals: [
        { name: 's1', source: 'EventBus', filePath: '/f1.gd', line: 1, params: [], paramTypes: {} },
        { name: 's2', source: 'SignalBus', filePath: '/f1.gd', line: 2, params: [], paramTypes: {} },
        { name: 's3', source: 'Component', filePath: '/f2.gd', line: 1, params: [], paramTypes: {} },
      ],
      projectPath: '/test',
    };

    const html = await renderer.render(data);

    // Should create links between s1-s2 (same file), but not s3 (different file)
    expect(html).toContain('"source":"s1","target":"s2"');
  });

  it('should support VS Code artifact interaction', async () => {
    const renderer = new ClusteredSignalMapRenderer();
    
    const data = {
      signals: [
        { name: 'interactive_signal', source: 'EventBus', filePath: '/test.gd', line: 10, params: [], paramTypes: {} },
      ],
      projectPath: '/test',
    };

    const html = await renderer.render(data);

    expect(html).toContain('artifact_interaction');
    expect(html).toContain('open_file');
    expect(html).toContain('artifact_ready');
  });
});
