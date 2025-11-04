/**
 * GDScript Naming Convention Validator
 * 
 * Validates signal names against GDScript style guide conventions.
 * 
 * GDScript Convention: snake_case for signals
 * - All lowercase
 * - Words separated by underscores
 * - Can start with underscore (private signals)
 * - Common patterns: on_*, *_changed, *_pressed, *_completed
 * 
 * @module refactoring/naming_validator
 */

import type { NamingViolation } from './types.js';

/**
 * Check if string is valid snake_case.
 * 
 * @param name - Signal name to validate
 * @returns True if valid snake_case
 */
export function isSnakeCase(name: string): boolean {
  // Pattern: lowercase letters, digits, underscores
  // Must start with lowercase letter or underscore
  return /^[a-z_][a-z0-9_]*$/.test(name);
}

/**
 * Convert string to snake_case.
 * 
 * @param name - Signal name to convert
 * @returns snake_case version
 */
export function toSnakeCase(name: string): string {
  return name
    // Insert underscore before uppercase letters
    .replace(/([A-Z])/g, '_$1')
    // Replace spaces/hyphens with underscores
    .replace(/[\s-]+/g, '_')
    // Convert to lowercase
    .toLowerCase()
    // Remove leading underscores (unless original started with _)
    .replace(/^_+/, name.startsWith('_') ? '_' : '')
    // Remove duplicate underscores
    .replace(/_+/g, '_');
}

/**
 * Validate signal name against GDScript conventions.
 * 
 * @param signalName - Signal name to validate
 * @param filePaths - File paths where signal is defined
 * @returns Violation if name doesn't follow conventions, null otherwise
 */
export function validateNaming(
  signalName: string,
  filePaths: string[]
): NamingViolation | null {
  // Check for spaces
  if (/\s/.test(signalName)) {
    return {
      signalName,
      violationType: 'contains_spaces',
      suggestedFix: toSnakeCase(signalName),
      filePaths,
    };
  }

  // Check for uppercase start (not counting leading underscore)
  const nameWithoutUnderscore = signalName.replace(/^_+/, '');
  if (nameWithoutUnderscore.length > 0 && /^[A-Z]/.test(nameWithoutUnderscore)) {
    return {
      signalName,
      violationType: 'starts_with_uppercase',
      suggestedFix: toSnakeCase(signalName),
      filePaths,
    };
  }

  // Check snake_case compliance
  if (!isSnakeCase(signalName)) {
    return {
      signalName,
      violationType: 'not_snake_case',
      suggestedFix: toSnakeCase(signalName),
      filePaths,
    };
  }

  return null; // No violations
}

/**
 * Check if signal name follows common GDScript patterns.
 * 
 * Common patterns:
 * - on_* (event handlers)
 * - *_changed (state changes)
 * - *_pressed, *_released (input)
 * - *_completed, *_finished (async operations)
 * - *_entered, *_exited (area/collision)
 * 
 * @param signalName - Signal name to check
 * @returns True if follows common pattern
 */
export function hasCommonPattern(signalName: string): boolean {
  const commonPatterns = [
    /^on_/,              // on_ready, on_button_pressed
    /_changed$/,         // health_changed, position_changed
    /_pressed$/,         // button_pressed, key_pressed
    /_released$/,        // button_released
    /_completed$/,       // animation_completed, task_completed
    /_finished$/,        // tween_finished
    /_entered$/,         // area_entered, body_entered
    /_exited$/,          // area_exited, body_exited
    /_started$/,         // game_started, animation_started
    /_stopped$/,         // movement_stopped
    /_updated$/,         // stats_updated, inventory_updated
  ];

  return commonPatterns.some(pattern => pattern.test(signalName));
}

/**
 * Extract semantic suffix from signal name.
 * 
 * @param signalName - Signal name
 * @returns Suffix if found (e.g., 'changed', 'pressed'), null otherwise
 */
export function extractSuffix(signalName: string): string | null {
  const suffixMatch = signalName.match(/_(changed|pressed|released|completed|finished|entered|exited|started|stopped|updated)$/);
  return suffixMatch ? suffixMatch[1] : null;
}

/**
 * Extract semantic prefix from signal name.
 * 
 * @param signalName - Signal name
 * @returns Prefix if found (e.g., 'on'), null otherwise
 */
export function extractPrefix(signalName: string): string | null {
  const prefixMatch = signalName.match(/^(on)_/);
  return prefixMatch ? prefixMatch[1] : null;
}
