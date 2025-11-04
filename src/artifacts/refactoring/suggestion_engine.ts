/**
 * Refactoring Suggestion Engine - Phase 3 HOP 3.4
 * 
 * AI-powered refactoring suggestion engine using similarity detection and naming validation.
 * 
 * Architecture:
 * - Similarity detection: Levenshtein distance with early termination heuristics
 * - Naming validation: GDScript snake_case convention enforcement
 * - Confidence scoring: Heuristic-based confidence for merge suggestions
 * 
 * Performance:
 * - Target: <2s for 300 signals
 * - Optimization: Early termination reduces 45K → 5K comparisons
 * - Heuristics: First char match, length difference ≤3
 * 
 * @module refactoring/suggestion_engine
 */

import type { SignalGraph } from '../graph/types.js';
import { levenshtein } from './levenshtein.js';
import { isSnakeCase, toSnakeCase, validateNaming } from './naming_validator.js';
import {
  RefactorType,
  type RefactorSuggestion,
  type RefactoringStats,
  type SimilarityStats,
} from './types.js';

/**
 * Generates refactoring suggestions for signal names.
 * 
 * @example
 * ```typescript
 * const engine = new RefactoringEngine();
 * const suggestions = await engine.generateSuggestions(signalGraph);
 * 
 * console.log(`Generated ${suggestions.length} suggestions`);
 * suggestions.forEach(s => {
 *   console.log(`${s.type}: ${s.target} → ${s.replacement} (${s.confidence})`);
 * });
 * ```
 */
export class RefactoringEngine {
  private stats: RefactoringStats = {
    totalSuggestions: 0,
    mergeSuggestions: 0,
    renameSuggestions: 0,
    deprecateSuggestions: 0,
    durationMs: 0,
    avgConfidence: 0,
    similarityStats: {
      signalsAnalyzed: 0,
      comparisonsPerformed: 0,
      comparisonsSkipped: 0,
      similarPairsFound: 0,
      durationMs: 0,
    },
  };

  /**
   * Generate refactoring suggestions for signal graph.
   * 
   * @param graph - Complete signal graph
   * @returns Array of refactoring suggestions sorted by confidence (highest first)
   */
  async generateSuggestions(graph: SignalGraph): Promise<RefactorSuggestion[]> {
    const startTime = performance.now();
    const suggestions: RefactorSuggestion[] = [];

    // Reset stats
    this.resetStats();

    const signals = Array.from(graph.definitions.keys());
    this.stats.similarityStats.signalsAnalyzed = signals.length;

    // Phase 1: Similarity detection with early termination
    const similarityStartTime = performance.now();
    const similaritySuggestions = this.detectSimilarSignals(signals);
    this.stats.similarityStats.durationMs = performance.now() - similarityStartTime;
    suggestions.push(...similaritySuggestions);
    this.stats.mergeSuggestions = similaritySuggestions.length;

    // Phase 2: Naming convention validation
    for (const [signalName, defs] of graph.definitions) {
      const violation = validateNaming(
        signalName,
        defs.map(d => d.filePath)
      );

      if (violation) {
        suggestions.push({
          type: RefactorType.Rename,
          target: signalName,
          replacement: violation.suggestedFix,
          confidence: 1.0, // Perfect confidence for convention violations
          reason: `GDScript convention: ${this.formatViolationType(violation.violationType)}`,
          affectedFiles: violation.filePaths,
        });
        this.stats.renameSuggestions++;
      }
    }

    // Sort by confidence (highest first)
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // Update stats
    this.stats.totalSuggestions = suggestions.length;
    this.stats.durationMs = performance.now() - startTime;
    if (suggestions.length > 0) {
      const totalConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0);
      this.stats.avgConfidence = totalConfidence / suggestions.length;
    }

    return suggestions;
  }

  /**
   * Detect similar signal names using Levenshtein distance with early termination.
   * 
   * Early termination heuristics:
   * 1. First character mismatch → skip (different category likely)
   * 2. Length difference > 3 → skip (too dissimilar)
   * 
   * @param signals - Array of signal names
   * @returns Array of merge suggestions
   */
  private detectSimilarSignals(signals: string[]): RefactorSuggestion[] {
    const suggestions: RefactorSuggestion[] = [];
    const n = signals.length;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const sig1 = signals[i];
        const sig2 = signals[j];

        // Early termination heuristic 1: First character mismatch
        if (sig1[0] !== sig2[0]) {
          this.stats.similarityStats.comparisonsSkipped++;
          continue;
        }

        // Early termination heuristic 2: Length difference > 3
        if (Math.abs(sig1.length - sig2.length) > 3) {
          this.stats.similarityStats.comparisonsSkipped++;
          continue;
        }

        // Perform Levenshtein distance calculation
        this.stats.similarityStats.comparisonsPerformed++;
        const distance = levenshtein(sig1, sig2);

        // Threshold: distance ≤ 2 (very similar)
        if (distance <= 2) {
          this.stats.similarityStats.similarPairsFound++;

          const confidence = this.computeSimilarityConfidence(sig1, sig2, distance);
          
          if (confidence >= 0.98) {
            suggestions.push({
              type: RefactorType.Merge,
              target: sig1,
              replacement: sig2,
              confidence,
              reason: `Similar names (Levenshtein distance: ${distance})`,
              distance,
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Compute confidence for similarity-based merge suggestions.
   * 
   * Confidence factors:
   * - Distance 1 + both snake_case: 0.99
   * - Distance 1: 0.98
   * - Distance 2 + both snake_case: 0.98
   * - Distance 2: 0.97 (below threshold, not suggested)
   * 
   * @param s1 - First signal name
   * @param s2 - Second signal name
   * @param distance - Levenshtein distance
   * @returns Confidence score (0.0-1.0)
   */
  private computeSimilarityConfidence(s1: string, s2: string, distance: number): number {
    const bothSnakeCase = isSnakeCase(s1) && isSnakeCase(s2);

    if (distance === 1) {
      return bothSnakeCase ? 0.99 : 0.98;
    }

    if (distance === 2) {
      return bothSnakeCase ? 0.98 : 0.97;
    }

    return 0.95; // Distance > 2 (shouldn't reach here due to threshold)
  }

  /**
   * Format violation type for human-readable reason.
   */
  private formatViolationType(violationType: string): string {
    switch (violationType) {
      case 'not_snake_case':
        return 'signals should use snake_case';
      case 'starts_with_uppercase':
        return 'signals should start with lowercase letter';
      case 'contains_spaces':
        return 'signals cannot contain spaces';
      default:
        return 'naming convention violation';
    }
  }

  /**
   * Get refactoring statistics.
   */
  getStats(): RefactoringStats {
    return { ...this.stats };
  }

  /**
   * Reset refactoring statistics.
   */
  resetStats(): void {
    this.stats = {
      totalSuggestions: 0,
      mergeSuggestions: 0,
      renameSuggestions: 0,
      deprecateSuggestions: 0,
      durationMs: 0,
      avgConfidence: 0,
      similarityStats: {
        signalsAnalyzed: 0,
        comparisonsPerformed: 0,
        comparisonsSkipped: 0,
        similarPairsFound: 0,
        durationMs: 0,
      },
    };
  }
}
