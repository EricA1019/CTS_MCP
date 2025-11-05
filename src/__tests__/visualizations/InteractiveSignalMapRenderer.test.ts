/**
 * Integration tests for InteractiveSignalMapRenderer
 * 
 * Verifies end-to-end rendering with D3GraphRenderer and ClusterVisualizer.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { InteractiveSignalMapRenderer } from '../../artifacts/renderers/interactive_signal_map.js';
import type { SignalDefinition } from '../../artifacts/parsers/gdscript_parser.js';

describe('InteractiveSignalMapRenderer', () => {
  let renderer: InteractiveSignalMapRenderer;

  beforeEach(() => {
    renderer = new InteractiveSignalMapRenderer();
  });

  describe('Constructor', () => {
    it('should initialize renderer', () => {
      expect(renderer).toBeDefined();
      expect(renderer.type).toBe('signal_map_interactive');
    });
  });

  describe('render', () => {
    it('should render signal map with basic data', async () => {
      const signals: SignalDefinition[] = [
        {
          name: 'damage_dealt',
          source: 'EventBus',
          filePath: 'autoload/EventBus.gd',
          line: 10,
          params: ['attacker_id', 'target_id', 'damage'],
          paramTypes: { attacker_id: 'String', target_id: 'String', damage: 'int' }
        },
        {
          name: 'character_died',
          source: 'EventBus',
          filePath: 'autoload/EventBus.gd',
          line: 15,
          params: ['character_id'],
          paramTypes: { character_id: 'String' }
        }
      ];

      const html = await renderer.render({
        signals,
        projectPath: '/test/project'
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<svg id="graph"');
      expect(html).toContain('damage_dealt');
      expect(html).toContain('character_died');
    });

    it('should include metadata header when provided', async () => {
      const signals: SignalDefinition[] = [
        {
          name: 'test_signal',
          source: 'EventBus',
          filePath: 'test.gd',
          line: 1,
          params: [],
          paramTypes: {}
        }
      ];

      const html = await renderer.render(
        {
          signals,
          projectPath: '/test',
          metadata: {
            eventBusCount: 10,
            signalBusCount: 5
          }
        },
        {
          type: 'signal_map',
          title: 'Test Signal Map',
          description: 'Test Description',
          timestamp: Date.now()
        }
      );

      expect(html).toContain('Test Signal Map');
      expect(html).toContain('Test Description');
      expect(html).toContain('EventBus: 10');
      expect(html).toContain('SignalBus: 5');
    });

    it('should handle empty signal list', async () => {
      const html = await renderer.render({
        signals: [],
        projectPath: '/test'
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<svg id="graph"');
    });

    it('should generate sample edges for visualization', async () => {
      const signals: SignalDefinition[] = Array.from({ length: 20 }, (_, i) => ({
        name: `signal_${i}`,
        source: 'EventBus',
        filePath: 'test.gd',
        line: i,
        params: [],
        paramTypes: {}
      }));

      const html = await renderer.render({
        signals,
        projectPath: '/test'
      });

      // Should contain edge references
      expect(html).toContain('link');
      expect(html).toContain('forceLink');
    });

    it('should include cluster visualization when cluster data provided', async () => {
      const signals: SignalDefinition[] = [
        { name: 's1', source: 'EventBus', filePath: 'test.gd', line: 1, params: [], paramTypes: {} },
        { name: 's2', source: 'EventBus', filePath: 'test.gd', line: 2, params: [], paramTypes: {} },
        { name: 's3', source: 'EventBus', filePath: 'test.gd', line: 3, params: [], paramTypes: {} },
        { name: 's4', source: 'SignalBus', filePath: 'test.gd', line: 4, params: [], paramTypes: {} }
      ];

      const html = await renderer.render({
        signals,
        projectPath: '/test',
        clusters: [
          {
            id: 'cluster1',
            label: 'Combat',
            nodeIds: ['s1', 's2', 's3'],
            nodes: [
              { id: 's1', label: 's1', type: 'EventBus', x: 100, y: 100 },
              { id: 's2', label: 's2', type: 'EventBus', x: 150, y: 150 },
              { id: 's3', label: 's3', type: 'EventBus', x: 200, y: 100 }
            ]
          }
        ]
      });

      expect(html).toContain('cluster-boundaries');
      expect(html).toContain('cluster1');
    });

    it('should include all D3 controls (zoom, drag, labels)', async () => {
      const signals: SignalDefinition[] = [
        { name: 'test', source: 'EventBus', filePath: 'test.gd', line: 1, params: [], paramTypes: {} }
      ];

      const html = await renderer.render({
        signals,
        projectPath: '/test'
      });

      expect(html).toContain('Reset Zoom');
      expect(html).toContain('Toggle Labels');
      expect(html).toContain('Restart Sim');
      expect(html).toContain('d3.zoom');
      expect(html).toContain('d3.drag');
    });

    it('should include legend for signal types', async () => {
      const signals: SignalDefinition[] = [
        { name: 'test', source: 'EventBus', filePath: 'test.gd', line: 1, params: [], paramTypes: {} }
      ];

      const html = await renderer.render({
        signals,
        projectPath: '/test'
      });

      expect(html).toContain('legend');
      expect(html).toContain('EventBus');
      expect(html).toContain('SignalBus');
    });

    it('should include stats display', async () => {
      const signals: SignalDefinition[] = [
        { name: 's1', source: 'EventBus', filePath: 'test.gd', line: 1, params: [], paramTypes: {} },
        { name: 's2', source: 'SignalBus', filePath: 'test.gd', line: 2, params: [], paramTypes: {} }
      ];

      const html = await renderer.render({
        signals,
        projectPath: '/test'
      });

      expect(html).toContain('node-count');
      expect(html).toContain('edge-count');
      expect(html).toContain('zoom-level');
    });
  });
});
