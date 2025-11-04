/**
 * Signal Connection Extraction Tests - Phase 3 HOP 3.2b
 * 
 * Tests for tree-sitter based .connect() call detection.
 * 
 * Coverage:
 * - Basic signal.connect(target, handler) detection
 * - Lambda connections: signal.connect(lambda: ...)
 * - Callable connections: signal.connect(Callable(obj, "method"))
 * - Connection flags: signal.connect(handler, flags)
 * - EventBus connections
 * - Multiple connections per file
 * - Edge cases (multi-line lambdas, bind parameters)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SignalExtractor } from '../signal_extractor.js';
import { TreeSitterBridge } from '../tree_sitter_bridge.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SignalExtractor - Connection Detection', () => {
  let extractor: SignalExtractor;
  let bridge: TreeSitterBridge;
  let testDir: string;

  beforeEach(async () => {
    extractor = new SignalExtractor();
    bridge = new TreeSitterBridge();
    await bridge.init();

    // Create temp directory for test files
    testDir = join(tmpdir(), `connection-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  describe('extractConnections', () => {
    it('should extract basic signal.connect(target, handler)', async () => {
      const filePath = join(testDir, 'basic.gd');
      await writeFile(
        filePath,
        `
extends Node

signal player_died

func _ready():
    player_died.connect(self, "_on_player_died")

func _on_player_died():
    print("Player died!")
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('player_died');
      expect(connections[0].handler).toBe('_on_player_died');
      expect(connections[0].isLambda).toBe(false);
      expect(connections[0].filePath).toBe(filePath);
      expect(connections[0].line).toBeGreaterThan(0);
    });

    it('should extract lambda connection', async () => {
      const filePath = join(testDir, 'lambda.gd');
      await writeFile(
        filePath,
        `
extends Node

signal timeout

func _ready():
    var timer = Timer.new()
    timeout.connect(lambda: print("Timeout!"))
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('timeout');
      expect(connections[0].handler).toBe('<lambda>');
      expect(connections[0].isLambda).toBe(true);
    });

    it('should extract Callable connection', async () => {
      const filePath = join(testDir, 'callable.gd');
      await writeFile(
        filePath,
        `
extends Node

signal data_changed

func _ready():
    data_changed.connect(Callable(self, "_on_data_changed"))

func _on_data_changed():
    pass
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('data_changed');
      expect(connections[0].handler).toBe('_on_data_changed');
      expect(connections[0].isLambda).toBe(false);
    });

    it('should extract connection with flags', async () => {
      const filePath = join(testDir, 'flags.gd');
      await writeFile(
        filePath,
        `
extends Node

signal one_shot_signal

func _ready():
    one_shot_signal.connect(self, "handler", CONNECT_ONE_SHOT)
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('one_shot_signal');
      expect(connections[0].handler).toBe('handler');
      expect(connections[0].flags).toBeDefined();
      expect(connections[0].flags).toContain('CONNECT_ONE_SHOT');
    });

    it('should extract EventBus connection', async () => {
      const filePath = join(testDir, 'eventbus.gd');
      await writeFile(
        filePath,
        `
extends Node

func _ready():
    EventBus.game_started.connect(self, "_on_game_started")

func _on_game_started():
    print("Game started!")
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('game_started');
      expect(connections[0].target).toBe('EventBus');
      expect(connections[0].handler).toBe('_on_game_started');
    });

    it('should extract self.signal connection', async () => {
      const filePath = join(testDir, 'self.gd');
      await writeFile(
        filePath,
        `
extends Node

signal ready_signal

func _ready():
    self.ready_signal.connect(self, "on_ready")
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('ready_signal');
      expect(connections[0].target).toBe('self');
      expect(connections[0].handler).toBe('on_ready');
    });

    it('should extract multiple connections from same file', async () => {
      const filePath = join(testDir, 'multiple.gd');
      await writeFile(
        filePath,
        `
extends Node

signal sig_a
signal sig_b

func _ready():
    sig_a.connect(self, "handler_a")
    sig_b.connect(self, "handler_b")
    sig_a.connect(lambda: print("Another handler"))
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(3);
      
      const sigAConnections = connections.filter(c => c.signalName === 'sig_a');
      expect(sigAConnections).toHaveLength(2);
      
      const sigBConnections = connections.filter(c => c.signalName === 'sig_b');
      expect(sigBConnections).toHaveLength(1);
    });

    it('should extract connection with single argument (method only)', async () => {
      const filePath = join(testDir, 'single_arg.gd');
      await writeFile(
        filePath,
        `
extends Node

signal simple_signal

func _ready():
    simple_signal.connect(handler_method)

func handler_method():
    pass
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('simple_signal');
      expect(connections[0].handler).toBe('handler_method');
      expect(connections[0].isLambda).toBe(false);
    });

    it('should include context around connection', async () => {
      const filePath = join(testDir, 'context.gd');
      await writeFile(
        filePath,
        `
func test():
    var before_line_1 = 1
    var before_line_2 = 2
    signal_name.connect(self, "handler")
    var after_line_1 = 3
    var after_line_2 = 4
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      const context = connections[0].context;
      
      // Should include 2 lines before and after
      expect(context).toContain('before_line_2');
      expect(context).toContain('signal_name.connect');
      expect(context).toContain('after_line_1');
    });

    it('should handle file with no connections', async () => {
      const filePath = join(testDir, 'no_connections.gd');
      await writeFile(
        filePath,
        `
extends Node

signal some_signal

func test():
    print("No connections here")
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(0);
    });

    it('should handle nested function calls with connect', async () => {
      const filePath = join(testDir, 'nested.gd');
      await writeFile(
        filePath,
        `
extends Node

signal data_signal

func setup():
    if condition():
        data_signal.connect(self, "on_data", get_flags())
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('data_signal');
      expect(connections[0].handler).toBe('on_data');
    });

    it('should handle lambda with multiline body', async () => {
      const filePath = join(testDir, 'multiline_lambda.gd');
      await writeFile(
        filePath,
        `
extends Node

signal complex_signal

func _ready():
    complex_signal.connect(lambda:
        var x = 10
        print(x)
        return x
    )
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('complex_signal');
      expect(connections[0].isLambda).toBe(true);
    });

    it('should handle connection in conditional block', async () => {
      const filePath = join(testDir, 'conditional.gd');
      await writeFile(
        filePath,
        `
extends Node

signal conditional_signal

func setup():
    if enabled:
        conditional_signal.connect(self, "handler_enabled")
    else:
        conditional_signal.connect(self, "handler_disabled")
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(2);
    });

    it('should handle connection in loop', async () => {
      const filePath = join(testDir, 'loop.gd');
      await writeFile(
        filePath,
        `
extends Node

signal item_signal

func setup(items):
    for item in items:
        item_signal.connect(self, "on_item")
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('item_signal');
    });

    it('should extract line numbers correctly', async () => {
      const filePath = join(testDir, 'line_numbers.gd');
      const content = `extends Node

signal test_signal

func test():
    # Line 6
    test_signal.connect(self, "handler")
`;
      await writeFile(filePath, content);

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].line).toBe(7); // Line 7 in the file
    });
  });

  describe('Edge Cases', () => {
    it('should handle file with syntax errors gracefully', async () => {
      const filePath = join(testDir, 'syntax_error.gd');
      await writeFile(
        filePath,
        `
this is not valid gdscript {{{
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      // Should not throw and return empty array
      expect(connections).toBeDefined();
      expect(Array.isArray(connections)).toBe(true);
    });

    it('should handle empty file', async () => {
      const filePath = join(testDir, 'empty.gd');
      await writeFile(filePath, '');

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(0);
    });

    it('should not extract calls to non-connect methods', async () => {
      const filePath = join(testDir, 'non_connect.gd');
      await writeFile(
        filePath,
        `
extends Node

signal test_signal

func test():
    test_signal.emit()
    test_signal.disconnect(self, "handler")
    test_signal.is_connected(self, "handler")
`
      );

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(0);
    });

    it('should handle very long files', async () => {
      const filePath = join(testDir, 'long.gd');
      let content = 'extends Node\n\nsignal test_signal\n\n';
      
      // Create a file with 1000 functions
      for (let i = 0; i < 1000; i++) {
        content += `func test_${i}():\n    pass\n\n`;
      }
      
      content += 'func final_test():\n    test_signal.connect(self, "handler")\n';

      await writeFile(filePath, content);

      const tree = await bridge.parseFile(filePath);
      const connections = await extractor.extractConnections(tree, filePath);

      expect(connections).toHaveLength(1);
      expect(connections[0].signalName).toBe('test_signal');
    });
  });

  describe('Performance', () => {
    it('should extract connections from large file in reasonable time', async () => {
      const filePath = join(testDir, 'perf.gd');
      let content = 'extends Node\n\n';
      
      // Create file with 100 signals and 100 connections
      for (let i = 0; i < 100; i++) {
        content += `signal sig_${i}\n`;
      }
      
      content += '\n';
      
      for (let i = 0; i < 100; i++) {
        content += `func handler_${i}():\n    sig_${i}.connect(self, "handler_${i}")\n\n`;
      }

      await writeFile(filePath, content);

      const tree = await bridge.parseFile(filePath);
      
      const startTime = Date.now();
      const connections = await extractor.extractConnections(tree, filePath);
      const durationMs = Date.now() - startTime;

      expect(connections).toHaveLength(100);
      expect(durationMs).toBeLessThan(100); // Should be very fast
    });
  });
});
