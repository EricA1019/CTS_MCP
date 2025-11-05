/**
 * Interactive Signal Map Renderer
 * 
 * D3.js force-directed graph with interactive controls.
 * Replaces PlaceholderSignalMapRenderer for production use.
 * 
 * @module artifacts/renderers/interactive_signal_map
 */

import { ArtifactRenderer, type ArtifactMetadata } from '../types.js';
import { SignalDefinition } from '../parsers/gdscript_parser.js';
import { D3GraphRenderer, type GraphNode, type GraphEdge } from '../visualizations/D3GraphRenderer.js';
import { ClusterVisualizer, type Cluster } from '../visualizations/ClusterVisualizer.js';
import { SignalRelationshipParser } from '../../parsers/signal_relationship_parser.js';

/**
 * Signal map input data
 */
export interface SignalMapData {
  signals: SignalDefinition[];
  projectPath: string;
  metadata?: {
    eventBusCount: number;
    signalBusCount: number;
  };
  clusters?: Cluster[]; // Optional cluster data from hierarchical clustering
}

/**
 * Interactive signal map renderer using D3.js
 * 
 * Features:
 * - Force-directed graph layout
 * - Zoom and pan controls
 * - Drag-to-reposition nodes
 * - Cluster visualization (if cluster data provided)
 * - Real-time filtering (Phase 2 integration)
 * - Signal relationship detection (emit/connect tracking)
 * 
 * @example Basic usage
 * ```typescript
 * import { InteractiveSignalMapRenderer } from './renderers/interactive_signal_map.js';
 * 
 * const renderer = new InteractiveSignalMapRenderer();
 * 
 * const signalMapData = {
 *   signals: [
 *     { name: 'player_health_changed', source: 'EventBus', params: ['new_health', 'old_health'], filePath: 'autoload/EventBus.gd', line: 5 },
 *     { name: 'enemy_spawned', source: 'EventBus', params: ['enemy_type', 'position'], filePath: 'autoload/EventBus.gd', line: 6 }
 *   ],
 *   projectPath: '/path/to/godot/project',
 *   metadata: {
 *     eventBusCount: 2,
 *     signalBusCount: 0
 *   }
 * };
 * 
 * const html = await renderer.render(signalMapData, { title: 'Combat Signals', description: 'Core gameplay signals' });
 * // Returns: HTML with D3 force-directed graph, automatic relationship detection
 * ```
 * 
 * @example With clustering
 * ```typescript
 * const signalMapDataWithClusters = {
 *   signals: [...], // 100+ signals
 *   projectPath: '/path/to/project',
 *   clusters: [
 *     { id: 'combat', label: 'Combat Signals', signalIds: ['player_attack', 'enemy_hit', 'damage_dealt'] },
 *     { id: 'ui', label: 'UI Signals', signalIds: ['health_bar_updated', 'menu_opened'] }
 *   ]
 * };
 * 
 * const html = await renderer.render(signalMapDataWithClusters);
 * // Renders graph with cluster boundaries (convex hulls) and labels
 * ```
 */
export class InteractiveSignalMapRenderer implements ArtifactRenderer {
  readonly type = 'signal_map_interactive';

  private readonly d3Renderer: D3GraphRenderer;
  private readonly relationshipParser: SignalRelationshipParser;

  constructor() {
    this.d3Renderer = new D3GraphRenderer(1200, 800);
    this.relationshipParser = new SignalRelationshipParser();
  }

  async render(data: unknown, metadata?: ArtifactMetadata): Promise<string> {
    const mapData = data as SignalMapData;
    const signals = mapData.signals || [];

    // Convert signals to graph nodes
    const nodes: GraphNode[] = signals.map((sig, index) => ({
      id: sig.name,
      label: sig.name,
      type: sig.source, // "EventBus" or "SignalBus"
      filePath: sig.filePath,
      line: sig.line,
      params: sig.params,
      index
    }));

    // Phase 3: Extract real connections from GDScript analysis
    const edges: GraphEdge[] = await this.generateRealEdges(mapData.projectPath, nodes);

    // Generate base D3 graph
    let html = this.d3Renderer.generateForceDirectedGraph(nodes, edges);

    // Add cluster boundaries if cluster data provided
    if (mapData.clusters && mapData.clusters.length > 0) {
      html = this.injectClusterVisualization(html, mapData.clusters, nodes);
    }

    // Add metadata header
    html = this.addMetadataHeader(html, mapData, metadata);

    return html;
  }

  /**
   * Generate real signal connection edges from GDScript analysis
   * Replaces Phase 3 placeholder sample edges with actual emit/connect relationships
   */
  private async generateRealEdges(projectPath: string, nodes: GraphNode[]): Promise<GraphEdge[]> {
    try {
      // Parse signal connections using relationship parser
      const connections = await this.relationshipParser.parseConnections(projectPath);

      // Convert SignalConnection[] to GraphEdge[] format
      const edges: GraphEdge[] = connections.map(conn => ({
        source: conn.emitter,
        target: conn.listener,
        type: conn.type as 'emit' | 'connect'
      }));

      return edges;
    } catch (error) {
      console.warn('Failed to parse signal connections, falling back to sample edges:', error);
      // Fallback to sample edges if parser fails
      return this.generateSampleEdges(nodes);
    }
  }

  /**
   * Generate sample edges for testing (fallback only)
   * Creates sequential connections between nodes for visualization testing
   */
  private generateSampleEdges(nodes: GraphNode[]): GraphEdge[] {
    const edges: GraphEdge[] = [];

    // Create a few sample connections
    for (let i = 0; i < Math.min(nodes.length - 1, 10); i++) {
      edges.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: 'emit'
      });
    }

    return edges;
  }

  /**
   * Inject cluster visualization into D3 graph HTML
   */
  private injectClusterVisualization(
    html: string,
    clusters: Cluster[],
    nodes: GraphNode[]
  ): string {
    const visualizer = new ClusterVisualizer(clusters);

    // Generate cluster boundary SVG
    const clusterBoundaries = visualizer.generateClusterBoundaries(clusters);

    // Generate color mapping for nodes
    const nodeColorMap = visualizer.colorCodeNodes(nodes, clusters);

    // Inject cluster boundaries before nodes
    html = html.replace(
      '// Render nodes',
      `// Render cluster boundaries
      g.append('g')
        .attr('class', 'cluster-boundaries')
        .html(\`${clusterBoundaries}\`);
      
      // Render nodes`
    );

    // Update node colors based on cluster
    let colorUpdateScript = '\n    // Update node colors based on clusters\n';
    nodeColorMap.forEach((color, nodeId) => {
      colorUpdateScript += `    node.filter(d => d.id === '${nodeId}').attr('fill', '${color}');\n`;
    });

    html = html.replace(
      'window.restartSimulation',
      colorUpdateScript + '\n    window.restartSimulation'
    );

    return html;
  }

  /**
   * Add metadata header to visualization
   */
  private addMetadataHeader(
    html: string,
    mapData: SignalMapData,
    metadata?: ArtifactMetadata
  ): string {
    const title = metadata?.title || 'Signal Map';
    const description = metadata?.description || `${mapData.signals.length} signals`;

    const header = `
  <div class="metadata-header" style="position: absolute; top: 100px; left: 20px; background: rgba(30, 30, 30, 0.9); border: 1px solid #444; border-radius: 8px; padding: 15px; z-index: 1000; max-width: 300px;">
    <h2 style="margin: 0 0 10px 0; color: #007acc; font-size: 16px;">${title}</h2>
    <p style="margin: 0; font-size: 12px;">${description}</p>
    ${mapData.metadata ? `
    <div style="margin-top: 10px; font-size: 11px; color: #999;">
      <div>EventBus: ${mapData.metadata.eventBusCount}</div>
      <div>SignalBus: ${mapData.metadata.signalBusCount}</div>
    </div>
    ` : ''}
  </div>
`;

    return html.replace('<div class="controls">', header + '\n  <div class="controls">');
  }
}
