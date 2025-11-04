/**
 * TF-IDF Labeler
 *
 * Generates semantic labels for signal clusters using TF-IDF analysis.
 *
 * Algorithm:
 * 1. Tokenize signal names by splitting on underscores
 * 2. Calculate term frequency (TF) within cluster
 * 3. Calculate inverse document frequency (IDF) across all signals
 * 4. Compute TF-IDF scores and select top 3 terms
 * 5. Join top terms with underscores to form label
 */
import type { TermScore } from './types.js';
export declare class TFIDFLabeler {
    private corpusTokens;
    private totalSignals;
    constructor();
    /**
     * Build corpus from all signal names in the project.
     * This must be called once before generating labels.
     */
    buildCorpus(allSignalNames: string[]): void;
    /**
     * Generate semantic label for a cluster using TF-IDF.
     *
     * @param signalNames - Signals in the cluster
     * @param topN - Number of top terms to include in label (default: 3)
     * @returns Auto-generated label (e.g., 'player_health_damage')
     */
    generateLabel(signalNames: string[], topN?: number): string;
    /**
     * Generate label with detailed term scores.
     * Useful for debugging and manual review.
     */
    generateLabelWithScores(signalNames: string[], topN?: number): {
        label: string;
        topTerms: TermScore[];
    };
    /**
     * Tokenize signal name by splitting on underscores.
     * Filters out common noise words.
     */
    private tokenize;
    /**
     * Calculate inverse document frequency for a term.
     *
     * IDF = log(N / df)
     * where N = total signals, df = signals containing term
     */
    private calculateIDF;
    /**
     * Get corpus statistics for debugging.
     */
    getCorpusStats(): {
        totalSignals: number;
        uniqueTerms: number;
        avgTermsPerSignal: number;
    };
}
//# sourceMappingURL=tfidf_labeler.d.ts.map