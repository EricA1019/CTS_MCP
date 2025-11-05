/**
 * Signal Map Filters Component
 * 
 * Client-side filtering logic for signal graph visualizations.
 * Filters nodes by type, cluster, connection count, and other attributes.
 * 
 * @module artifacts/controls/SignalMapFilters
 */

import type { GraphNode } from '../clustering/community_detection.js';

/**
 * Filter state configuration
 */
export interface FilterState {
  /** Node types to include (e.g., ['signal', 'connection', 'orphan']) */
  nodeTypes: string[];
  /** Cluster IDs to include (empty = all clusters) */
  clusters: number[];
  /** Minimum connection count (0 = no filter) */
  minConnections: number;
  /** Maximum connection count (Infinity = no filter) */
  maxConnections: number;
  /** Include orphan nodes (nodes with no connections) */
  includeOrphans: boolean;
}

/**
 * Default filter state (show all)
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  nodeTypes: ['signal', 'connection', 'orphan'],
  clusters: [],
  minConnections: 0,
  maxConnections: Infinity,
  includeOrphans: true,
};

/**
 * Component for filtering signal graph nodes
 */
export class SignalMapFilters {
  /**
   * Apply filters to graph nodes
   * 
   * @param nodes Array of graph nodes to filter
   * @param state Filter state configuration
   * @returns Filtered array of nodes
   */
  applyFilters(nodes: GraphNode[], state: FilterState): GraphNode[] {
    return nodes.filter(node => {
      // Filter by node type
      if (state.nodeTypes.length > 0) {
        const nodeType = node.type as string || 'unknown';
        if (!state.nodeTypes.includes(nodeType)) {
          return false;
        }
      }

      // Filter by cluster (if cluster filter active)
      if (state.clusters.length > 0) {
        const nodeCluster = node.cluster as number;
        if (nodeCluster === undefined || !state.clusters.includes(nodeCluster)) {
          return false;
        }
      }

      // Get connection count (default to 0 if missing)
      const connectionCount = (node.connections as number) ?? 0;
      
      // Check orphan status first
      if (connectionCount === 0) {
        return state.includeOrphans;
      }

      // Check connection range (only for non-orphans)
      if (connectionCount < state.minConnections || connectionCount > state.maxConnections) {
        return false;
      }

      return true;
    });
  }

  /**
   * Generate filter HTML for signal map
   * 
   * @param availableTypes Available node types in graph
   * @param clusters Available cluster IDs
   * @returns HTML string for filter panel
   */
  generateFilterHTML(availableTypes: string[], clusters: number[]): string {
    const typeCheckboxes = availableTypes
      .map(type => `
        <label>
          <input type="checkbox" class="type-filter" value="${type}" checked>
          ${this.formatTypeName(type)}
        </label>
      `)
      .join('');

    const clusterOptions = clusters.length > 0
      ? `
        <div class="filter-group">
          <label>Clusters:</label>
          <select id="cluster-filter" multiple size="4">
            <option value="" selected>All Clusters</option>
            ${clusters.map(id => `<option value="${id}">Cluster ${id}</option>`).join('')}
          </select>
        </div>
      `
      : '';

    return `
      <div class="signal-map-filters">
        <div class="filter-group">
          <label>Node Types:</label>
          <div class="type-filters">
            ${typeCheckboxes}
          </div>
        </div>
        
        ${clusterOptions}
        
        <div class="filter-group">
          <label>Connection Count:</label>
          <div class="connection-range">
            <input type="number" id="min-connections" min="0" value="0" placeholder="Min">
            <span>to</span>
            <input type="number" id="max-connections" min="0" placeholder="Max (∞)">
          </div>
        </div>
        
        <div class="filter-group">
          <label>
            <input type="checkbox" id="include-orphans" checked>
            Include Orphans (no connections)
          </label>
        </div>
        
        <button onclick="applySignalMapFilters()" class="apply-btn">Apply Filters</button>
        <button onclick="resetSignalMapFilters()" class="reset-btn">Reset</button>
      </div>
    `;
  }

  /**
   * Format node type name for display
   * 
   * @param type Raw type string
   * @returns Formatted display name
   */
  private formatTypeName(type: string): string {
    const typeNames: Record<string, string> = {
      signal: 'Signals',
      connection: 'Connections',
      orphan: 'Orphans',
      emitter: 'Emitters',
      receiver: 'Receivers',
    };
    return typeNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Generate JavaScript code to read filter state from DOM
   * 
   * Returns client-side JavaScript that reads current filter values.
   * Used in artifact HTML <script> tags.
   * 
   * @returns JavaScript code string
   */
  generateFilterStateReader(): string {
    return `
      function getFilterStateFromDOM() {
        const typeCheckboxes = document.querySelectorAll('.type-filter:checked');
        const nodeTypes = Array.from(typeCheckboxes).map(cb => cb.value);

        const clusterSelect = document.getElementById('cluster-filter');
        const clusters = clusterSelect
          ? Array.from(clusterSelect.selectedOptions)
              .map(opt => parseInt(opt.value))
              .filter(id => !isNaN(id))
          : [];

        const minConnInput = document.getElementById('min-connections');
        const maxConnInput = document.getElementById('max-connections');

        const minConnections = minConnInput ? parseInt(minConnInput.value) || 0 : 0;
        const maxConnections = maxConnInput && maxConnInput.value
          ? parseInt(maxConnInput.value)
          : Infinity;

        const orphanCheckbox = document.getElementById('include-orphans');
        const includeOrphans = orphanCheckbox ? orphanCheckbox.checked : true;

        return {
          nodeTypes,
          clusters,
          minConnections,
          maxConnections,
          includeOrphans,
        };
      }
    `;
  }
}
