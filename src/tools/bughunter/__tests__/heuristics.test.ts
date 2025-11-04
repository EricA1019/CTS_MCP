/**
 * Bughunter Heuristics Unit Tests
 * 
 * Tests for individual bug pattern detection and severity scoring.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { TreeSitterBridge } from '../../../artifacts/parsers/tree_sitter_bridge';
import { 
  applyHeuristics, 
  calculateSeverityScore, 
  BUG_PATTERNS,
  BugMatch 
} from '../heuristics';

describe('Bughunter Heuristics', () => {
  let bridge: TreeSitterBridge;

  beforeAll(async () => {
    bridge = new TreeSitterBridge();
    await bridge.init();
  });

  describe('Bug Pattern Detection', () => {
    it('should detect missing null check', () => {
      const code = `
func test():
    var player = get_node("Player")
    player.take_damage(10)
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const nullCheckBugs = bugs.filter(b => b.pattern === 'missing_null_check');
      expect(nullCheckBugs.length).toBeGreaterThan(0);
      expect(nullCheckBugs[0].severity).toBe('medium');
    });

    it('should detect missing error handling', () => {
      const code = `
func test():
    load("res://scene.tscn")
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const errorBugs = bugs.filter(b => b.pattern === 'missing_error_handling');
      expect(errorBugs.length).toBeGreaterThan(0);
      expect(errorBugs[0].severity).toBe('high');
    });

    it('should detect type mismatches', () => {
      const code = `
func test():
    var count = "hello"
    var index = "world"
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const typeBugs = bugs.filter(b => b.pattern === 'type_mismatch_likely');
      expect(typeBugs.length).toBeGreaterThan(0);
    });

    it('should detect division by zero risk', () => {
      const code = `
func calculate(numerator, denominator):
    return numerator / denominator
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const divBugs = bugs.filter(b => b.pattern === 'division_by_zero_risk');
      expect(divBugs.length).toBeGreaterThan(0);
      expect(divBugs[0].severity).toBe('high');
    });

    it('should detect unused return values', () => {
      const code = `
func test():
    get_node("Player")
    find_something()
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const unusedBugs = bugs.filter(b => b.pattern === 'unused_return_value');
      expect(unusedBugs.length).toBeGreaterThan(0);
      expect(unusedBugs[0].severity).toBe('low');
    });

    it('should detect signal leaks', () => {
      const code = `
func _ready():
    signal_bus.connect("player_died", _on_player_died)
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const signalBugs = bugs.filter(b => b.pattern === 'signal_leak');
      expect(signalBugs.length).toBeGreaterThan(0);
      expect(signalBugs[0].severity).toBe('high');
    });

    it('should detect nodes not freed', () => {
      const code = `
func create_enemy():
    var enemy = preload("res://enemy.tscn").instance()
    return enemy
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const freeBugs = bugs.filter(b => b.pattern === 'node_not_freed');
      expect(freeBugs.length).toBeGreaterThan(0);
      expect(freeBugs[0].severity).toBe('critical');
    });

    it('should detect missing ready check', () => {
      const code = `
func _init():
    var player = get_node("Player")
    player.health = 100
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const readyBugs = bugs.filter(b => b.pattern === 'missing_ready_check');
      expect(readyBugs.length).toBeGreaterThan(0);
      expect(readyBugs[0].severity).toBe('medium');
    });

    it('should detect export without type', () => {
      const code = `
@export var speed = 100
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const exportBugs = bugs.filter(b => b.pattern === 'export_without_type');
      expect(exportBugs.length).toBeGreaterThan(0);
      expect(exportBugs[0].severity).toBe('low');
    });

    it('should detect onready with null path', () => {
      const code = `
@onready var player = get_node("HardcodedPath/Player")
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const onreadyBugs = bugs.filter(b => b.pattern === 'onready_with_null_path');
      expect(onreadyBugs.length).toBeGreaterThan(0);
      expect(onreadyBugs[0].severity).toBe('medium');
    });
  });

  describe('Pattern Coverage', () => {
    it('should have 10 defined patterns', () => {
      expect(BUG_PATTERNS).toHaveLength(10);
    });

    it('should have 5 general patterns', () => {
      const generalPatterns = BUG_PATTERNS.filter(p => 
        !p.id.includes('signal') && 
        !p.id.includes('node') && 
        !p.id.includes('ready') &&
        !p.id.includes('export') &&
        !p.id.includes('onready')
      );
      expect(generalPatterns.length).toBe(5);
    });

    it('should have 5 GDScript-specific patterns', () => {
      const gdscriptPatterns = BUG_PATTERNS.filter(p => 
        p.id.includes('signal') || 
        p.id.includes('node') || 
        p.id.includes('ready') ||
        p.id.includes('export') ||
        p.id.includes('onready')
      );
      expect(gdscriptPatterns.length).toBe(5);
    });

    it('all patterns should have required fields', () => {
      for (const pattern of BUG_PATTERNS) {
        expect(pattern.id).toBeDefined();
        expect(pattern.name).toBeDefined();
        expect(pattern.severity).toMatch(/^(low|medium|high|critical)$/);
        expect(pattern.description).toBeDefined();
        expect(typeof pattern.detect).toBe('function');
      }
    });
  });

  describe('Severity Scoring', () => {
    it('should return 100 for no bugs', () => {
      const score = calculateSeverityScore([]);
      expect(score).toBe(100);
    });

    it('should return lower score for low severity bugs', () => {
      const bugs: BugMatch[] = [
        { pattern: 'test', name: 'Test', severity: 'low', line: 1, column: 1, message: 'test' },
        { pattern: 'test', name: 'Test', severity: 'low', line: 2, column: 1, message: 'test' },
      ];
      const score = calculateSeverityScore(bugs);
      expect(score).toBeGreaterThan(90);
      expect(score).toBeLessThan(100);
    });

    it('should return moderate score for medium severity bugs', () => {
      const bugs: BugMatch[] = [
        { pattern: 'test', name: 'Test', severity: 'medium', line: 1, column: 1, message: 'test' },
        { pattern: 'test', name: 'Test', severity: 'medium', line: 2, column: 1, message: 'test' },
        { pattern: 'test', name: 'Test', severity: 'medium', line: 3, column: 1, message: 'test' },
      ];
      const score = calculateSeverityScore(bugs);
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThan(95);
    });

    it('should return low score for critical bugs', () => {
      const bugs: BugMatch[] = [
        { pattern: 'test', name: 'Test', severity: 'critical', line: 1, column: 1, message: 'test' },
        { pattern: 'test', name: 'Test', severity: 'critical', line: 2, column: 1, message: 'test' },
        { pattern: 'test', name: 'Test', severity: 'critical', line: 3, column: 1, message: 'test' },
      ];
      const score = calculateSeverityScore(bugs);
      expect(score).toBeLessThan(80);
    });

    it('should weight severity appropriately', () => {
      const lowBugs: BugMatch[] = Array(10).fill(null).map((_, i) => ({
        pattern: 'test', name: 'Test', severity: 'low' as const, line: i, column: 1, message: 'test'
      }));
      
      const criticalBugs: BugMatch[] = Array(2).fill(null).map((_, i) => ({
        pattern: 'test', name: 'Test', severity: 'critical' as const, line: i, column: 1, message: 'test'
      }));

      const lowScore = calculateSeverityScore(lowBugs);
      const criticalScore = calculateSeverityScore(criticalBugs);

      // 2 critical bugs should be worse than 10 low bugs
      expect(criticalScore).toBeLessThan(lowScore);
    });
  });

  describe('Bug Match Information', () => {
    it('should include line and column numbers', () => {
      const code = `
func test():
    player.take_damage(10)
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      if (bugs.length > 0) {
        expect(bugs[0].line).toBeGreaterThan(0);
        expect(bugs[0].column).toBeGreaterThan(0);
      }
    });

    it('should include helpful messages', () => {
      const code = `
func test():
    var count = "hello"
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const typeBugs = bugs.filter(b => b.pattern === 'type_mismatch_likely');
      if (typeBugs.length > 0) {
        expect(typeBugs[0].message).toBeDefined();
        expect(typeBugs[0].message.length).toBeGreaterThan(10);
      }
    });

    it('should include suggestions when available', () => {
      const code = `
func test():
    load("res://scene.tscn")
`;
      const tree = bridge.parseString(code);
      const bugs = applyHeuristics(tree, code);

      const errorBugs = bugs.filter(b => b.pattern === 'missing_error_handling');
      if (errorBugs.length > 0) {
        expect(errorBugs[0].suggestion).toBeDefined();
      }
    });
  });
});
