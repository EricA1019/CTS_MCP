/**
 * Community Detection Algorithm
 * Uses greedy modularity optimization to cluster graph nodes
 */
export interface GraphNode {
    id: string;
    [key: string]: any;
}
export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    [key: string]: any;
}
export interface ClusterResult {
    clusters: Map<number, Set<string>>;
    nodeToCluster: Map<string, number>;
    modularity: number;
}
/**
 * Detect communities using greedy modularity optimization
 * Based on the Clauset-Newman-Moore algorithm
 *
 * @param nodes - Array of graph nodes
 * @param links - Array of graph edges
 * @returns Cluster assignments and modularity score
 */
export declare function detectCommunities(nodes: GraphNode[], links: GraphLink[]): ClusterResult;
//# sourceMappingURL=community_detection.d.ts.map