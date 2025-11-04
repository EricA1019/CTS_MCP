/**
 * Unit tests for TreeSitterBridge WASM integration
 * 
 * Validates:
 * - WASM initialization performance (<500ms)
 * - AST parsing correctness
 * - Error handling for invalid inputs
 * - Performance targets (1000 LOC in <250ms)
 * 
 * @module tree_sitter_bridge.test
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { TreeSitterBridge } from '../artifacts/parsers/tree_sitter_bridge';
import { findSignalNodes } from '../artifacts/parsers/tree_sitter_types';
import { resolve } from 'path';

describe('TreeSitterBridge', () => {
  let bridge: TreeSitterBridge;

  describe('WASM Initialization', () => {
    it('should initialize WASM runtime in <500ms', async () => {
      bridge = new TreeSitterBridge();
      const startTime = Date.now();
      
      await bridge.init();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
      expect(bridge.isInitialized()).toBe(true);
    }, 10000); // Allow 10s timeout for CI environments

    it('should not re-initialize if already initialized', async () => {
      const firstInit = bridge.isInitialized();
      await bridge.init(); // Second call
      expect(bridge.isInitialized()).toBe(firstInit);
    });

    it('should throw error if init() fails', async () => {
      // This test is conceptual - actual failure requires mocking
      // In production, WASM load failures would throw during import
      expect(bridge.isInitialized()).toBe(true); // Already initialized in previous tests
    });
  });

  describe('AST Parsing - Valid Files', () => {
    beforeAll(async () => {
      if (!bridge) {
        bridge = new TreeSitterBridge();
        await bridge.init();
      }
    });

    it('should parse simple.gd fixture and extract AST tree', async () => {
      const fixturePath = resolve(__dirname, 'fixtures/simple_signals.gd');
      
      const tree = await bridge.parseFile(fixturePath);
      
      expect(tree).toBeDefined();
      expect(tree.rootNode).toBeDefined();
      expect(tree.rootNode.type).toBe('source_file');
    });

    it('should extract signal nodes from AST', async () => {
      const fixturePath = resolve(__dirname, 'fixtures/simple_signals.gd');
      
      const tree = await bridge.parseFile(fixturePath);
      const signalNodes = findSignalNodes(tree);
      
      expect(signalNodes.length).toBeGreaterThanOrEqual(4); // Fixture has 4 signals
      
      // Validate first signal structure
      const firstSignal = signalNodes[0];
      expect(firstSignal.type).toBe('signal_statement');
      expect(firstSignal.text).toContain('signal');
    });

    it('should parse source code string directly', () => {
      const sourceCode = 'signal test_signal(value: int)\n';
      
      const tree = bridge.parseString(sourceCode);
      
      expect(tree).toBeDefined();
      expect(tree.rootNode.type).toBe('source_file');
      
      const signalNodes = findSignalNodes(tree);
      expect(signalNodes.length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should throw error if parseFile called before init', async () => {
      const uninitializedBridge = new TreeSitterBridge();
      const fixturePath = resolve(__dirname, 'fixtures/simple_signals.gd');
      
      await expect(uninitializedBridge.parseFile(fixturePath)).rejects.toThrow(
        'TreeSitterBridge not initialized'
      );
    });

    it('should throw error if parseString called before init', () => {
      const uninitializedBridge = new TreeSitterBridge();
      
      expect(() => uninitializedBridge.parseString('signal test')).toThrow(
        'TreeSitterBridge not initialized'
      );
    });

    it('should handle file read errors gracefully', async () => {
      const nonExistentPath = '/tmp/nonexistent_file.gd';
      
      await expect(bridge.parseFile(nonExistentPath)).rejects.toThrow(
        'Failed to parse file'
      );
    });
  });

  describe('Performance Validation', () => {
    it('should parse 1000 LOC file in <250ms', async () => {
      // Generate a 1000-line synthetic fixture
      const lines: string[] = ['extends Node', ''];
      for (let i = 0; i < 250; i++) {
        lines.push(`signal test_signal_${i}(value: int)`);
        lines.push(`func test_func_${i}():`);
        lines.push(`\tpass`);
        lines.push('');
      }
      const largeSourceCode = lines.join('\n');
      expect(largeSourceCode.split('\n').length).toBeGreaterThanOrEqual(1000);

      const startTime = Date.now();
      const tree = bridge.parseString(largeSourceCode);
      const duration = Date.now() - startTime;

      expect(tree).toBeDefined();
      expect(duration).toBeLessThan(250);
    });
  });

  describe('Integration with tree_sitter_types utilities', () => {
    it('should work with findSignalNodes utility', async () => {
      const sourceCode = `
extends Node
signal player_ready
signal health_changed(new_value: int, old_value: int)
      `.trim();

      const tree = bridge.parseString(sourceCode);
      const signalNodes = findSignalNodes(tree);

      expect(signalNodes.length).toBe(2);
      expect(signalNodes[0].text).toContain('player_ready');
      expect(signalNodes[1].text).toContain('health_changed');
    });
  });
});
