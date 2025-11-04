/**
 * Levenshtein Distance Tests - HOP 3.4
 * 
 * Tests for edit distance calculations.
 */

import { describe, it, expect } from '@jest/globals';
import { levenshtein, normalizedLevenshtein, levenshteinSimilarity } from '../levenshtein.js';

describe('Levenshtein Distance', () => {
  describe('levenshtein()', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshtein('hello', 'hello')).toBe(0);
      expect(levenshtein('health_changed', 'health_changed')).toBe(0);
      expect(levenshtein('', '')).toBe(0);
    });

    it('should return length for empty string comparisons', () => {
      expect(levenshtein('', 'hello')).toBe(5);
      expect(levenshtein('world', '')).toBe(5);
    });

    it('should calculate distance for single character difference', () => {
      expect(levenshtein('health_changed', 'health_change')).toBe(1); // deletion
      expect(levenshtein('player_died', 'player_dieds')).toBe(1); // insertion
      expect(levenshtein('signal_a', 'signal_b')).toBe(1); // substitution
    });

    it('should calculate distance for multiple character differences', () => {
      expect(levenshtein('health_changed', 'health_modify')).toBe(7); // changed -> modify (7 chars different)
      expect(levenshtein('player_died', 'player_dead')).toBe(2);
      expect(levenshtein('kitten', 'sitting')).toBe(3);
    });

    it('should be case-sensitive', () => {
      expect(levenshtein('Hello', 'hello')).toBe(1);
      expect(levenshtein('HEALTH', 'health')).toBe(6);
    });

    it('should handle signal name typos', () => {
      expect(levenshtein('health_changed', 'helth_changed')).toBe(1);
      expect(levenshtein('player_died', 'playr_died')).toBe(1);
      expect(levenshtein('on_button_pressed', 'on_button_presed')).toBe(1);
    });

    it('should work with common GDScript signal patterns', () => {
      expect(levenshtein('on_ready', 'on_read')).toBe(1);
      expect(levenshtein('health_changed', 'health_change')).toBe(1);
      expect(levenshtein('button_pressed', 'button_released')).toBe(4);
    });
  });

  describe('normalizedLevenshtein()', () => {
    it('should return 0.0 for identical strings', () => {
      expect(normalizedLevenshtein('hello', 'hello')).toBe(0);
    });

    it('should return 1.0 for completely different strings of same length', () => {
      expect(normalizedLevenshtein('abc', 'xyz')).toBe(1.0);
    });

    it('should normalize by max length', () => {
      expect(normalizedLevenshtein('hello', 'helo')).toBeCloseTo(0.2, 2); // 1/5
      expect(normalizedLevenshtein('test', 'testing')).toBeCloseTo(0.428, 2); // 3/7
    });

    it('should handle empty strings', () => {
      expect(normalizedLevenshtein('', '')).toBe(0);
      expect(normalizedLevenshtein('', 'hello')).toBe(1.0);
    });
  });

  describe('levenshteinSimilarity()', () => {
    it('should return 1.0 for identical strings', () => {
      expect(levenshteinSimilarity('hello', 'hello')).toBe(1.0);
    });

    it('should return 0.0 for completely different strings', () => {
      expect(levenshteinSimilarity('abc', 'xyz')).toBe(0.0);
    });

    it('should calculate similarity correctly', () => {
      expect(levenshteinSimilarity('hello', 'helo')).toBeCloseTo(0.8, 2); // 1 - 1/5
      expect(levenshteinSimilarity('test', 'testing')).toBeCloseTo(0.571, 2); // 1 - 3/7
    });

    it('should give high similarity for typos', () => {
      expect(levenshteinSimilarity('health_changed', 'helth_changed')).toBeGreaterThan(0.9);
      expect(levenshteinSimilarity('player_died', 'playr_died')).toBeGreaterThan(0.9);
    });
  });
});
