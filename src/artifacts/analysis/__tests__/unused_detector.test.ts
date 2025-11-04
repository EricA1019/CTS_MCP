/**
 * Unused Detector Tests - HOP 3.3
 * 
 * Tests for unused signal detection with confidence scoring.
 * 
 * Coverage:
 * - Pattern 1: Orphan signals (defined but never emitted)
 * - Pattern 2: Dead emitters (emitted but never connected)
 * - Pattern 3: Isolated signals (neither emitted nor connected)
 * - Confidence scoring heuristics
 * - Edge cases (inheritance, private signals, EventBus)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UnusedDetector } from '../unused_detector.js';
import { UnusedPattern } from '../types.js';
import type { SignalGraph } from '../../graph/types.js';
import type { SignalDefinition } from '../../parsers/gdscript_parser.js';
import type { EmissionSite, ConnectionSite } from '../../graph/types.js';

describe('UnusedDetector', () => {
  let detector: UnusedDetector;

  beforeEach(() => {
    detector = new UnusedDetector();
  });

  describe('Pattern 1: Orphan Signals (defined but never emitted)', () => {
    it('should detect orphan signal with high confidence', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['health_changed', [
            { name: 'health_changed', params: ['new_health'], filePath: '/player.gd', line: 5, source: 'player' },
          ]],
        ]),
        emissions: new Map(),
        connections: new Map([
          ['health_changed', [
            { signalName: 'health_changed', filePath: '/ui.gd', line: 10, context: '', target: 'self', handler: '_on_health_changed', flags: [], isLambda: false },
          ]],
        ]),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(1);
      expect(unused[0].signalName).toBe('health_changed');
      expect(unused[0].pattern).toBe(UnusedPattern.Orphan);
      expect(unused[0].confidence).toBeGreaterThanOrEqual(0.95);
      expect(unused[0].locations).toHaveLength(1);
      expect(unused[0].locations[0].file).toBe('/player.gd');
    });

    it('should reduce confidence for private signals', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['_internal_signal', [
            { name: '_internal_signal', params: [], filePath: '/system.gd', line: 15, source: 'system' },
          ]],
        ]),
        emissions: new Map(),
        connections: new Map([
          ['_internal_signal', [
            { signalName: '_internal_signal', filePath: '/system.gd', line: 20, context: '', target: 'self', handler: '_on_internal', flags: [], isLambda: false },
          ]],
        ]),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(1);
      expect(unused[0].signalName).toBe('_internal_signal');
      expect(unused[0].confidence).toBeLessThan(0.95);
      expect(unused[0].confidence).toBeGreaterThanOrEqual(0.80); // 0.95 - 0.15 = 0.80
      expect(unused[0].isPrivate).toBe(true);
    });

    it('should reduce confidence for multiple definitions (inheritance hint)', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['signal_from_parent', [
            { name: 'signal_from_parent', params: [], filePath: '/parent.gd', line: 5, source: 'parent' },
            { name: 'signal_from_parent', params: [], filePath: '/child.gd', line: 10, source: 'child' },
          ]],
        ]),
        emissions: new Map(),
        connections: new Map([
          ['signal_from_parent', [
            { signalName: 'signal_from_parent', filePath: '/child.gd', line: 15, context: '', target: 'self', handler: '_on_parent_signal', flags: [], isLambda: false },
          ]],
        ]),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(1);
      expect(unused[0].confidence).toBeLessThan(0.95);
      expect(unused[0].confidence).toBeGreaterThanOrEqual(0.75); // 0.95 - 0.20 = 0.75
      expect(unused[0].reason).toContain('inheritance');
    });

    it('should not detect orphans below confidence threshold', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['_private_inherited', [
            { name: '_private_inherited', params: [], filePath: '/parent.gd', line: 5, source: 'parent' },
            { name: '_private_inherited', params: [], filePath: '/child.gd', line: 10, source: 'child' },
          ]],
        ]),
        emissions: new Map(),
        connections: new Map([
          ['_private_inherited', [
            { signalName: '_private_inherited', filePath: '/child.gd', line: 15, context: '', target: 'self', handler: '_on_signal', flags: [], isLambda: false },
          ]],
        ]),
      });

      const unused = await detector.detectUnused(graph);

      // Confidence: 0.95 - 0.15 (private) - 0.20 (inheritance) = 0.60 < 0.95 threshold
      expect(unused).toHaveLength(0);
    });
  });

  describe('Pattern 2: Dead Emitters (emitted but never connected)', () => {
    it('should detect dead emitter with high confidence', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['debug_log', [
            { name: 'debug_log', params: ['message'], filePath: '/logger.gd', line: 5, source: 'logger' },
          ]],
        ]),
        emissions: new Map([
          ['debug_log', [
            { signalName: 'debug_log', filePath: '/logger.gd', line: 20, context: '', emitter: 'self', args: ['msg'] },
          ]],
        ]),
        connections: new Map(),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(1);
      expect(unused[0].signalName).toBe('debug_log');
      expect(unused[0].pattern).toBe(UnusedPattern.DeadEmitter);
      expect(unused[0].confidence).toBeGreaterThanOrEqual(0.90);
      expect(unused[0].locations).toHaveLength(1);
    });

    it('should reduce confidence for EventBus emissions', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['game_started', [
            { name: 'game_started', params: [], filePath: '/EventBus.gd', line: 5, source: 'EventBus' },
          ]],
        ]),
        emissions: new Map([
          ['game_started', [
            { signalName: 'game_started', filePath: '/EventBus.gd', line: 20, context: '', emitter: 'EventBus' },
          ]],
        ]),
        connections: new Map(),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(1);
      expect(unused[0].confidence).toBeLessThan(0.90);
      expect(unused[0].confidence).toBeGreaterThanOrEqual(0.80); // 0.90 - 0.10 = 0.80
    });

    it('should reduce confidence for autoload emissions', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['global_event', [
            { name: 'global_event', params: [], filePath: '/autoload/GlobalManager.gd', line: 5, source: 'GlobalManager' },
          ]],
        ]),
        emissions: new Map([
          ['global_event', [
            { signalName: 'global_event', filePath: '/autoload/GlobalManager.gd', line: 20, context: '', emitter: 'self' },
          ]],
        ]),
        connections: new Map(),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(1);
      expect(unused[0].confidence).toBeLessThan(0.90);
      expect(unused[0].confidence).toBeGreaterThanOrEqual(0.70); // 0.90 - 0.20 = 0.70
    });

    it('should not detect dead emitters below confidence threshold', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['_private_event', [
            { name: '_private_event', params: [], filePath: '/autoload/EventBus.gd', line: 5, source: 'EventBus' },
          ]],
        ]),
        emissions: new Map([
          ['_private_event', [
            { signalName: '_private_event', filePath: '/autoload/EventBus.gd', line: 20, context: '', emitter: 'EventBus' },
          ]],
        ]),
        connections: new Map(),
      });

      const unused = await detector.detectUnused(graph);

      // Confidence: 0.90 - 0.15 (private) - 0.20 (autoload) = 0.55 < 0.90 threshold
      expect(unused).toHaveLength(0);
    });
  });

  describe('Pattern 3: Isolated Signals (neither emitted nor connected)', () => {
    it('should detect isolated signal with maximum confidence', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['unused_signal', [
            { name: 'unused_signal', params: [], filePath: '/deprecated.gd', line: 10, source: 'deprecated' },
          ]],
        ]),
        emissions: new Map(),
        connections: new Map(),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(1);
      expect(unused[0].signalName).toBe('unused_signal');
      expect(unused[0].pattern).toBe(UnusedPattern.Isolated);
      expect(unused[0].confidence).toBe(1.0); // Maximum confidence
      expect(unused[0].reason).toContain('never emitted or connected');
    });

    it('should detect multiple isolated signals', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['old_signal_1', [
            { name: 'old_signal_1', params: [], filePath: '/old.gd', line: 5, source: 'old' },
          ]],
          ['old_signal_2', [
            { name: 'old_signal_2', params: [], filePath: '/old.gd', line: 10, source: 'old' },
          ]],
          ['old_signal_3', [
            { name: 'old_signal_3', params: [], filePath: '/old.gd', line: 15, source: 'old' },
          ]],
        ]),
        emissions: new Map(),
        connections: new Map(),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(3);
      unused.forEach(u => {
        expect(u.pattern).toBe(UnusedPattern.Isolated);
        expect(u.confidence).toBe(1.0);
      });
    });

    it('should mark private isolated signals correctly', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['_private_unused', [
            { name: '_private_unused', params: [], filePath: '/test.gd', line: 5, source: 'test' },
          ]],
        ]),
        emissions: new Map(),
        connections: new Map(),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(1);
      expect(unused[0].isPrivate).toBe(true);
      expect(unused[0].confidence).toBe(1.0); // Isolated always 1.0
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed patterns correctly', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['orphan_signal', [
            { name: 'orphan_signal', params: [], filePath: '/a.gd', line: 5, source: 'a' },
          ]],
          ['dead_emitter', [
            { name: 'dead_emitter', params: [], filePath: '/b.gd', line: 10, source: 'b' },
          ]],
          ['isolated_signal', [
            { name: 'isolated_signal', params: [], filePath: '/c.gd', line: 15, source: 'c' },
          ]],
          ['used_signal', [
            { name: 'used_signal', params: [], filePath: '/d.gd', line: 20, source: 'd' },
          ]],
        ]),
        emissions: new Map([
          ['dead_emitter', [
            { signalName: 'dead_emitter', filePath: '/b.gd', line: 30, context: '', emitter: 'self' },
          ]],
          ['used_signal', [
            { signalName: 'used_signal', filePath: '/d.gd', line: 40, context: '', emitter: 'self' },
          ]],
        ]),
        connections: new Map([
          ['orphan_signal', [
            { signalName: 'orphan_signal', filePath: '/a.gd', line: 50, context: '', target: 'self', handler: '_on_orphan', flags: [], isLambda: false },
          ]],
          ['used_signal', [
            { signalName: 'used_signal', filePath: '/d.gd', line: 60, context: '', target: 'self', handler: '_on_used', flags: [], isLambda: false },
          ]],
        ]),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(3);
      
      const orphan = unused.find(u => u.signalName === 'orphan_signal');
      const deadEmitter = unused.find(u => u.signalName === 'dead_emitter');
      const isolated = unused.find(u => u.signalName === 'isolated_signal');

      expect(orphan).toBeDefined();
      expect(orphan?.pattern).toBe(UnusedPattern.Orphan);

      expect(deadEmitter).toBeDefined();
      expect(deadEmitter?.pattern).toBe(UnusedPattern.DeadEmitter);

      expect(isolated).toBeDefined();
      expect(isolated?.pattern).toBe(UnusedPattern.Isolated);

      // Should NOT include used_signal
      expect(unused.find(u => u.signalName === 'used_signal')).toBeUndefined();
    });

    it('should sort results by confidence (highest first)', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['isolated', [
            { name: 'isolated', params: [], filePath: '/a.gd', line: 5, source: 'a' },
          ]],
          ['orphan', [
            { name: 'orphan', params: [], filePath: '/b.gd', line: 10, source: 'b' },
          ]],
          ['_private_orphan', [
            { name: '_private_orphan', params: [], filePath: '/c.gd', line: 15, source: 'c' },
          ]],
        ]),
        emissions: new Map(),
        connections: new Map([
          ['orphan', [
            { signalName: 'orphan', filePath: '/b.gd', line: 20, context: '', target: 'self', handler: '_on_orphan', flags: [], isLambda: false },
          ]],
          ['_private_orphan', [
            { signalName: '_private_orphan', filePath: '/c.gd', line: 25, context: '', target: 'self', handler: '_on_private', flags: [], isLambda: false },
          ]],
        ]),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(3);
      // Order: isolated (1.0) > orphan (0.95) > _private_orphan (0.80)
      expect(unused[0].signalName).toBe('isolated');
      expect(unused[0].confidence).toBe(1.0);
      expect(unused[1].signalName).toBe('orphan');
      expect(unused[1].confidence).toBeGreaterThan(unused[2].confidence);
      expect(unused[2].signalName).toBe('_private_orphan');
    });

    it('should not duplicate signals detected by multiple patterns', async () => {
      // Isolated is a special case of both orphan and dead emitter
      const graph = createTestGraph({
        definitions: new Map([
          ['isolated', [
            { name: 'isolated', params: [], filePath: '/test.gd', line: 5, source: 'test' },
          ]],
        ]),
        emissions: new Map(),
        connections: new Map(),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(1);
      expect(unused[0].signalName).toBe('isolated');
      expect(unused[0].pattern).toBe(UnusedPattern.Isolated);
    });

    it('should handle empty graph', async () => {
      const graph = createTestGraph({
        definitions: new Map(),
        emissions: new Map(),
        connections: new Map(),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(0);
    });

    it('should handle fully-used signals', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['signal1', [
            { name: 'signal1', params: [], filePath: '/a.gd', line: 5, source: 'a' },
          ]],
          ['signal2', [
            { name: 'signal2', params: [], filePath: '/b.gd', line: 10, source: 'b' },
          ]],
        ]),
        emissions: new Map([
          ['signal1', [
            { signalName: 'signal1', filePath: '/a.gd', line: 20, context: '', emitter: 'self' },
          ]],
          ['signal2', [
            { signalName: 'signal2', filePath: '/b.gd', line: 30, context: '', emitter: 'self' },
          ]],
        ]),
        connections: new Map([
          ['signal1', [
            { signalName: 'signal1', filePath: '/a.gd', line: 40, context: '', target: 'self', handler: '_on_signal1', flags: [], isLambda: false },
          ]],
          ['signal2', [
            { signalName: 'signal2', filePath: '/b.gd', line: 50, context: '', target: 'self', handler: '_on_signal2', flags: [], isLambda: false },
          ]],
        ]),
      });

      const unused = await detector.detectUnused(graph);

      expect(unused).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('should track detection statistics', async () => {
      const graph = createTestGraph({
        definitions: new Map([
          ['orphan', [
            { name: 'orphan', params: [], filePath: '/a.gd', line: 5, source: 'a' },
          ]],
          ['dead', [
            { name: 'dead', params: [], filePath: '/b.gd', line: 10, source: 'b' },
          ]],
          ['isolated', [
            { name: 'isolated', params: [], filePath: '/c.gd', line: 15, source: 'c' },
          ]],
          ['used', [
            { name: 'used', params: [], filePath: '/d.gd', line: 20, source: 'd' },
          ]],
        ]),
        emissions: new Map([
          ['dead', [
            { signalName: 'dead', filePath: '/b.gd', line: 30, context: '', emitter: 'self' },
          ]],
          ['used', [
            { signalName: 'used', filePath: '/d.gd', line: 40, context: '', emitter: 'self' },
          ]],
        ]),
        connections: new Map([
          ['orphan', [
            { signalName: 'orphan', filePath: '/a.gd', line: 50, context: '', target: 'self', handler: '_on_orphan', flags: [], isLambda: false },
          ]],
          ['used', [
            { signalName: 'used', filePath: '/d.gd', line: 60, context: '', target: 'self', handler: '_on_used', flags: [], isLambda: false },
          ]],
        ]),
      });

      await detector.detectUnused(graph);
      const stats = detector.getStats();

      expect(stats.signalsAnalyzed).toBe(4);
      expect(stats.orphansFound).toBe(1);
      expect(stats.deadEmittersFound).toBe(1);
      expect(stats.isolatedFound).toBe(1);
      expect(stats.totalUnused).toBe(3);
      expect(stats.durationMs).toBeGreaterThan(0);
      expect(stats.avgConfidence).toBeGreaterThan(0);
      expect(stats.avgConfidence).toBeLessThanOrEqual(1.0);
    });

    it('should reset statistics', () => {
      detector.resetStats();
      const stats = detector.getStats();

      expect(stats.signalsAnalyzed).toBe(0);
      expect(stats.orphansFound).toBe(0);
      expect(stats.deadEmittersFound).toBe(0);
      expect(stats.isolatedFound).toBe(0);
      expect(stats.totalUnused).toBe(0);
      expect(stats.durationMs).toBe(0);
      expect(stats.avgConfidence).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should detect unused in <500ms for 300 signals', async () => {
      const graph = createLargeTestGraph(300);

      const startTime = performance.now();
      await detector.detectUnused(graph);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(500);
    });
  });
});

/**
 * Helper: Create test signal graph
 */
function createTestGraph(data: {
  definitions: Map<string, SignalDefinition[]>;
  emissions: Map<string, EmissionSite[]>;
  connections: Map<string, ConnectionSite[]>;
}): SignalGraph {
  return {
    definitions: data.definitions,
    emissions: data.emissions,
    connections: data.connections,
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 1,
      signalCount: data.definitions.size,
      emissionCount: Array.from(data.emissions.values()).flat().length,
      connectionCount: Array.from(data.connections.values()).flat().length,
    },
  };
}

/**
 * Helper: Create large test graph for performance testing
 */
function createLargeTestGraph(signalCount: number): SignalGraph {
  const definitions = new Map<string, SignalDefinition[]>();
  const emissions = new Map<string, EmissionSite[]>();
  const connections = new Map<string, ConnectionSite[]>();

  for (let i = 0; i < signalCount; i++) {
    const signalName = `signal_${i}`;
    const filePath = `/test_${i % 10}.gd`;

    definitions.set(signalName, [
      { name: signalName, params: [], filePath, line: i + 1, source: `test_${i % 10}` },
    ]);

    // 50% have emissions
    if (i % 2 === 0) {
      emissions.set(signalName, [
        { signalName, filePath, line: i + 100, context: '', emitter: 'self' },
      ]);
    }

    // 50% have connections
    if (i % 2 === 1) {
      connections.set(signalName, [
        { signalName, filePath, line: i + 200, context: '', target: 'self', handler: `_on_${signalName}`, flags: [], isLambda: false },
      ]);
    }
  }

  return {
    definitions,
    emissions,
    connections,
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 10,
      signalCount: definitions.size,
      emissionCount: Array.from(emissions.values()).flat().length,
      connectionCount: Array.from(connections.values()).flat().length,
    },
  };
}
