/**
 * Tests for D3GraphRenderer
 * 
 * Verifies force-directed graph generation with D3.js features.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { D3GraphRenderer, type GraphNode, type GraphEdge } from '../../artifacts/visualizations/D3GraphRenderer.js';

describe('D3GraphRenderer', () => {
  let renderer: D3GraphRenderer;

  beforeEach(() => {
    renderer = new D3GraphRenderer(1200, 800);
  });

  describe('Constructor', () => {
    it('should initialize with default dimensions', () => {
      const defaultRenderer = new D3GraphRenderer();
      expect(defaultRenderer).toBeDefined();
    });

    it('should initialize with custom dimensions', () => {
      const customRenderer = new D3GraphRenderer(800, 600);
      expect(customRenderer).toBeDefined();
    });
  });

  describe('generateForceDirectedGraph', () => {
    it('should generate valid HTML with SVG', () => {
      const nodes: GraphNode[] = [
        { id: 'node1', label: 'Signal A', type: 'EventBus' },
        { id: 'node2', label: 'Signal B', type: 'SignalBus' }
      ];
      const edges: GraphEdge[] = [
        { source: 'node1', target: 'node2' }
      ];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<svg id="graph"');
      expect(html).toContain('</svg>');
      expect(html).toContain('</html>');
    });

    it('should embed node data in HTML', () => {
      const nodes: GraphNode[] = [
        { id: 'test_signal', label: 'Test Signal', type: 'EventBus', filePath: 'test.gd', line: 42 }
      ];
      const edges: GraphEdge[] = [];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('test_signal');
      expect(html).toContain('Test Signal');
      expect(html).toContain('EventBus');
    });

    it('should embed edge data in HTML', () => {
      const nodes: GraphNode[] = [
        { id: 'node1', label: 'A', type: 'EventBus' },
        { id: 'node2', label: 'B', type: 'EventBus' }
      ];
      const edges: GraphEdge[] = [
        { source: 'node1', target: 'node2', type: 'emit' }
      ];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      const nodesJson = JSON.stringify(nodes);
      const edgesJson = JSON.stringify(edges);

      expect(html).toContain(nodesJson);
      expect(html).toContain(edgesJson);
    });

    it('should include D3 force simulation setup', () => {
      const nodes: GraphNode[] = [
        { id: 'node1', label: 'A', type: 'EventBus' }
      ];
      const edges: GraphEdge[] = [];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('d3.forceSimulation');
      expect(html).toContain('forceLink');
      expect(html).toContain('forceManyBody');
      expect(html).toContain('forceCenter');
    });

    it('should include zoom controls', () => {
      const nodes: GraphNode[] = [{ id: 'node1', label: 'A', type: 'EventBus' }];
      const edges: GraphEdge[] = [];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('d3.zoom');
      expect(html).toContain('scaleExtent');
      expect(html).toContain('resetZoom');
    });

    it('should include drag controls', () => {
      const nodes: GraphNode[] = [{ id: 'node1', label: 'A', type: 'EventBus' }];
      const edges: GraphEdge[] = [];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('d3.drag');
      expect(html).toContain('dragStarted');
      expect(html).toContain('dragged');
      expect(html).toContain('dragEnded');
    });

    it('should limit simulation to max ticks (performance)', () => {
      const nodes: GraphNode[] = [{ id: 'node1', label: 'A', type: 'EventBus' }];
      const edges: GraphEdge[] = [];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('maxTicks');
      expect(html).toContain('300'); // Performance limit
    });

    it('should include control buttons', () => {
      const nodes: GraphNode[] = [{ id: 'node1', label: 'A', type: 'EventBus' }];
      const edges: GraphEdge[] = [];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('Reset Zoom');
      expect(html).toContain('Toggle Labels');
      expect(html).toContain('Restart Sim');
    });

    it('should include legend for node types', () => {
      const nodes: GraphNode[] = [{ id: 'node1', label: 'A', type: 'EventBus' }];
      const edges: GraphEdge[] = [];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('legend');
      expect(html).toContain('EventBus');
      expect(html).toContain('SignalBus');
      expect(html).toContain('Custom');
    });

    it('should include stats display', () => {
      const nodes: GraphNode[] = [
        { id: 'node1', label: 'A', type: 'EventBus' },
        { id: 'node2', label: 'B', type: 'SignalBus' }
      ];
      const edges: GraphEdge[] = [{ source: 'node1', target: 'node2' }];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('node-count');
      expect(html).toContain('edge-count');
      expect(html).toContain('zoom-level');
    });

    it('should handle empty graph', () => {
      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<svg id="graph"');
    });

    it('should handle graph with many nodes (stress test)', () => {
      const nodes: GraphNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `node${i}`,
        label: `Signal ${i}`,
        type: i % 2 === 0 ? 'EventBus' : 'SignalBus'
      }));
      const edges: GraphEdge[] = Array.from({ length: 50 }, (_, i) => ({
        source: `node${i}`,
        target: `node${i + 1}`
      }));

      const html = renderer.generateForceDirectedGraph(nodes, edges);

      expect(html).toContain('node99'); // Last node
      expect(html.length).toBeGreaterThan(1000); // Substantial HTML
    });
  });

  describe('getNodeColor', () => {
    it('should return color for EventBus type', () => {
      const color = renderer.getNodeColor('EventBus');
      expect(color).toBe('#1f77b4');
    });

    it('should return color for SignalBus type', () => {
      const color = renderer.getNodeColor('SignalBus');
      expect(color).toBe('#ff7f0e');
    });

    it('should return color for Custom type', () => {
      const color = renderer.getNodeColor('Custom');
      expect(color).toBe('#2ca02c');
    });

    it('should return default color for unknown type', () => {
      const color = renderer.getNodeColor('UnknownType');
      expect(color).toBe('#999');
    });
  });
});
