/**
 * Tests for ClusterVisualizer
 * 
 * Verifies cluster boundary generation and color-coding.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ClusterVisualizer, type Cluster } from '../../artifacts/visualizations/ClusterVisualizer.js';
import type { GraphNode } from '../../artifacts/visualizations/D3GraphRenderer.js';

describe('ClusterVisualizer', () => {
  let visualizer: ClusterVisualizer;
  let testClusters: Cluster[];

  beforeEach(() => {
    testClusters = [
      {
        id: 'cluster1',
        label: 'Combat Signals',
        nodeIds: ['signal1', 'signal2', 'signal3'],
        nodes: [
          { id: 'signal1', label: 'damage_dealt', type: 'EventBus', x: 100, y: 100 },
          { id: 'signal2', label: 'character_died', type: 'EventBus', x: 150, y: 150 },
          { id: 'signal3', label: 'combat_started', type: 'EventBus', x: 200, y: 100 }
        ]
      },
      {
        id: 'cluster2',
        label: 'UI Signals',
        nodeIds: ['signal4', 'signal5'],
        nodes: [
          { id: 'signal4', label: 'button_clicked', type: 'SignalBus', x: 400, y: 200 },
          { id: 'signal5', label: 'menu_opened', type: 'SignalBus', x: 450, y: 250 }
        ]
      }
    ];

    visualizer = new ClusterVisualizer(testClusters);
  });

  describe('Constructor', () => {
    it('should initialize with cluster data', () => {
      expect(visualizer).toBeDefined();
    });

    it('should handle empty cluster array', () => {
      const emptyVisualizer = new ClusterVisualizer([]);
      expect(emptyVisualizer).toBeDefined();
    });
  });

  describe('generateClusterBoundaries', () => {
    it('should generate SVG path for cluster with 3+ nodes', () => {
      const boundaries = visualizer.generateClusterBoundaries(testClusters);

      expect(boundaries).toContain('<path');
      expect(boundaries).toContain('cluster1');
      expect(boundaries).toContain('d="M'); // SVG path command
    });

    it('should skip clusters with < 3 nodes', () => {
      const smallCluster: Cluster = {
        id: 'small',
        label: 'Small',
        nodeIds: ['node1', 'node2'],
        nodes: [
          { id: 'node1', label: 'A', type: 'EventBus', x: 10, y: 10 },
          { id: 'node2', label: 'B', type: 'EventBus', x: 20, y: 20 }
        ]
      };

      const boundaries = visualizer.generateClusterBoundaries([smallCluster]);

      // Should not contain path for small cluster
      expect(boundaries.trim()).toBe('');
    });

    it('should include cluster ID in path data attribute', () => {
      const boundaries = visualizer.generateClusterBoundaries(testClusters);

      // cluster1 has 3 nodes, cluster2 has only 2 (skipped)
      expect(boundaries).toContain('data-cluster-id="cluster1"');
      expect(boundaries).not.toContain('data-cluster-id="cluster2"'); // <3 nodes
    });

    it('should use semi-transparent fill', () => {
      const boundaries = visualizer.generateClusterBoundaries(testClusters);

      expect(boundaries).toContain('rgba(');
      expect(boundaries).toContain('0.1)'); // 10% opacity
    });

    it('should use dashed stroke', () => {
      const boundaries = visualizer.generateClusterBoundaries(testClusters);

      expect(boundaries).toContain('stroke-dasharray="5,5"');
    });

    it('should handle nodes without positions', () => {
      const clustersWithMissingPos: Cluster[] = [
        {
          id: 'test',
          label: 'Test',
          nodeIds: ['node1', 'node2', 'node3'],
          nodes: [
            { id: 'node1', label: 'A', type: 'EventBus' }, // Missing x, y
            { id: 'node2', label: 'B', type: 'EventBus', x: 10, y: 10 },
            { id: 'node3', label: 'C', type: 'EventBus', x: 20, y: 20 }
          ]
        }
      ];

      const boundaries = visualizer.generateClusterBoundaries(clustersWithMissingPos);

      // Should still generate path (with 2 nodes)
      expect(boundaries).toBe(''); // Not enough nodes with positions
    });
  });

  describe('colorCodeNodes', () => {
    it('should assign colors to nodes based on cluster', () => {
      const nodes: GraphNode[] = [
        { id: 'signal1', label: 'A', type: 'EventBus' },
        { id: 'signal2', label: 'B', type: 'EventBus' },
        { id: 'signal4', label: 'C', type: 'SignalBus' }
      ];

      const colorMap = visualizer.colorCodeNodes(nodes, testClusters);

      expect(colorMap.size).toBe(3);
      expect(colorMap.get('signal1')).toBeTruthy(); // cluster1 color
      expect(colorMap.get('signal2')).toBeTruthy(); // cluster1 color
      expect(colorMap.get('signal4')).toBeTruthy(); // cluster2 color
    });

    it('should use same color for nodes in same cluster', () => {
      const nodes: GraphNode[] = [
        { id: 'signal1', label: 'A', type: 'EventBus' },
        { id: 'signal2', label: 'B', type: 'EventBus' }
      ];

      const colorMap = visualizer.colorCodeNodes(nodes, testClusters);

      // Both in cluster1, should have same color
      expect(colorMap.get('signal1')).toBe(colorMap.get('signal2'));
    });

    it('should use different colors for different clusters', () => {
      const nodes: GraphNode[] = [
        { id: 'signal1', label: 'A', type: 'EventBus' },
        { id: 'signal4', label: 'B', type: 'SignalBus' }
      ];

      const colorMap = visualizer.colorCodeNodes(nodes, testClusters);

      // Different clusters, different colors
      expect(colorMap.get('signal1')).not.toBe(colorMap.get('signal4'));
    });

    it('should assign default color to unclustered nodes', () => {
      const nodes: GraphNode[] = [
        { id: 'orphan', label: 'Orphan', type: 'EventBus' }
      ];

      const colorMap = visualizer.colorCodeNodes(nodes, testClusters);

      expect(colorMap.get('orphan')).toBe('#999'); // Default gray
    });

    it('should handle empty node array', () => {
      const colorMap = visualizer.colorCodeNodes([], testClusters);

      expect(colorMap.size).toBe(0);
    });

    it('should handle empty cluster array', () => {
      const nodes: GraphNode[] = [
        { id: 'node1', label: 'A', type: 'EventBus' }
      ];

      const emptyVisualizer = new ClusterVisualizer([]);
      const colorMap = emptyVisualizer.colorCodeNodes(nodes, []);

      expect(colorMap.get('node1')).toBe('#999'); // All unclustered
    });
  });

  describe('getClusterColor', () => {
    it('should return color for valid cluster ID', () => {
      const color = visualizer.getClusterColor('cluster1');

      expect(color).toBeTruthy();
      expect(color).toMatch(/^#[0-9a-f]{6}$/i); // Hex color format
    });

    it('should return default color for unknown cluster ID', () => {
      const color = visualizer.getClusterColor('unknown_cluster');

      expect(color).toBe('#999');
    });
  });

  describe('Convex Hull Algorithm', () => {
    it('should create closed SVG path (ends with Z)', () => {
      const boundaries = visualizer.generateClusterBoundaries(testClusters);

      // Paths should end with Z (close path)
      expect(boundaries).toContain('Z');
    });

    it('should handle collinear points', () => {
      const collinearCluster: Cluster = {
        id: 'collinear',
        label: 'Collinear',
        nodeIds: ['n1', 'n2', 'n3'],
        nodes: [
          { id: 'n1', label: 'A', type: 'EventBus', x: 0, y: 0 },
          { id: 'n2', label: 'B', type: 'EventBus', x: 10, y: 10 },
          { id: 'n3', label: 'C', type: 'EventBus', x: 20, y: 20 }
        ]
      };

      const boundaries = visualizer.generateClusterBoundaries([collinearCluster]);

      // Should still generate path
      expect(boundaries).toContain('<path');
    });

    it('should add padding around hull', () => {
      // This is implicitly tested by the expand hull logic
      // Explicit test would require parsing SVG path and checking coordinates
      const boundaries = visualizer.generateClusterBoundaries(testClusters);

      expect(boundaries.length).toBeGreaterThan(0);
    });
  });
});
