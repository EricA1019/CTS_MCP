/**
 * Interactive Controls Component
 * 
 * Generates HTML control panels for filtering, searching, and zooming artifacts.
 * Used by MCPUIAdapter to add interactive features to signal maps and hop dashboards.
 * 
 * @module artifacts/controls/InteractiveControls
 */

/**
 * Component for generating interactive artifact controls (filters, search, zoom).
 * 
 * Phase 2: Foundation for interactive MCP-UI artifacts.
 */
export class InteractiveControls {
  /**
   * Generate filter panel HTML for artifact type
   * 
   * @param artifactType Type of artifact (signal_map or hop_dashboard)
   * @returns HTML string for filter panel
   */
  generateFilterPanel(artifactType: 'signal_map' | 'hop_dashboard'): string {
    if (artifactType === 'signal_map') {
      return this.generateSignalMapFilterPanel();
    } else {
      return this.generateHopDashboardFilterPanel();
    }
  }

  /**
   * Generate filter panel specific to signal maps
   * 
   * @returns HTML string for signal map filter panel
   */
  private generateSignalMapFilterPanel(): string {
    return `
      <div class="filter-panel" id="signal-map-filters">
        <h3>Filters</h3>
        <div class="filter-group">
          <label>Node Types:</label>
          <div class="filter-checkboxes">
            <label><input type="checkbox" value="signal" checked> Signals</label>
            <label><input type="checkbox" value="connection" checked> Connections</label>
            <label><input type="checkbox" value="orphan" checked> Orphans</label>
          </div>
        </div>
        <div class="filter-group">
          <label>Min Connections:</label>
          <input type="number" id="min-connections" min="0" value="0" style="width: 60px;">
        </div>
        <button onclick="applyFilters()" class="apply-filters-btn">Apply Filters</button>
      </div>
    `;
  }

  /**
   * Generate filter panel specific to hop dashboards
   * 
   * @returns HTML string for hop dashboard filter panel
   */
  private generateHopDashboardFilterPanel(): string {
    return `
      <div class="filter-panel" id="hop-dashboard-filters">
        <h3>Filters</h3>
        <div class="filter-group">
          <label>Status:</label>
          <div class="filter-checkboxes">
            <label><input type="checkbox" value="pending" checked> Pending</label>
            <label><input type="checkbox" value="in_progress" checked> In Progress</label>
            <label><input type="checkbox" value="completed" checked> Completed</label>
          </div>
        </div>
        <button onclick="applyFilters()" class="apply-filters-btn">Apply Filters</button>
      </div>
    `;
  }

  /**
   * Generate search box HTML
   * 
   * @returns HTML string for search box
   */
  generateSearchBox(): string {
    return `
      <div class="search-box">
        <input 
          type="search" 
          id="artifact-search" 
          placeholder="Search nodes..."
          oninput="handleSearch(this.value)"
        />
        <span id="search-results-count"></span>
      </div>
    `;
  }

  /**
   * Generate zoom controls HTML
   * 
   * @returns HTML string for zoom controls
   */
  generateZoomControls(): string {
    return `
      <div class="zoom-controls">
        <button onclick="zoomIn()" title="Zoom In">+</button>
        <button onclick="zoomReset()" title="Reset Zoom">⊙</button>
        <button onclick="zoomOut()" title="Zoom Out">−</button>
      </div>
    `;
  }

  /**
   * Attach event handlers JavaScript
   * 
   * Generates JavaScript code to wire up control events.
   * 
   * @returns JavaScript string for event handlers
   */
  attachEventHandlers(): string {
    return `
      <script>
        // Filter state
        let currentFilters = {
          nodeTypes: ['signal', 'connection', 'orphan'],
          minConnections: 0
        };

        // Apply filters to graph
        function applyFilters() {
          const panel = document.getElementById('signal-map-filters') || 
                       document.getElementById('hop-dashboard-filters');
          if (!panel) return;

          // Get checked node types
          const checkboxes = panel.querySelectorAll('input[type="checkbox"]:checked');
          currentFilters.nodeTypes = Array.from(checkboxes).map(cb => cb.value);

          // Get min connections (signal map only)
          const minConnInput = document.getElementById('min-connections');
          if (minConnInput) {
            currentFilters.minConnections = parseInt(minConnInput.value) || 0;
          }

          // Filter graph (implementation in visualization module)
          if (typeof filterGraph === 'function') {
            filterGraph(currentFilters);
          }
        }

        // Handle search input
        function handleSearch(query) {
          const resultsCount = document.getElementById('search-results-count');
          
          if (!query || query.trim() === '') {
            resultsCount.textContent = '';
            clearSearchHighlights();
            return;
          }

          // Search and highlight (implementation in visualization module)
          if (typeof searchAndHighlight === 'function') {
            const matchCount = searchAndHighlight(query);
            resultsCount.textContent = matchCount > 0 
              ? \`\${matchCount} match\${matchCount !== 1 ? 'es' : ''}\`
              : 'No matches';
          }
        }

        // Zoom controls
        let currentZoom = 1.0;
        const ZOOM_FACTOR = 1.2;
        const MIN_ZOOM = 0.5;
        const MAX_ZOOM = 5.0;

        function zoomIn() {
          currentZoom = Math.min(currentZoom * ZOOM_FACTOR, MAX_ZOOM);
          applyZoom();
        }

        function zoomOut() {
          currentZoom = Math.max(currentZoom / ZOOM_FACTOR, MIN_ZOOM);
          applyZoom();
        }

        function zoomReset() {
          currentZoom = 1.0;
          applyZoom();
        }

        function applyZoom() {
          const container = document.getElementById('artifact-container');
          if (container) {
            container.style.transform = \`scale(\${currentZoom})\`;
            container.style.transformOrigin = 'center center';
          }

          // Apply to D3 visualization if available
          if (typeof applyD3Zoom === 'function') {
            applyD3Zoom(currentZoom);
          }
        }

        // Clear search highlights
        function clearSearchHighlights() {
          document.querySelectorAll('mark.search-highlight').forEach(mark => {
            const text = mark.textContent;
            mark.replaceWith(document.createTextNode(text));
          });
        }
      </script>
    `;
  }
}
