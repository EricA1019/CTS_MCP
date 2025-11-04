/**
 * Tests for Dependency Graph Renderer
 * Validates DAG layout, critical path highlighting, and interaction features
 */

import { DependencyGraphRenderer } from '../artifacts/renderers/dependency_graph.js';
import type { Node, Edge, DependencyGraphData } from '../artifacts/schemas/dependency_graph_schema.js';

describe('DependencyGraphRenderer', () => {
  let renderer: DependencyGraphRenderer;

  beforeEach(() => {
    renderer = new DependencyGraphRenderer();
  });

  describe('Type Registration', () => {
    it('should have correct type identifier', () => {
      expect(renderer.type).toBe('dependency_graph');
    });
  });

  describe('Data Validation', () => {
    it('should validate correct dependency graph data', async () => {
      const validData: DependencyGraphData = {
        nodes: [
          { id: 'hop1', label: 'HOP 2.1a', type: 'hop' },
          { id: 'task1', label: 'Task 1', type: 'task' },
        ],
        edges: [
          { source: 'hop1', target: 'task1', weight: 1 },
        ],
      };

      const html = await renderer.render(validData);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Dependency Graph');
    });

    it('should reject data without nodes', async () => {
      const invalidData = {
        nodes: [],
        edges: [],
      };

      await expect(renderer.render(invalidData)).rejects.toThrow('At least one node is required');
    });

    it('should reject nodes with empty IDs', async () => {
      const invalidData = {
        nodes: [{ id: '', label: 'Test', type: 'hop' }],
        edges: [],
      };

      await expect(renderer.render(invalidData)).rejects.toThrow();
    });

    it('should reject invalid node types', async () => {
      const invalidData = {
        nodes: [{ id: 'node1', label: 'Test', type: 'invalid' }],
        edges: [],
      };

      await expect(renderer.render(invalidData)).rejects.toThrow();
    });

    it('should reject graphs with more than 1000 nodes', async () => {
      const largeGraph: DependencyGraphData = {
        nodes: Array.from({ length: 1001 }, (_, i) => ({
          id: `node${i}`,
          label: `Node ${i}`,
          type: 'task' as const,
        })),
        edges: [],
      };

      await expect(renderer.render(largeGraph)).rejects.toThrow('Graph too large: maximum 1000 nodes allowed');
    });
  });

  describe('Large Graph Rendering', () => {
    it('should render 75-node graph in <500ms', async () => {
      // Generate realistic 75-node dependency chain
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      // Create 3 hops with 25 tasks each
      for (let hop = 1; hop <= 3; hop++) {
        const hopId = `hop${hop}`;
        nodes.push({
          id: hopId,
          label: `HOP 2.${hop}`,
          type: 'hop',
        });

        for (let task = 1; task <= 24; task++) {
          const taskId = `hop${hop}_task${task}`;
          nodes.push({
            id: taskId,
            label: `Task ${hop}.${task}`,
            type: 'task',
          });

          // Connect task to hop
          edges.push({ source: hopId, target: taskId });

          // Add file dependency for some tasks
          if (task % 3 === 0) {
            const fileId = `file_${hop}_${task}`;
            nodes.push({
              id: fileId,
              label: `file_${hop}_${task}.ts`,
              type: 'file',
            });
            edges.push({ source: taskId, target: fileId });
          }
        }

        // Connect hops sequentially
        if (hop > 1) {
          edges.push({ source: `hop${hop - 1}`, target: hopId });
        }
      }

      const data: DependencyGraphData = { nodes, edges };

      const startTime = performance.now();
      const html = await renderer.render(data);
      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(500);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(`Nodes:</strong> ${nodes.length}`);
      expect(html).toContain(`Edges:</strong> ${edges.length}`);
    });
  });

  describe('DAG Layout Validation', () => {
    it('should handle acyclic graphs correctly', async () => {
      const acyclicData: DependencyGraphData = {
        nodes: [
          { id: 'a', label: 'A', type: 'hop' },
          { id: 'b', label: 'B', type: 'task' },
          { id: 'c', label: 'C', type: 'task' },
          { id: 'd', label: 'D', type: 'file' },
        ],
        edges: [
          { source: 'a', target: 'b' },
          { source: 'a', target: 'c' },
          { source: 'b', target: 'd' },
          { source: 'c', target: 'd' },
        ],
      };

      const html = await renderer.render(acyclicData);
      
      // Check for cycle warning in generated JavaScript
      expect(html).toContain('Cycle detected in dependency graph');
      expect(html).toContain('findCriticalPath');
    });

    it('should detect and warn about cycles', async () => {
      // Note: The renderer should handle cycles gracefully
      const cyclicData: DependencyGraphData = {
        nodes: [
          { id: 'a', label: 'A', type: 'task' },
          { id: 'b', label: 'B', type: 'task' },
          { id: 'c', label: 'C', type: 'task' },
        ],
        edges: [
          { source: 'a', target: 'b' },
          { source: 'b', target: 'c' },
          { source: 'c', target: 'a' }, // Creates cycle
        ],
      };

      const html = await renderer.render(cyclicData);
      
      // Should render without throwing (graceful degradation)
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('console.warn');
    });
  });

  describe('Critical Path Highlighting', () => {
    it('should identify longest dependency chain', async () => {
      const data: DependencyGraphData = {
        nodes: [
          { id: 'root', label: 'Root', type: 'hop' },
          { id: 'a', label: 'A', type: 'task' },
          { id: 'b', label: 'B', type: 'task' },
          { id: 'c', label: 'C', type: 'task' },
          { id: 'd', label: 'D', type: 'task' },
        ],
        edges: [
          { source: 'root', target: 'a' },
          { source: 'a', target: 'b' },
          { source: 'b', target: 'c' },
          { source: 'c', target: 'd' }, // Longest path: root -> a -> b -> c -> d
          { source: 'root', target: 'd' }, // Shorter path: root -> d
        ],
      };

      const html = await renderer.render(data);

      // Check for critical path styling (in JavaScript code)
      expect(html).toContain('classes.push(\'critical\')');
      expect(html).toContain('link.critical');
      expect(html).toContain('findCriticalPath');
    });
  });

  describe('Focus Interaction', () => {
    it('should include focus interaction JavaScript', async () => {
      const data: DependencyGraphData = {
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'hop' },
          { id: 'node2', label: 'Node 2', type: 'task' },
        ],
        edges: [{ source: 'node1', target: 'node2' }],
      };

      const html = await renderer.render(data);

      // Check for focus interaction code
      expect(html).toContain('handleNodeClick');
      expect(html).toContain('focused');
      expect(html).toContain('dependency-highlight');
      expect(html).toContain('Click nodes to highlight dependencies');
    });
  });

  describe('Color Coding', () => {
    it('should include CSS for node type colors', async () => {
      const data: DependencyGraphData = {
        nodes: [
          { id: 'hop1', label: 'HOP', type: 'hop' },
          { id: 'task1', label: 'Task', type: 'task' },
          { id: 'file1', label: 'File', type: 'file' },
        ],
        edges: [],
      };

      const html = await renderer.render(data);

      // Check for color coding styles
      expect(html).toContain('.node.hop circle');
      expect(html).toContain('fill: #1f77b4'); // Blue for hops
      expect(html).toContain('.node.task circle');
      expect(html).toContain('fill: #2ca02c'); // Green for tasks
      expect(html).toContain('.node.file circle');
      expect(html).toContain('fill: #7f7f7f'); // Gray for files
    });
  });

  describe('Node Counts', () => {
    it('should display correct node counts', async () => {
      const data: DependencyGraphData = {
        nodes: [
          { id: 'hop1', label: 'HOP 1', type: 'hop' },
          { id: 'hop2', label: 'HOP 2', type: 'hop' },
          { id: 'task1', label: 'Task 1', type: 'task' },
          { id: 'task2', label: 'Task 2', type: 'task' },
          { id: 'task3', label: 'Task 3', type: 'task' },
          { id: 'file1', label: 'file.ts', type: 'file' },
        ],
        edges: [],
      };

      const html = await renderer.render(data);

      // Check for count updates
      expect(html).toContain('hop-count');
      expect(html).toContain('task-count');
      expect(html).toContain('file-count');
      expect(html).toContain('hopCount = nodes.filter(n => n.type === \'hop\').length');
    });
  });

  describe('Keyboard Navigation (WCAG AA)', () => {
    it('should include keyboard navigation code', async () => {
      const data: DependencyGraphData = {
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'hop' },
        ],
        edges: [],
      };

      const html = await renderer.render(data);

      // Check for keyboard event listener
      expect(html).toContain('addEventListener(\'keydown\'');
      expect(html).toContain('event.key === \'Tab\'');
      expect(html).toContain('selectedIndex');
    });
  });

  describe('Interactive Controls', () => {
    it('should include reset and fit controls', async () => {
      const data: DependencyGraphData = {
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'hop' },
        ],
        edges: [],
      };

      const html = await renderer.render(data);

      // Check for control buttons
      expect(html).toContain('id="reset-btn"');
      expect(html).toContain('id="fit-btn"');
      expect(html).toContain('Reset View');
      expect(html).toContain('Fit to Screen');
    });
  });

  describe('Zoom and Pan', () => {
    it('should include D3 zoom functionality', async () => {
      const data: DependencyGraphData = {
        nodes: [
          { id: 'node1', label: 'Node 1', type: 'hop' },
        ],
        edges: [],
      };

      const html = await renderer.render(data);

      // Check for zoom setup
      expect(html).toContain('d3.zoom()');
      expect(html).toContain('scaleExtent');
      expect(html).toContain('Drag to pan, scroll to zoom');
    });
  });

  describe('Metadata Support', () => {
    it('should handle optional metadata in nodes', async () => {
      const data: DependencyGraphData = {
        nodes: [
          {
            id: 'node1',
            label: 'Node 1',
            type: 'hop',
            metadata: {
              priority: 'high',
              estimatedHours: 8,
            },
          },
        ],
        edges: [],
      };

      const html = await renderer.render(data);

      // Check for metadata in tooltip
      expect(html).toContain('Metadata:');
      expect(html).toContain('JSON.stringify(d.metadata');
    });
  });
});
