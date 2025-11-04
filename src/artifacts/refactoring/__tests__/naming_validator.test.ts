/**
 * Naming Validator Tests - HOP 3.4
 * 
 * Tests for GDScript naming convention validation.
 */

import { describe, it, expect } from '@jest/globals';
import {
  isSnakeCase,
  toSnakeCase,
  validateNaming,
  hasCommonPattern,
  extractSuffix,
  extractPrefix,
} from '../naming_validator.js';

describe('Naming Validator', () => {
  describe('isSnakeCase()', () => {
    it('should accept valid snake_case names', () => {
      expect(isSnakeCase('health_changed')).toBe(true);
      expect(isSnakeCase('player_died')).toBe(true);
      expect(isSnakeCase('on_button_pressed')).toBe(true);
      expect(isSnakeCase('signal_a')).toBe(true);
      expect(isSnakeCase('_private_signal')).toBe(true);
    });

    it('should reject camelCase names', () => {
      expect(isSnakeCase('healthChanged')).toBe(false);
      expect(isSnakeCase('playerDied')).toBe(false);
      expect(isSnakeCase('onButtonPressed')).toBe(false);
    });

    it('should reject PascalCase names', () => {
      expect(isSnakeCase('HealthChanged')).toBe(false);
      expect(isSnakeCase('PlayerDied')).toBe(false);
    });

    it('should reject names with spaces', () => {
      expect(isSnakeCase('health changed')).toBe(false);
      expect(isSnakeCase('player died')).toBe(false);
    });

    it('should accept names with numbers', () => {
      expect(isSnakeCase('signal_1')).toBe(true);
      expect(isSnakeCase('player_2_died')).toBe(true);
      expect(isSnakeCase('health_changed_v2')).toBe(true);
    });

    it('should reject names starting with numbers', () => {
      expect(isSnakeCase('1_signal')).toBe(false);
      expect(isSnakeCase('2player_died')).toBe(false);
    });
  });

  describe('toSnakeCase()', () => {
    it('should convert camelCase to snake_case', () => {
      expect(toSnakeCase('healthChanged')).toBe('health_changed');
      expect(toSnakeCase('playerDied')).toBe('player_died');
      expect(toSnakeCase('onButtonPressed')).toBe('on_button_pressed');
    });

    it('should convert PascalCase to snake_case', () => {
      expect(toSnakeCase('HealthChanged')).toBe('health_changed');
      expect(toSnakeCase('PlayerDied')).toBe('player_died');
    });

    it('should handle spaces and hyphens', () => {
      expect(toSnakeCase('health changed')).toBe('health_changed');
      expect(toSnakeCase('player-died')).toBe('player_died');
      expect(toSnakeCase('on button pressed')).toBe('on_button_pressed');
    });

    it('should preserve private signal prefix', () => {
      expect(toSnakeCase('_privateSignal')).toBe('_private_signal');
      expect(toSnakeCase('__doublePrivate')).toBe('_double_private');
    });

    it('should handle already snake_case names', () => {
      expect(toSnakeCase('health_changed')).toBe('health_changed');
      expect(toSnakeCase('player_died')).toBe('player_died');
    });

    it('should remove duplicate underscores', () => {
      expect(toSnakeCase('health__changed')).toBe('health_changed');
      expect(toSnakeCase('player___died')).toBe('player_died');
    });
  });

  describe('validateNaming()', () => {
    it('should return null for valid snake_case', () => {
      expect(validateNaming('health_changed', ['/player.gd'])).toBeNull();
      expect(validateNaming('player_died', ['/player.gd'])).toBeNull();
      expect(validateNaming('_private_signal', ['/test.gd'])).toBeNull();
    });

    it('should detect spaces', () => {
      const violation = validateNaming('health changed', ['/player.gd']);
      expect(violation).not.toBeNull();
      expect(violation?.violationType).toBe('contains_spaces');
      expect(violation?.suggestedFix).toBe('health_changed');
    });

    it('should detect uppercase start', () => {
      const violation = validateNaming('HealthChanged', ['/player.gd']);
      expect(violation).not.toBeNull();
      expect(violation?.violationType).toBe('starts_with_uppercase');
      expect(violation?.suggestedFix).toBe('health_changed');
    });

    it('should detect non-snake_case', () => {
      const violation = validateNaming('healthChanged', ['/player.gd']);
      expect(violation).not.toBeNull();
      expect(violation?.violationType).toBe('not_snake_case');
      expect(violation?.suggestedFix).toBe('health_changed');
    });

    it('should include file paths in violation', () => {
      const violation = validateNaming('HealthChanged', ['/player.gd', '/enemy.gd']);
      expect(violation?.filePaths).toEqual(['/player.gd', '/enemy.gd']);
    });
  });

  describe('hasCommonPattern()', () => {
    it('should detect on_* pattern', () => {
      expect(hasCommonPattern('on_ready')).toBe(true);
      expect(hasCommonPattern('on_button_pressed')).toBe(true);
      expect(hasCommonPattern('on_player_died')).toBe(true);
    });

    it('should detect *_changed pattern', () => {
      expect(hasCommonPattern('health_changed')).toBe(true);
      expect(hasCommonPattern('position_changed')).toBe(true);
      expect(hasCommonPattern('score_changed')).toBe(true);
    });

    it('should detect *_pressed/*_released patterns', () => {
      expect(hasCommonPattern('button_pressed')).toBe(true);
      expect(hasCommonPattern('key_pressed')).toBe(true);
      expect(hasCommonPattern('mouse_released')).toBe(true);
    });

    it('should detect *_completed/*_finished patterns', () => {
      expect(hasCommonPattern('animation_completed')).toBe(true);
      expect(hasCommonPattern('tween_finished')).toBe(true);
      expect(hasCommonPattern('task_completed')).toBe(true);
    });

    it('should detect *_entered/*_exited patterns', () => {
      expect(hasCommonPattern('area_entered')).toBe(true);
      expect(hasCommonPattern('body_entered')).toBe(true);
      expect(hasCommonPattern('player_exited')).toBe(true);
    });

    it('should detect *_started/*_stopped patterns', () => {
      expect(hasCommonPattern('game_started')).toBe(true);
      expect(hasCommonPattern('movement_stopped')).toBe(true);
    });

    it('should detect *_updated pattern', () => {
      expect(hasCommonPattern('stats_updated')).toBe(true);
      expect(hasCommonPattern('inventory_updated')).toBe(true);
    });

    it('should return false for non-pattern names', () => {
      expect(hasCommonPattern('player_died')).toBe(false);
      expect(hasCommonPattern('enemy_damaged')).toBe(false);
      expect(hasCommonPattern('custom_signal')).toBe(false);
    });
  });

  describe('extractSuffix()', () => {
    it('should extract common suffixes', () => {
      expect(extractSuffix('health_changed')).toBe('changed');
      expect(extractSuffix('button_pressed')).toBe('pressed');
      expect(extractSuffix('animation_completed')).toBe('completed');
      expect(extractSuffix('tween_finished')).toBe('finished');
      expect(extractSuffix('area_entered')).toBe('entered');
      expect(extractSuffix('player_exited')).toBe('exited');
      expect(extractSuffix('game_started')).toBe('started');
      expect(extractSuffix('movement_stopped')).toBe('stopped');
      expect(extractSuffix('stats_updated')).toBe('updated');
      expect(extractSuffix('key_released')).toBe('released');
    });

    it('should return null for no suffix', () => {
      expect(extractSuffix('player_died')).toBeNull();
      expect(extractSuffix('custom_signal')).toBeNull();
      expect(extractSuffix('on_ready')).toBeNull();
    });
  });

  describe('extractPrefix()', () => {
    it('should extract on_ prefix', () => {
      expect(extractPrefix('on_ready')).toBe('on');
      expect(extractPrefix('on_button_pressed')).toBe('on');
      expect(extractPrefix('on_player_died')).toBe('on');
    });

    it('should return null for no prefix', () => {
      expect(extractPrefix('health_changed')).toBeNull();
      expect(extractPrefix('player_died')).toBeNull();
      expect(extractPrefix('button_pressed')).toBeNull();
    });
  });
});
