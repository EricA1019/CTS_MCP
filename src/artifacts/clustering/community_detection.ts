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
  clusters: Map<number, Set<string>>; // cluster ID -> node IDs
  nodeToCluster: Map<string, number>; // node ID -> cluster ID
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
export function detectCommunities(
  nodes: GraphNode[],
  links: GraphLink[]
): ClusterResult {
  const startTime = performance.now();

  // Edge case: Empty graph
  if (nodes.length === 0) {
    return {
      clusters: new Map(),
      nodeToCluster: new Map(),
      modularity: 0,
    };
  }

  // Edge case: Single node
  if (nodes.length === 1) {
    const nodeId = nodes[0].id;
    return {
      clusters: new Map([[0, new Set([nodeId])]]),
      nodeToCluster: new Map([[nodeId, 0]]),
      modularity: 0,
    };
  }

  // Normalize links to use node IDs
  const normalizedLinks = links.map(link => ({
    source: typeof link.source === 'string' ? link.source : link.source.id,
    target: typeof link.target === 'string' ? link.target : link.target.id,
  }));

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach(node => adjacency.set(node.id, new Set()));
  
  normalizedLinks.forEach(link => {
    adjacency.get(link.source)?.add(link.target);
    adjacency.get(link.target)?.add(link.source);
  });

  // Calculate node degrees
  const degrees = new Map<string, number>();
  nodes.forEach(node => {
    degrees.set(node.id, adjacency.get(node.id)?.size || 0);
  });

  const totalEdges = normalizedLinks.length;
  const m2 = 2 * totalEdges;

  // Initialize: Each node in its own cluster
  const nodeToCluster = new Map<string, number>();
  const clusters = new Map<number, Set<string>>();
  
  nodes.forEach((node, index) => {
    nodeToCluster.set(node.id, index);
    clusters.set(index, new Set([node.id]));
  });

  // Greedy modularity optimization
  let improved = true;
  let iterations = 0;
  const maxIterations = 100;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (const node of nodes) {
      const nodeId = node.id;
      const currentCluster = nodeToCluster.get(nodeId)!;
      const neighbors = adjacency.get(nodeId) || new Set();

      // Find neighboring clusters
      const neighborClusters = new Set<number>();
      neighbors.forEach(neighborId => {
        const cluster = nodeToCluster.get(neighborId);
        if (cluster !== undefined && cluster !== currentCluster) {
          neighborClusters.add(cluster);
        }
      });

      // Calculate modularity gain for each move
      let bestCluster = currentCluster;
      let bestGain = 0;

      for (const targetCluster of neighborClusters) {
        const gain = calculateModularityGain(
          nodeId,
          currentCluster,
          targetCluster,
          adjacency,
          degrees,
          clusters,
          nodeToCluster,
          m2
        );

        if (gain > bestGain) {
          bestGain = gain;
          bestCluster = targetCluster;
        }
      }

      // Move node to best cluster
      if (bestCluster !== currentCluster && bestGain > 1e-6) {
        clusters.get(currentCluster)?.delete(nodeId);
        
        // Remove empty cluster
        if (clusters.get(currentCluster)?.size === 0) {
          clusters.delete(currentCluster);
        }

        if (!clusters.has(bestCluster)) {
          clusters.set(bestCluster, new Set());
        }
        clusters.get(bestCluster)?.add(nodeId);
        nodeToCluster.set(nodeId, bestCluster);
        
        improved = true;
      }
    }
  }

  // Calculate final modularity
  const modularity = calculateModularity(
    clusters,
    adjacency,
    degrees,
    totalEdges
  );

  const duration = performance.now() - startTime;
  console.log(`[Community Detection] Completed in ${duration.toFixed(2)}ms`);
  console.log(`[Community Detection] Clusters: ${clusters.size}, Modularity: ${modularity.toFixed(4)}`);

  return { clusters, nodeToCluster, modularity };
}

/**
 * Calculate modularity gain from moving a node between clusters
 */
function calculateModularityGain(
  nodeId: string,
  fromCluster: number,
  toCluster: number,
  adjacency: Map<string, Set<string>>,
  degrees: Map<string, number>,
  clusters: Map<number, Set<string>>,
  nodeToCluster: Map<string, number>,
  m2: number
): number {
  const neighbors = adjacency.get(nodeId) || new Set();
  const nodeDegree = degrees.get(nodeId) || 0;

  // Count edges to target cluster
  let edgesToTarget = 0;
  neighbors.forEach(neighborId => {
    if (nodeToCluster.get(neighborId) === toCluster) {
      edgesToTarget++;
    }
  });

  // Count edges from source cluster
  let edgesFromSource = 0;
  neighbors.forEach(neighborId => {
    if (nodeToCluster.get(neighborId) === fromCluster) {
      edgesFromSource++;
    }
  });

  // Degree sum of target cluster
  const targetClusterNodes = clusters.get(toCluster) || new Set();
  let targetDegreeSum = 0;
  targetClusterNodes.forEach(id => {
    targetDegreeSum += degrees.get(id) || 0;
  });

  // Degree sum of source cluster
  const sourceClusterNodes = clusters.get(fromCluster) || new Set();
  let sourceDegreeSum = 0;
  sourceClusterNodes.forEach(id => {
    sourceDegreeSum += degrees.get(id) || 0;
  });

  // Modularity gain formula
  const gain =
    (edgesToTarget - edgesFromSource) / m2 -
    (nodeDegree * (targetDegreeSum - sourceDegreeSum + nodeDegree)) / (m2 * m2);

  return gain;
}

/**
 * Calculate overall modularity of the clustering
 */
function calculateModularity(
  clusters: Map<number, Set<string>>,
  adjacency: Map<string, Set<string>>,
  degrees: Map<string, number>,
  totalEdges: number
): number {
  if (totalEdges === 0) return 0;

  const m2 = 2 * totalEdges;
  let modularity = 0;

  clusters.forEach(clusterNodes => {
    let internalEdges = 0;
    let degreeSum = 0;

    clusterNodes.forEach(nodeId => {
      degreeSum += degrees.get(nodeId) || 0;
      
      const neighbors = adjacency.get(nodeId) || new Set();
      neighbors.forEach(neighborId => {
        if (clusterNodes.has(neighborId)) {
          internalEdges++;
        }
      });
    });

    // Each edge counted twice
    internalEdges /= 2;
    
    // Q = (e_c / m) - (d_c / 2m)^2
    modularity += internalEdges / totalEdges - Math.pow(degreeSum / m2, 2);
  });

  return modularity;
}
