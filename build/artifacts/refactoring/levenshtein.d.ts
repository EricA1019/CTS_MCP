/**
 * Levenshtein Distance Algorithm
 *
 * Calculates edit distance between two strings for similarity detection.
 *
 * @module refactoring/levenshtein
 */
/**
 * Calculate Levenshtein distance between two strings.
 *
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into another.
 *
 * Time complexity: O(m * n) where m and n are string lengths
 * Space complexity: O(min(m, n)) using space-optimized approach
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Edit distance between the strings
 *
 * @example
 * ```typescript
 * levenshtein('health_changed', 'health_change') // 1
 * levenshtein('player_died', 'player_dead') // 2
 * levenshtein('signal_a', 'signal_b') // 1
 * ```
 */
export declare function levenshtein(s1: string, s2: string): number;
/**
 * Calculate normalized Levenshtein distance (0.0 - 1.0).
 *
 * Normalized distance = distance / max(len1, len2)
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Normalized distance (0.0 = identical, 1.0 = completely different)
 */
export declare function normalizedLevenshtein(s1: string, s2: string): number;
/**
 * Calculate Levenshtein similarity (0.0 - 1.0).
 *
 * Similarity = 1 - normalized distance
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Similarity score (1.0 = identical, 0.0 = completely different)
 */
export declare function levenshteinSimilarity(s1: string, s2: string): number;
//# sourceMappingURL=levenshtein.d.ts.map