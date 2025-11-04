/**
 * Signal Emission Extraction Tests - Phase 3 HOP 3.2a
 * 
 * Tests for tree-sitter based .emit() call detection.
 * 
 * Coverage:
 * - Basic signal.emit() detection
 * - EventBus.signal.emit() detection
 * - self.signal.emit() detection
 * - Emission with arguments
 * - Multiple emissions per file
 * - Context extraction (2 lines before/after)
 * - Edge cases (nested calls, lambda emits, dynamic signals)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SignalExtractor } from '../signal_extractor.js';
import { TreeSitterBridge } from '../tree_sitter_bridge.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('SignalExtractor - Emission Detection', () => {
  let extractor: SignalExtractor;
  let bridge: TreeSitterBridge;
  let testDir: string;

  beforeEach(async () => {
    extractor = new SignalExtractor();
    bridge = new TreeSitterBridge();
    await bridge.init();

    // Create temp directory for test files
    testDir = join(tmpdir(), `emission-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  describe('extractEmissions', () => {
    it('should extract basic signal.emit() call', async () => {
      const filePath = join(testDir, 'basic.gd');
      await writeFile(
        filePath,
        `
extends Node

signal player_died

func _on_health_zero():
    player_died.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].signalName).toBe('player_died');
      expect(emissions[0].filePath).toBe(filePath);
      expect(emissions[0].line).toBeGreaterThan(0);
      expect(emissions[0].context).toContain('player_died.emit()');
    });

    it('should extract EventBus signal emission', async () => {
      const filePath = join(testDir, 'eventbus.gd');
      await writeFile(
        filePath,
        `
func notify_global():
    EventBus.game_started.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].signalName).toBe('game_started');
      expect(emissions[0].emitter).toBe('EventBus');
    });

    it('should extract self.signal.emit() call', async () => {
      const filePath = join(testDir, 'self.gd');
      await writeFile(
        filePath,
        `
signal item_collected

func collect_item():
    self.item_collected.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].signalName).toBe('item_collected');
      expect(emissions[0].emitter).toBe('self');
    });

    it('should extract emission with arguments', async () => {
      const filePath = join(testDir, 'args.gd');
      await writeFile(
        filePath,
        `
signal damage_taken

func take_damage(amount, source):
    damage_taken.emit(amount, source)
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].args).toBeDefined();
      expect(emissions[0].args).toHaveLength(2);
      expect(emissions[0].args![0]).toBe('amount');
      expect(emissions[0].args![1]).toBe('source');
    });

    it('should extract multiple emissions from same file', async () => {
      const filePath = join(testDir, 'multiple.gd');
      await writeFile(
        filePath,
        `
signal event_a
signal event_b

func handler1():
    event_a.emit()

func handler2():
    event_b.emit()

func handler3():
    event_a.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(3);
      
      const eventAEmissions = emissions.filter(e => e.signalName === 'event_a');
      expect(eventAEmissions).toHaveLength(2);
      
      const eventBEmissions = emissions.filter(e => e.signalName === 'event_b');
      expect(eventBEmissions).toHaveLength(1);
    });

    it('should include context around emission', async () => {
      const filePath = join(testDir, 'context.gd');
      await writeFile(
        filePath,
        `
func test():
    var before_line_1 = 1
    var before_line_2 = 2
    signal_name.emit()
    var after_line_1 = 3
    var after_line_2 = 4
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      const context = emissions[0].context;
      
      // Should include 2 lines before and after
      expect(context).toContain('before_line_2');
      expect(context).toContain('signal_name.emit()');
      expect(context).toContain('after_line_1');
    });

    it('should handle file with no emissions', async () => {
      const filePath = join(testDir, 'no_emissions.gd');
      await writeFile(
        filePath,
        `
signal some_signal

func test():
    print("No emissions here")
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(0);
    });

    it('should handle nested function calls with emit', async () => {
      const filePath = join(testDir, 'nested.gd');
      await writeFile(
        filePath,
        `
signal result_ready

func process():
    if check_condition():
        result_ready.emit(calculate_result())
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].signalName).toBe('result_ready');
    });

    it('should handle signal emission in lambda/callable', async () => {
      const filePath = join(testDir, 'lambda.gd');
      await writeFile(
        filePath,
        `
signal timeout

func setup_timer():
    var timer = Timer.new()
    timer.timeout.connect(func(): timeout.emit())
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].signalName).toBe('timeout');
    });

    it('should extract emissions with complex arguments', async () => {
      const filePath = join(testDir, 'complex_args.gd');
      await writeFile(
        filePath,
        `
signal state_changed

func update_state():
    state_changed.emit("new_state", get_current_time(), position.x, position.y)
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].args).toBeDefined();
      expect(emissions[0].args!.length).toBe(4);
    });

    it('should handle emission with no arguments', async () => {
      const filePath = join(testDir, 'no_args.gd');
      await writeFile(
        filePath,
        `
signal simple_event

func trigger():
    simple_event.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].args).toBeUndefined();
    });

    it('should handle emissions in different scopes', async () => {
      const filePath = join(testDir, 'scopes.gd');
      await writeFile(
        filePath,
        `
signal global_signal

func outer():
    global_signal.emit()
    
    func inner():
        global_signal.emit()

class InnerClass:
    signal class_signal
    
    func method():
        class_signal.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions.length).toBeGreaterThanOrEqual(2);
    });

    it('should extract line numbers correctly', async () => {
      const filePath = join(testDir, 'line_numbers.gd');
      const content = `extends Node

signal test_signal

func test():
    # Line 6
    test_signal.emit()
`;
      await writeFile(filePath, content);

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].line).toBe(7); // Line 7 in the file
    });

    it('should handle emissions in conditional blocks', async () => {
      const filePath = join(testDir, 'conditional.gd');
      await writeFile(
        filePath,
        `
signal success
signal failure

func process():
    if condition:
        success.emit()
    else:
        failure.emit()
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(2);
      expect(emissions.some(e => e.signalName === 'success')).toBe(true);
      expect(emissions.some(e => e.signalName === 'failure')).toBe(true);
    });

    it('should handle emissions in loops', async () => {
      const filePath = join(testDir, 'loop.gd');
      await writeFile(
        filePath,
        `
signal item_processed

func process_items(items):
    for item in items:
        item_processed.emit(item)
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].signalName).toBe('item_processed');
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
      const emissions = await extractor.extractEmissions(tree, filePath);

      // Should not throw and return empty array
      expect(emissions).toBeDefined();
      expect(Array.isArray(emissions)).toBe(true);
    });

    it('should handle empty file', async () => {
      const filePath = join(testDir, 'empty.gd');
      await writeFile(filePath, '');

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(0);
    });

    it('should handle file with only comments', async () => {
      const filePath = join(testDir, 'comments.gd');
      await writeFile(
        filePath,
        `
# This is a comment
# Another comment
# No code here
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(0);
    });

    it('should not extract calls to non-emit methods', async () => {
      const filePath = join(testDir, 'non_emit.gd');
      await writeFile(
        filePath,
        `
signal test_signal

func test():
    test_signal.connect(handler)
    test_signal.disconnect(handler)
    test_signal.is_connected(handler)
`
      );

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(0);
    });

    it('should handle very long files', async () => {
      const filePath = join(testDir, 'long.gd');
      let content = 'extends Node\n\nsignal test_signal\n\n';
      
      // Create a file with 1000 functions
      for (let i = 0; i < 1000; i++) {
        content += `func test_${i}():\n    pass\n\n`;
      }
      
      content += 'func final_test():\n    test_signal.emit()\n';

      await writeFile(filePath, content);

      const tree = await bridge.parseFile(filePath);
      const emissions = await extractor.extractEmissions(tree, filePath);

      expect(emissions).toHaveLength(1);
      expect(emissions[0].signalName).toBe('test_signal');
    });
  });

  describe('Performance', () => {
    it('should extract emissions from large file in reasonable time', async () => {
      const filePath = join(testDir, 'perf.gd');
      let content = 'extends Node\n\n';
      
      // Create file with 100 signals and 100 emissions
      for (let i = 0; i < 100; i++) {
        content += `signal sig_${i}\n`;
      }
      
      content += '\n';
      
      for (let i = 0; i < 100; i++) {
        content += `func handler_${i}():\n    sig_${i}.emit()\n\n`;
      }

      await writeFile(filePath, content);

      const tree = await bridge.parseFile(filePath);
      
      const startTime = Date.now();
      const emissions = await extractor.extractEmissions(tree, filePath);
      const durationMs = Date.now() - startTime;

      expect(emissions).toHaveLength(100);
      expect(durationMs).toBeLessThan(100); // Should be very fast
    });
  });
});
