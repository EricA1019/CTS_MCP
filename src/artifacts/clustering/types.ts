/**
 * Hierarchical Clustering Types
 * 
 * Type definitions for multi-level cluster hierarchy with semantic labeling.
 */

import type { ClusterResult } from './community_detection.js';

/**
 * Cluster with semantic label and metadata.
 */
export interface LabeledCluster {
  /** Cluster ID */
  id: number;
  /** Auto-generated semantic label (e.g., 'player_health_damage') */
  label: string;
  /** Signal names in this cluster */
  signals: Set<string>;
  /** TF-IDF scores for top terms */
  topTerms?: Array<{ term: string; score: number }>;
}

/**
 * Sub-cluster hierarchy result.
 */
export interface SubClusterResult {
  /** Parent cluster ID */
  parentId: number;
  /** Sub-clusters within this parent */
  clusters: Map<number, Set<string>>;
  /** Modularity score of sub-clustering */
  modularity: number;
}

/**
 * Complete hierarchical clustering result.
 */
export interface HierarchicalClusters {
  /** Top-level clusters with labels */
  topLevel: {
    clusters: Map<number, LabeledCluster>;
    modularity: number;
  };
  /** Sub-clusters (optional, depth > 1) */
  subClusters?: Map<number, SubClusterResult>;
  /** Metadata */
  metadata: {
    depth: number;
    totalSignals: number;
    topLevelCount: number;
    timestamp: number;
  };
}

/**
 * TF-IDF term with score.
 */
export interface TermScore {
  term: string;
  tf: number;        // Term frequency (within cluster)
  idf: number;       // Inverse document frequency (across all signals)
  tfidf: number;     // TF-IDF score
}

/**
 * Clustering statistics for monitoring.
 */
export interface ClusteringStats {
  durationMs: number;
  topLevelClusters: number;
  subClustersTotal: number;
  avgClusterSize: number;
  maxClusterSize: number;
  minClusterSize: number;
  avgModularity: number;
}
