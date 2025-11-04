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
export function levenshtein(s1: string, s2: string): number {
  // Optimize: swap if s1 is longer to minimize space usage
  if (s1.length > s2.length) {
    [s1, s2] = [s2, s1];
  }

  const len1 = s1.length;
  const len2 = s2.length;

  // Edge cases
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Use single row for space optimization (O(n) instead of O(m*n))
  let prevRow = new Array(len1 + 1);
  let currRow = new Array(len1 + 1);

  // Initialize first row (distances from empty string)
  for (let i = 0; i <= len1; i++) {
    prevRow[i] = i;
  }

  // Calculate distances row by row
  for (let j = 1; j <= len2; j++) {
    currRow[0] = j; // Distance from empty string

    for (let i = 1; i <= len1; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

      currRow[i] = Math.min(
        prevRow[i] + 1,      // Deletion
        currRow[i - 1] + 1,  // Insertion
        prevRow[i - 1] + cost // Substitution
      );
    }

    // Swap rows for next iteration
    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[len1];
}

/**
 * Calculate normalized Levenshtein distance (0.0 - 1.0).
 * 
 * Normalized distance = distance / max(len1, len2)
 * 
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Normalized distance (0.0 = identical, 1.0 = completely different)
 */
export function normalizedLevenshtein(s1: string, s2: string): number {
  const distance = levenshtein(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 0 : distance / maxLen;
}

/**
 * Calculate Levenshtein similarity (0.0 - 1.0).
 * 
 * Similarity = 1 - normalized distance
 * 
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Similarity score (1.0 = identical, 0.0 = completely different)
 */
export function levenshteinSimilarity(s1: string, s2: string): number {
  return 1 - normalizedLevenshtein(s1, s2);
}
