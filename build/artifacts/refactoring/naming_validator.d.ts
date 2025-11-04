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
export declare function isSnakeCase(name: string): boolean;
/**
 * Convert string to snake_case.
 *
 * @param name - Signal name to convert
 * @returns snake_case version
 */
export declare function toSnakeCase(name: string): string;
/**
 * Validate signal name against GDScript conventions.
 *
 * @param signalName - Signal name to validate
 * @param filePaths - File paths where signal is defined
 * @returns Violation if name doesn't follow conventions, null otherwise
 */
export declare function validateNaming(signalName: string, filePaths: string[]): NamingViolation | null;
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
export declare function hasCommonPattern(signalName: string): boolean;
/**
 * Extract semantic suffix from signal name.
 *
 * @param signalName - Signal name
 * @returns Suffix if found (e.g., 'changed', 'pressed'), null otherwise
 */
export declare function extractSuffix(signalName: string): string | null;
/**
 * Extract semantic prefix from signal name.
 *
 * @param signalName - Signal name
 * @returns Prefix if found (e.g., 'on'), null otherwise
 */
export declare function extractPrefix(signalName: string): string | null;
//# sourceMappingURL=naming_validator.d.ts.map