/**
 * Hierarchical Clusterer
 *
 * Extends Phase 2 flat clustering to 2-level hierarchy using recursive community detection.
 * Generates semantic labels for clusters using TF-IDF analysis.
 *
 * Algorithm:
 * 1. Level 1: Detect top-level clusters using Phase 2 algorithm
 * 2. Level 2: Recursively cluster each top-level cluster (if ≥5 nodes)
 * 3. Auto-label: Generate TF-IDF labels for all clusters
 * 4. Emit events for monitoring
 */
import type { SignalGraph } from '../graph/types.js';
import { type HierarchicalClusters, type ClusteringStats } from './types.js';
export declare class HierarchicalClusterer {
    private labeler;
    private stats;
    constructor();
    /**
     * Perform hierarchical clustering on signal graph.
     *
     * @param graph - Signal graph with definitions, emissions, connections
     * @param depth - Hierarchy depth (1 = flat, 2 = 2-level hierarchy)
     * @param minSubClusterSize - Minimum nodes for sub-clustering (default: 5)
     * @returns Hierarchical clusters with labels and metadata
     */
    clusterHierarchical(graph: SignalGraph, depth?: number, minSubClusterSize?: number): Promise<HierarchicalClusters>;
    /**
     * Build graph structure from signal graph.
     * Creates nodes for each signal and links based on emissions/connections.
     */
    private buildGraphStructure;
    /**
     * Extract subgraph for a subset of nodes.
     * Only includes links between nodes in the subset.
     */
    private extractSubgraph;
    /**
     * Get clustering statistics.
     */
    getStats(): ClusteringStats;
    /**
     * Reset statistics.
     */
    resetStats(): void;
}
//# sourceMappingURL=hierarchical_clusterer.d.ts.map