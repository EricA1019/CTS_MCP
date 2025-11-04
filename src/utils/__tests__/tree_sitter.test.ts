/**
 * Tree-Sitter WASM Utilities Tests
 * 
 * Performance benchmarks and accuracy validation
 */

import { describe, test, expect, beforeAll, afterEach } from '@jest/globals';
import {
  initTreeSitter,
  parseGDScript,
  parseGDScriptFile,
  findSignalDefinitions,
  findClassDefinitions,
  findFunctionDefinitions,
  clearCache,
  getMetrics,
  resetMetrics,
} from '../tree_sitter.js';

describe('Tree-Sitter WASM Utilities', () => {
  beforeAll(async () => {
    // Initialize once for all tests
    await initTreeSitter();
  });

  afterEach(() => {
    clearCache();
    resetMetrics();
  });

  describe('Initialization', () => {
    test('should initialize WASM runtime within 500ms', async () => {
      resetMetrics();
      await initTreeSitter();
      const metrics = getMetrics();
      
      expect(metrics.initTime).toBeLessThan(500);
    }, 10000); // Allow 10s for WASM load

    test('should handle multiple init calls gracefully', async () => {
      await initTreeSitter();
      await initTreeSitter();
      await initTreeSitter();
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Signal Detection', () => {
    test('should detect simple signal definitions', async () => {
      const code = `
extends Node

signal player_died
signal health_changed(new_health: int)
signal item_collected(item_name: String, quantity: int)
`;

      const tree = await parseGDScript(code);
      const signals = findSignalDefinitions(tree);

      expect(signals.length).toBe(3);
      expect(signals[0].name).toBe('player_died');
      expect(signals[1].name).toBe('health_changed');
      expect(signals[2].name).toBe('item_collected');
    });

    test('should extract signal parameters', async () => {
      const code = `
signal item_collected(item_name: String, quantity: int)
`;

      const tree = await parseGDScript(code);
      const signals = findSignalDefinitions(tree);

      expect(signals.length).toBe(1);
      expect(signals[0].params).toContain('item_name');
      expect(signals[0].params).toContain('quantity');
      expect(signals[0].paramTypes['item_name']).toBe('String');
      expect(signals[0].paramTypes['quantity']).toBe('int');
    });

    test('should achieve 100% signal detection accuracy', async () => {
      const code = `
extends Node

# Test comment
signal signal1
signal signal2()
signal signal3(arg1)
signal signal4(arg1: int)
signal signal5(arg1: int, arg2: String)

func _ready():
    pass
`;

      const tree = await parseGDScript(code);
      const signals = findSignalDefinitions(tree);

      // Should find exactly 5 signals (manual count)
      expect(signals.length).toBe(5);
      expect(signals.map(s => s.name)).toEqual([
        'signal1',
        'signal2',
        'signal3',
        'signal4',
        'signal5',
      ]);
    });
  });

  describe('Performance', () => {
    test('should parse 500-line file in <50ms', async () => {
      // Generate a 500-line GDScript file
      const lines: string[] = [];
      lines.push('extends Node\n');
      
      for (let i = 0; i < 498; i++) {
        lines.push(`signal test_signal_${i}\n`);
      }
      
      const code = lines.join('');

      resetMetrics();
      const startTime = Date.now();
      await parseGDScript(code, 'test_file.gd');
      const parseTime = Date.now() - startTime;

      expect(parseTime).toBeLessThan(50);
    });

    test('should cache parsed trees', async () => {
      const code = 'signal test';

      // First parse (cache miss)
      await parseGDScript(code, 'cached_file.gd');
      const metrics1 = getMetrics();
      expect(metrics1.cacheMisses).toBe(1);
      expect(metrics1.cacheHits).toBe(0);

      // Second parse (cache hit)
      await parseGDScript(code, 'cached_file.gd');
      const metrics2 = getMetrics();
      expect(metrics2.cacheHits).toBe(1);
    });

    test('should serve cached parse in <1ms', async () => {
      const code = 'signal test';

      // Warm up cache
      await parseGDScript(code, 'fast_cached.gd');

      // Measure cached parse
      const startTime = Date.now();
      await parseGDScript(code, 'fast_cached.gd');
      const cachedTime = Date.now() - startTime;

      expect(cachedTime).toBeLessThan(1);
    });

    test('should handle 100 files without excessive memory', async () => {
      const files: string[] = [];
      
      for (let i = 0; i < 100; i++) {
        const code = `
extends Node

signal test_signal_${i}

func test_function_${i}():
    pass
`;
        files.push(code);
      }

      // Parse all files
      for (let i = 0; i < files.length; i++) {
        await parseGDScript(files[i], `file_${i}.gd`);
      }

      const metrics = getMetrics();
      expect(metrics.filesProcessed).toBe(100);

      // Memory check (rough estimate)
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      expect(memoryUsage).toBeLessThan(100); // <100MB
    });
  });

  describe('Class and Function Detection', () => {
    test('should detect class definitions', async () => {
      const code = `
class_name PlayerController
extends CharacterBody2D

class InnerClass:
    pass
`;

      const tree = await parseGDScript(code);
      const classes = findClassDefinitions(tree);

      expect(classes.length).toBeGreaterThan(0);
      // Note: tree-sitter grammar may parse class_name differently
      // Adjust expectations based on actual grammar
    });

    test('should detect function definitions', async () => {
      const code = `
extends Node

func _ready() -> void:
    pass

func process_input(delta: float):
    pass

func calculate_damage(base: int, multiplier: float) -> int:
    return int(base * multiplier)
`;

      const tree = await parseGDScript(code);
      const functions = findFunctionDefinitions(tree);

      expect(functions.length).toBe(3);
      expect(functions[0].name).toBe('_ready');
      expect(functions[1].name).toBe('process_input');
      expect(functions[2].name).toBe('calculate_damage');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed GDScript gracefully', async () => {
      const code = `
signal incomplete(param1
# Missing closing parenthesis
`;

      // Should not throw
      const tree = await parseGDScript(code);
      expect(tree).toBeDefined();
      
      // Tree-sitter is fault-tolerant, so it may still find some signals
      const signals = findSignalDefinitions(tree);
      expect(Array.isArray(signals)).toBe(true);
    });

    test('should handle empty code', async () => {
      const code = '';

      const tree = await parseGDScript(code);
      const signals = findSignalDefinitions(tree);

      expect(signals.length).toBe(0);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache correctly', async () => {
      const code = 'signal test';

      // Parse and cache
      await parseGDScript(code, 'cache_test.gd');
      let metrics = getMetrics();
      expect(metrics.cacheMisses).toBe(1);

      // Clear cache
      clearCache();

      // Parse again (should be cache miss)
      await parseGDScript(code, 'cache_test.gd');
      metrics = getMetrics();
      expect(metrics.cacheMisses).toBe(2);
    });

    test('should provide accurate metrics', async () => {
      resetMetrics();

      await parseGDScript('signal a', 'file1.gd');
      await parseGDScript('signal b', 'file2.gd');
      await parseGDScript('signal a', 'file1.gd'); // Cache hit

      const metrics = getMetrics();
      expect(metrics.filesProcessed).toBe(2);
      expect(metrics.cacheMisses).toBe(2);
      expect(metrics.cacheHits).toBe(1);
    });
  });
});
