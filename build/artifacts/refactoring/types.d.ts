/**
 * Refactoring Types
 *
 * Type definitions for refactoring suggestions and naming convention validation.
 *
 * @module refactoring/types
 */
/**
 * Refactoring suggestion type.
 */
export declare enum RefactorType {
    /** Rename signal to similar name (duplicate detection) */
    Merge = "merge",
    /** Rename signal to fix naming convention */
    Rename = "rename",
    /** Mark signal as deprecated */
    Deprecate = "deprecate"
}
/**
 * Refactoring suggestion.
 */
export interface RefactorSuggestion {
    /** Suggestion type */
    type: RefactorType;
    /** Target signal name */
    target: string;
    /** Suggested replacement name */
    replacement: string;
    /** Confidence score (0.0-1.0) */
    confidence: number;
    /** Human-readable reason */
    reason: string;
    /** Levenshtein distance (for similarity-based suggestions) */
    distance?: number;
    /** Affected file paths */
    affectedFiles?: string[];
}
/**
 * Naming convention validation result.
 */
export interface NamingViolation {
    /** Signal name */
    signalName: string;
    /** Violation type */
    violationType: 'not_snake_case' | 'starts_with_uppercase' | 'contains_spaces';
    /** Suggested fix */
    suggestedFix: string;
    /** File paths where signal is defined */
    filePaths: string[];
}
/**
 * Similarity detection statistics.
 */
export interface SimilarityStats {
    /** Total signals analyzed */
    signalsAnalyzed: number;
    /** Total comparisons performed */
    comparisonsPerformed: number;
    /** Comparisons skipped via early termination */
    comparisonsSkipped: number;
    /** Similar pairs found */
    similarPairsFound: number;
    /** Detection duration in ms */
    durationMs: number;
}
/**
 * Refactoring engine statistics.
 */
export interface RefactoringStats {
    /** Total suggestions generated */
    totalSuggestions: number;
    /** Merge suggestions */
    mergeSuggestions: number;
    /** Rename suggestions */
    renameSuggestions: number;
    /** Deprecate suggestions */
    deprecateSuggestions: number;
    /** Analysis duration in ms */
    durationMs: number;
    /** Average confidence score */
    avgConfidence: number;
    /** Similarity detection stats */
    similarityStats: SimilarityStats;
}
//# sourceMappingURL=types.d.ts.map