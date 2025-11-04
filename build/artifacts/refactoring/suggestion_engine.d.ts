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
import { type RefactorSuggestion, type RefactoringStats } from './types.js';
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
export declare class RefactoringEngine {
    private stats;
    /**
     * Generate refactoring suggestions for signal graph.
     *
     * @param graph - Complete signal graph
     * @returns Array of refactoring suggestions sorted by confidence (highest first)
     */
    generateSuggestions(graph: SignalGraph): Promise<RefactorSuggestion[]>;
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
    private detectSimilarSignals;
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
    private computeSimilarityConfidence;
    /**
     * Format violation type for human-readable reason.
     */
    private formatViolationType;
    /**
     * Get refactoring statistics.
     */
    getStats(): RefactoringStats;
    /**
     * Reset refactoring statistics.
     */
    resetStats(): void;
}
//# sourceMappingURL=suggestion_engine.d.ts.map