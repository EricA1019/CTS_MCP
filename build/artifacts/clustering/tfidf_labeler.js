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
export class TFIDFLabeler {
    corpusTokens; // term -> signal names containing it
    totalSignals;
    constructor() {
        this.corpusTokens = new Map();
        this.totalSignals = 0;
    }
    /**
     * Build corpus from all signal names in the project.
     * This must be called once before generating labels.
     */
    buildCorpus(allSignalNames) {
        this.corpusTokens.clear();
        this.totalSignals = allSignalNames.length;
        for (const signalName of allSignalNames) {
            const tokens = this.tokenize(signalName);
            // Track which signals contain each term
            for (const token of tokens) {
                if (!this.corpusTokens.has(token)) {
                    this.corpusTokens.set(token, new Set());
                }
                this.corpusTokens.get(token).add(signalName);
            }
        }
    }
    /**
     * Generate semantic label for a cluster using TF-IDF.
     *
     * @param signalNames - Signals in the cluster
     * @param topN - Number of top terms to include in label (default: 3)
     * @returns Auto-generated label (e.g., 'player_health_damage')
     */
    generateLabel(signalNames, topN = 3) {
        if (signalNames.length === 0) {
            return 'empty_cluster';
        }
        if (signalNames.length === 1) {
            // Single-signal cluster: use signal name as label
            return signalNames[0];
        }
        // Tokenize all signals in cluster
        const clusterTokens = [];
        for (const name of signalNames) {
            clusterTokens.push(...this.tokenize(name));
        }
        // Calculate term frequencies
        const termFreq = new Map();
        for (const token of clusterTokens) {
            termFreq.set(token, (termFreq.get(token) || 0) + 1);
        }
        // Calculate TF-IDF scores
        const termScores = [];
        for (const [term, freq] of termFreq) {
            const tf = freq / clusterTokens.length;
            const idf = this.calculateIDF(term);
            const tfidf = tf * idf;
            termScores.push({ term, tf, idf, tfidf });
        }
        // Sort by TF-IDF score (highest first)
        termScores.sort((a, b) => b.tfidf - a.tfidf);
        // Take top N terms
        const topTerms = termScores.slice(0, topN).map(t => t.term);
        // Join with underscores
        return topTerms.join('_');
    }
    /**
     * Generate label with detailed term scores.
     * Useful for debugging and manual review.
     */
    generateLabelWithScores(signalNames, topN = 3) {
        if (signalNames.length === 0) {
            return { label: 'empty_cluster', topTerms: [] };
        }
        if (signalNames.length === 1) {
            return { label: signalNames[0], topTerms: [] };
        }
        const clusterTokens = [];
        for (const name of signalNames) {
            clusterTokens.push(...this.tokenize(name));
        }
        const termFreq = new Map();
        for (const token of clusterTokens) {
            termFreq.set(token, (termFreq.get(token) || 0) + 1);
        }
        const termScores = [];
        for (const [term, freq] of termFreq) {
            const tf = freq / clusterTokens.length;
            const idf = this.calculateIDF(term);
            const tfidf = tf * idf;
            termScores.push({ term, tf, idf, tfidf });
        }
        termScores.sort((a, b) => b.tfidf - a.tfidf);
        const topTerms = termScores.slice(0, topN);
        const label = topTerms.map(t => t.term).join('_');
        return { label, topTerms };
    }
    /**
     * Tokenize signal name by splitting on underscores.
     * Filters out common noise words.
     */
    tokenize(signalName) {
        const tokens = signalName.split('_').filter(t => t.length > 0);
        // Filter out common noise words
        const noiseWords = new Set(['on', 'changed', 'pressed', 'released', 'signal']);
        return tokens.filter(token => !noiseWords.has(token.toLowerCase()));
    }
    /**
     * Calculate inverse document frequency for a term.
     *
     * IDF = log(N / df)
     * where N = total signals, df = signals containing term
     */
    calculateIDF(term) {
        const signalsWithTerm = this.corpusTokens.get(term);
        if (!signalsWithTerm || signalsWithTerm.size === 0) {
            // Term not in corpus - shouldn't happen if corpus built correctly
            return 0;
        }
        const df = signalsWithTerm.size;
        return Math.log(this.totalSignals / df);
    }
    /**
     * Get corpus statistics for debugging.
     */
    getCorpusStats() {
        let totalTokens = 0;
        const allSignals = new Set();
        for (const signals of this.corpusTokens.values()) {
            signals.forEach(sig => allSignals.add(sig));
        }
        for (const signalName of allSignals) {
            totalTokens += this.tokenize(signalName).length;
        }
        return {
            totalSignals: this.totalSignals,
            uniqueTerms: this.corpusTokens.size,
            avgTermsPerSignal: totalTokens / (allSignals.size || 1),
        };
    }
}
//# sourceMappingURL=tfidf_labeler.js.map