/**
 * Cluster Visualizer
 * 
 * Generates cluster boundary visualizations and color-coded nodes.
 * Integrates with hierarchical clustering algorithm.
 * 
 * @module artifacts/visualizations/ClusterVisualizer
 */

import { scaleOrdinal } from 'd3-scale';
import type { GraphNode } from './D3GraphRenderer.js';

/**
 * Cluster representation
 */
export interface Cluster {
  id: string;
  label: string;
  nodeIds: string[];
  nodes: GraphNode[];
}

/**
 * Cluster visualization generator
 * 
 * Creates visual boundaries and color-coding for node clusters.
 * Uses convex hull algorithm for cluster boundaries.
 */
export class ClusterVisualizer {
  private readonly colorScale: (value: string) => string;

  constructor(clusters: Cluster[]) {
    // Generate color scale for clusters
    const clusterIds = clusters.map(c => c.id);
    const scale = scaleOrdinal<string, string>()
      .domain(clusterIds)
      .range([
        '#1f77b4', // blue
        '#ff7f0e', // orange
        '#2ca02c', // green
        '#d62728', // red
        '#9467bd', // purple
        '#8c564b', // brown
        '#e377c2', // pink
        '#7f7f7f', // gray
        '#bcbd22', // yellow-green
        '#17becf'  // cyan
      ]);
    
    // Wrap scale with type-safe function
    this.colorScale = (value: string) => scale(value) as string;
  }

  /**
   * Generate SVG paths for cluster boundaries
   * 
   * Uses convex hull algorithm to create boundary hulls around clustered nodes.
   * 
   * @param clusters Cluster data with node positions
   * @returns SVG path elements as HTML string
   */
  generateClusterBoundaries(clusters: Cluster[]): string {
    return clusters.map((cluster, idx) => {
      if (cluster.nodes.length < 3) {
        // Skip clusters with < 3 nodes (can't form hull)
        return '';
      }

      const hullPath = this.computeConvexHull(cluster.nodes);
      
      // Skip if hull couldn't be computed (not enough positioned nodes)
      if (!hullPath) {
        return '';
      }
      
      const color = this.colorScale(cluster.id);
      const rgb = this.hexToRgb(color);

      return `
        <path
          class="cluster-boundary"
          data-cluster-id="${cluster.id}"
          d="${hullPath}"
          fill="rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)"
          stroke="${color}"
          stroke-width="2"
          stroke-dasharray="5,5"
        />
      `.trim();
    }).filter(Boolean).join('\n');
  }

  /**
   * Color-code nodes based on cluster membership
   * 
   * @param nodes Graph nodes
   * @param clusters Cluster assignments
   * @returns Map of node ID → color
   */
  colorCodeNodes(nodes: GraphNode[], clusters: Cluster[]): Map<string, string> {
    const colorMap = new Map<string, string>();

    // Build cluster lookup
    const nodeToCluster = new Map<string, string>();
    clusters.forEach(cluster => {
      cluster.nodeIds.forEach(nodeId => {
        nodeToCluster.set(nodeId, cluster.id);
      });
    });

    // Assign colors
    nodes.forEach(node => {
      const clusterId = nodeToCluster.get(node.id);
      if (clusterId) {
        colorMap.set(node.id, this.colorScale(clusterId));
      } else {
        colorMap.set(node.id, '#999'); // Unclustered nodes
      }
    });

    return colorMap;
  }

  /**
   * Compute convex hull for cluster boundary
   * 
   * Implements Graham scan algorithm for convex hull.
   * Returns SVG path string.
   * 
   * @param nodes Nodes in cluster (must have x, y positions)
   * @returns SVG path string
   */
  private computeConvexHull(nodes: GraphNode[]): string {
    if (nodes.length < 3) {
      return '';
    }

    // Extract points
    const points = nodes
      .filter(n => n.x !== undefined && n.y !== undefined)
      .map(n => ({ x: n.x!, y: n.y! }));

    if (points.length < 3) {
      return '';
    }

    // Find lowest y-coordinate (break ties with lowest x)
    let pivot = points[0];
    for (let i = 1; i < points.length; i++) {
      if (points[i].y < pivot.y || (points[i].y === pivot.y && points[i].x < pivot.x)) {
        pivot = points[i];
      }
    }

    // Sort by polar angle with pivot
    const sorted = points
      .filter(p => p !== pivot)
      .sort((a, b) => {
        const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
        const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
        return angleA - angleB;
      });

    // Graham scan
    const hull: Array<{ x: number; y: number }> = [pivot, sorted[0], sorted[1]];

    for (let i = 2; i < sorted.length; i++) {
      while (hull.length > 1 && this.crossProduct(hull[hull.length - 2], hull[hull.length - 1], sorted[i]) <= 0) {
        hull.pop();
      }
      hull.push(sorted[i]);
    }

    // Add padding around hull
    const padding = 20;
    const paddedHull = this.expandHull(hull, padding);

    // Convert to SVG path
    if (paddedHull.length === 0) {
      return '';
    }

    const pathCommands = paddedHull.map((point, idx) => {
      return idx === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`;
    });
    pathCommands.push('Z'); // Close path

    return pathCommands.join(' ');
  }

  /**
   * Cross product for Graham scan
   */
  private crossProduct(
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  /**
   * Expand hull by padding amount
   */
  private expandHull(hull: Array<{ x: number; y: number }>, padding: number): Array<{ x: number; y: number }> {
    if (hull.length < 3) {
      return hull;
    }

    // Compute centroid
    const centroid = {
      x: hull.reduce((sum, p) => sum + p.x, 0) / hull.length,
      y: hull.reduce((sum, p) => sum + p.y, 0) / hull.length
    };

    // Expand each point away from centroid
    return hull.map(point => {
      const dx = point.x - centroid.x;
      const dy = point.y - centroid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) {
        return point;
      }

      const factor = (dist + padding) / dist;
      return {
        x: centroid.x + dx * factor,
        y: centroid.y + dy * factor
      };
    });
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 153, g: 153, b: 153 }; // Default gray
  }

  /**
   * Get cluster color
   */
  getClusterColor(clusterId: string): string {
    return this.colorScale(clusterId) || '#999';
  }
}
