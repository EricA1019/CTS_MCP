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
import { detectCommunities } from './community_detection.js';
import { TFIDFLabeler } from './tfidf_labeler.js';
export class HierarchicalClusterer {
    labeler;
    stats;
    constructor() {
        this.labeler = new TFIDFLabeler();
        this.stats = {
            durationMs: 0,
            topLevelClusters: 0,
            subClustersTotal: 0,
            avgClusterSize: 0,
            maxClusterSize: 0,
            minClusterSize: 0,
            avgModularity: 0,
        };
    }
    /**
     * Perform hierarchical clustering on signal graph.
     *
     * @param graph - Signal graph with definitions, emissions, connections
     * @param depth - Hierarchy depth (1 = flat, 2 = 2-level hierarchy)
     * @param minSubClusterSize - Minimum nodes for sub-clustering (default: 5)
     * @returns Hierarchical clusters with labels and metadata
     */
    async clusterHierarchical(graph, depth = 2, minSubClusterSize = 5) {
        const startTime = performance.now();
        console.log('[Hierarchical Clustering] Starting...');
        console.log(`[Hierarchical Clustering] Depth: ${depth}, Min sub-cluster size: ${minSubClusterSize}`);
        // Build TF-IDF corpus from all signals
        const allSignalNames = Array.from(graph.definitions.keys());
        this.labeler.buildCorpus(allSignalNames);
        const corpusStats = this.labeler.getCorpusStats();
        console.log(`[TF-IDF] Corpus: ${corpusStats.totalSignals} signals, ${corpusStats.uniqueTerms} unique terms`);
        // Build graph nodes and links
        const { nodes, links } = this.buildGraphStructure(graph);
        console.log(`[Hierarchical Clustering] Graph: ${nodes.length} nodes, ${links.length} links`);
        // Level 1: Top-level clustering
        const topLevelResult = detectCommunities(nodes, links);
        console.log(`[Hierarchical Clustering] Top-level: ${topLevelResult.clusters.size} clusters, modularity: ${topLevelResult.modularity.toFixed(4)}`);
        // Generate labels for top-level clusters
        const labeledClusters = new Map();
        for (const [clusterId, signalSet] of topLevelResult.clusters) {
            const signalNames = Array.from(signalSet);
            const { label, topTerms } = this.labeler.generateLabelWithScores(signalNames, 3);
            labeledClusters.set(clusterId, {
                id: clusterId,
                label,
                signals: signalSet,
                topTerms: topTerms.map(t => ({ term: t.term, score: t.tfidf })),
            });
        }
        // Level 2: Sub-clustering (if depth > 1)
        const subClusters = new Map();
        let totalSubClusters = 0;
        if (depth > 1) {
            for (const [parentId, parentCluster] of topLevelResult.clusters) {
                const parentNodes = Array.from(parentCluster);
                // Only sub-cluster if parent has enough nodes
                if (parentNodes.length < minSubClusterSize) {
                    console.log(`[Hierarchical Clustering] Skipping sub-cluster for cluster ${parentId} (${parentNodes.length} nodes < ${minSubClusterSize})`);
                    continue;
                }
                // Extract subgraph for this parent cluster
                const subgraph = this.extractSubgraph(parentNodes, links);
                // Detect communities in subgraph
                const subResult = detectCommunities(subgraph.nodes, subgraph.links);
                // Only keep sub-clustering if it found multiple clusters
                if (subResult.clusters.size > 1) {
                    subClusters.set(parentId, {
                        parentId,
                        clusters: subResult.clusters,
                        modularity: subResult.modularity,
                    });
                    totalSubClusters += subResult.clusters.size;
                    console.log(`[Hierarchical Clustering] Sub-cluster ${parentId}: ${subResult.clusters.size} sub-clusters, modularity: ${subResult.modularity.toFixed(4)}`);
                }
            }
        }
        // Calculate statistics
        const duration = performance.now() - startTime;
        const clusterSizes = Array.from(topLevelResult.clusters.values()).map(s => s.size);
        const avgClusterSize = clusterSizes.reduce((a, b) => a + b, 0) / clusterSizes.length;
        const maxClusterSize = Math.max(...clusterSizes);
        const minClusterSize = Math.min(...clusterSizes);
        this.stats = {
            durationMs: duration,
            topLevelClusters: topLevelResult.clusters.size,
            subClustersTotal: totalSubClusters,
            avgClusterSize,
            maxClusterSize,
            minClusterSize,
            avgModularity: topLevelResult.modularity,
        };
        console.log(`[Hierarchical Clustering] Completed in ${duration.toFixed(2)}ms`);
        console.log(`[Hierarchical Clustering] Stats: ${this.stats.topLevelClusters} top-level, ${this.stats.subClustersTotal} sub-clusters`);
        return {
            topLevel: {
                clusters: labeledClusters,
                modularity: topLevelResult.modularity,
            },
            subClusters: subClusters.size > 0 ? subClusters : undefined,
            metadata: {
                depth,
                totalSignals: allSignalNames.length,
                topLevelCount: topLevelResult.clusters.size,
                timestamp: Date.now(),
            },
        };
    }
    /**
     * Build graph structure from signal graph.
     * Creates nodes for each signal and links based on emissions/connections.
     */
    buildGraphStructure(graph) {
        const nodes = [];
        const links = [];
        // Create nodes from signal definitions
        for (const [signalName, definitions] of graph.definitions) {
            nodes.push({ id: signalName });
        }
        // Create links from emissions
        for (const [signalName, emissions] of graph.emissions) {
            // Group emissions by file to create co-emission links
            const fileGroups = new Map();
            for (const emission of emissions) {
                if (!fileGroups.has(emission.filePath)) {
                    fileGroups.set(emission.filePath, []);
                }
                fileGroups.get(emission.filePath).push(emission);
            }
            // Signals emitted in the same file are related
            for (const fileEmissions of fileGroups.values()) {
                if (fileEmissions.length > 1) {
                    for (let i = 0; i < fileEmissions.length; i++) {
                        for (let j = i + 1; j < fileEmissions.length; j++) {
                            const sig1 = fileEmissions[i].signalName;
                            const sig2 = fileEmissions[j].signalName;
                            if (sig1 !== sig2) {
                                links.push({ source: sig1, target: sig2 });
                            }
                        }
                    }
                }
            }
        }
        // Create links from connections
        for (const [signalName, connections] of graph.connections) {
            // Signals connected to the same handler are related
            const handlerGroups = new Map();
            for (const conn of connections) {
                const handlerKey = `${conn.target}::${conn.handler}`;
                if (!handlerGroups.has(handlerKey)) {
                    handlerGroups.set(handlerKey, new Set());
                }
                handlerGroups.get(handlerKey).add(signalName);
            }
            for (const signalSet of handlerGroups.values()) {
                const signals = Array.from(signalSet);
                if (signals.length > 1) {
                    for (let i = 0; i < signals.length; i++) {
                        for (let j = i + 1; j < signals.length; j++) {
                            links.push({ source: signals[i], target: signals[j] });
                        }
                    }
                }
            }
        }
        // Remove duplicate links
        const uniqueLinks = new Map();
        for (const link of links) {
            const key = [link.source, link.target].sort().join('->');
            uniqueLinks.set(key, link);
        }
        return { nodes, links: Array.from(uniqueLinks.values()) };
    }
    /**
     * Extract subgraph for a subset of nodes.
     * Only includes links between nodes in the subset.
     */
    extractSubgraph(nodeIds, allLinks) {
        const nodeSet = new Set(nodeIds);
        const nodes = nodeIds.map(id => ({ id }));
        const links = allLinks.filter(link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            return nodeSet.has(sourceId) && nodeSet.has(targetId);
        });
        return { nodes, links };
    }
    /**
     * Get clustering statistics.
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset statistics.
     */
    resetStats() {
        this.stats = {
            durationMs: 0,
            topLevelClusters: 0,
            subClustersTotal: 0,
            avgClusterSize: 0,
            maxClusterSize: 0,
            minClusterSize: 0,
            avgModularity: 0,
        };
    }
}
//# sourceMappingURL=hierarchical_clusterer.js.map