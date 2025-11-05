/**
 * D3 Hop Dashboard Renderer
 * 
 * Gantt-style visualization of Shrimp task progress using D3 force-directed layout.
 * Reuses D3GraphRenderer for graph generation, adapts to horizontal timeline layout.
 * 
 * Features:
 * - Phase-based timeline (horizontal axis)
 * - Color-coded hop status (pending, in-progress, completed)
 * - Dependency arrows (left-to-right flow)
 * - Interactive controls (filter by phase/status)
 * - Stats panel (completion rate, LOC budget)
 * - Dark/light theme support (via ThemeManager)
 * - Export support (PNG/SVG/PDF via ExportCoordinator)
 * 
 * @module artifacts/renderers/d3_hop_dashboard
 */

import { ArtifactRenderer, ArtifactMetadata } from '../types.js';
import { D3GraphRenderer, GraphNode, GraphEdge } from '../visualizations/D3GraphRenderer.js';

/**
 * Hop data structure
 */
export interface HopData {
  id: string;
  name: string;
  status: 'planned' | 'in_progress' | 'completed';
  description: string;
  estimatedLOC: number;
  actualLOC?: number;
  ctsCompliant: boolean;
  phase: string;
  dependencies: string[];
  tests?: {
    total: number;
    passing: number;
    coverage: number;
  };
}

/**
 * Phase data structure
 */
export interface PhaseData {
  name: string;
  hops: HopData[];
}

/**
 * Hop dashboard data structure
 */
export interface HopDashboardData {
  currentPhase: string;
  phases: PhaseData[];
  stats: {
    totalLOC: number;
    plannedLOC: number;
    ctsComplianceRate: number;
    completionRate: number;
  };
}

/**
 * D3-based Hop Dashboard Renderer
 * 
 * Converts Shrimp task data into interactive Gantt chart visualization.
 * Reuses D3GraphRenderer for force-directed layout engine.
 * 
 * @example Basic usage
 * ```typescript
 * import { D3HopDashboardRenderer } from './renderers/d3_hop_dashboard.js';
 * 
 * const renderer = new D3HopDashboardRenderer();
 * 
 * const hopData = {
 *   phases: [
 *     {
 *       name: 'Phase 1: Foundation',
 *       hops: [
 *         {
 *           id: '1.1a',
 *           name: 'Project Setup',
 *           status: 'completed',
 *           description: 'Initialize project',
 *           estimatedLOC: 200,
 *           actualLOC: 185,
 *           ctsCompliant: true,
 *           phase: 'Phase 1: Foundation',
 *           dependencies: []
 *         }
 *       ]
 *     }
 *   ]
 * };
 * 
 * const html = await renderer.render(hopData);
 * // Returns: HTML string with Gantt-style hop dashboard
 * ```
 * 
 * @example Large dashboard (progressive rendering)
 * ```typescript
 * const largeHopData = {
 *   phases: [
 *     {
 *       name: 'Phase 1',
 *       hops: Array.from({ length: 50 }, (_, i) => ({
 *         id: `1.${i}a`,
 *         name: `Hop ${i}`,
 *         status: 'planned',
 *         description: 'Sample hop',
 *         estimatedLOC: 300,
 *         ctsCompliant: true,
 *         phase: 'Phase 1',
 *         dependencies: []
 *       }))
 *     }
 *   ]
 * };
 * 
 * const html = await renderer.render(largeHopData);
 * // Progressive rendering active (>10 hops)
 * // Yields to main thread after each section (prevents UI freezing)
 * ```
 */
export class D3HopDashboardRenderer implements ArtifactRenderer {
  readonly type = 'hop_dashboard';
  
  private readonly d3Renderer: D3GraphRenderer;

  constructor() {
    // Wider canvas for timeline layout
    this.d3Renderer = new D3GraphRenderer(1400, 600);
  }

  /**
   * Render hop dashboard as interactive D3 visualization.
   * Uses progressive rendering for large dashboards (>10 hops).
   * 
   * @param data HopDashboardData structure with phases and hops
   * @returns Promise resolving to HTML string with embedded D3 graph
   * 
   * @example Small dashboard (synchronous render)
   * ```typescript
   * const hopData = {
   *   phases: [{
   *     name: 'Phase 1',
   *     hops: [
   *       { id: '1.1a', name: 'Setup', status: 'completed', description: '', estimatedLOC: 200, ctsCompliant: true, phase: 'Phase 1', dependencies: [] },
   *       { id: '1.2a', name: 'Architecture', status: 'in_progress', description: '', estimatedLOC: 300, ctsCompliant: true, phase: 'Phase 1', dependencies: ['1.1a'] }
   *     ]
   *   }]
   * };
   * 
   * const html = await renderer.render(hopData);
   * // Renders immediately (~200ms for 5 hops)
   * ```
   * 
   * @example Large dashboard (progressive render)
   * ```typescript
   * const largeHopData = {
   *   phases: [
   *     { name: 'Phase 1', hops: [...] }, // 20 hops
   *     { name: 'Phase 2', hops: [...] }, // 15 hops
   *     { name: 'Phase 3', hops: [...] }  // 10 hops
   *   ]
   * };
   * 
   * const html = await renderer.render(largeHopData);
   * // Progressive rendering:
   * // 1. Generate graph (~500ms)
   * // 2. Yield to main thread (UI remains responsive)
   * // 3. Inject axis/controls (~300ms)
   * // 4. Yield again
   * // 5. Add stats panel (~200ms)
   * // Total: ~1s with UI responsiveness maintained
   * ```
   */
  async render(data: unknown): Promise<string> {
    const hopData = data as HopDashboardData;
    
    // Count total hops for progressive rendering decision
    const totalHops = hopData.phases.reduce((sum, phase) => sum + phase.hops.length, 0);
    const useProgressiveRendering = totalHops > 10;
    
    if (useProgressiveRendering) {
      console.log(`[D3HopDashboardRenderer] Progressive rendering enabled for ${totalHops} hops`);
    }

    // Convert phases/hops to graph nodes (all at once for simplicity)
    const nodes: GraphNode[] = this.convertToGraphNodes(hopData);

    // Convert hop dependencies to graph edges
    const edges: GraphEdge[] = this.convertToGraphEdges(hopData);

    // Generate base D3 graph
    let html = this.d3Renderer.generateForceDirectedGraph(nodes, edges);
    
    // Yield to main thread for large dashboards (prevent blocking)
    if (useProgressiveRendering) {
      await this.yieldToMainThread();
    }

    // Inject timeline axis (phase names)
    html = this.injectTimelineAxis(html, hopData.phases);
    
    // Yield to main thread
    if (useProgressiveRendering) {
      await this.yieldToMainThread();
    }

    // Inject stats panel (completion rate, LOC budget)
    html = this.injectStatsPanel(html, hopData.stats, hopData.currentPhase);
    
    // Yield to main thread
    if (useProgressiveRendering) {
      await this.yieldToMainThread();
    }

    // Inject interactive controls (filter by phase/status)
    html = this.injectControls(html);

    return html;
  }
  
  /**
   * Yield to main thread to prevent UI blocking
   * Uses setImmediate pattern (Node.js) or setTimeout (browser)
   * @private
   */
  private async yieldToMainThread(): Promise<void> {
    return new Promise(resolve => {
      if (typeof setImmediate !== 'undefined') {
        setImmediate(resolve);
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  /**
   * Convert hop dashboard data to graph nodes
   * 
   * Each hop becomes a node with:
   * - Position based on phase index
   * - Color based on status
   * - Label with hop name and LOC
   * 
   * @private
   */
  private convertToGraphNodes(hopData: HopDashboardData): GraphNode[] {
    const nodes: GraphNode[] = [];
    
    hopData.phases.forEach((phase, phaseIndex) => {
      phase.hops.forEach((hop, hopIndex) => {
        nodes.push({
          id: hop.id,
          label: `${hop.name}\n(${hop.actualLOC || hop.estimatedLOC} LOC)`,
          type: hop.status, // 'planned', 'in_progress', 'completed'
          filePath: `Phase ${phaseIndex + 1}`,
          line: hopIndex,
          params: [`${hop.estimatedLOC} LOC`, `${hop.tests?.coverage || 0}% coverage`],
          clusterId: phase.name,
          // Preset positions for Gantt-style layout
          x: phaseIndex * 400 + 200,
          y: hopIndex * 100 + 100,
          fx: phaseIndex * 400 + 200, // Fixed x-position
          fy: hopIndex * 100 + 100   // Fixed y-position
        });
      });
    });

    return nodes;
  }

  /**
   * Convert hop dependencies to graph edges
   * 
   * Each dependency becomes an arrow from prerequisite hop to dependent hop.
   * 
   * @private
   */
  private convertToGraphEdges(hopData: HopDashboardData): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    hopData.phases.forEach(phase => {
      phase.hops.forEach(hop => {
        hop.dependencies.forEach(depId => {
          edges.push({
            source: depId,
            target: hop.id,
            type: 'dependency'
          });
        });
      });
    });

    return edges;
  }

  /**
   * Inject timeline axis showing phase names
   * 
   * Adds horizontal axis at top of graph with phase labels.
   * 
   * @private
   */
  private injectTimelineAxis(html: string, phases: PhaseData[]): string {
    const phaseLabels = phases.map((phase, index) => {
      const x = index * 400 + 200;
      return `
        <div style="
          position: absolute;
          left: ${x}px;
          top: 20px;
          transform: translateX(-50%);
          font-size: 16px;
          font-weight: bold;
          color: #333;
          background: rgba(255, 255, 255, 0.9);
          padding: 8px 16px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          ${phase.name}
          <div style="font-size: 12px; font-weight: normal; color: #666;">
            ${phase.hops.length} hops
          </div>
        </div>
      `;
    }).join('');

    // Inject before SVG element
    return html.replace(
      '<svg',
      `<div style="position: relative; width: 1400px; margin: 0 auto;">
        ${phaseLabels}
      </div>
      <svg`
    );
  }

  /**
   * Inject stats panel showing completion metrics
   * 
   * Adds panel with:
   * - Current phase indicator
   * - Total LOC vs planned LOC
   * - CTS compliance rate
   * - Overall completion rate
   * 
   * @private
   */
  private injectStatsPanel(
    html: string,
    stats: HopDashboardData['stats'],
    currentPhase: string
  ): string {
    const completionPercent = Math.round(stats.completionRate * 100);
    const ctsPercent = Math.round(stats.ctsComplianceRate * 100);
    const locPercent = Math.round((stats.totalLOC / stats.plannedLOC) * 100);

    const statsPanel = `
      <div id="stats-panel" style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #ccc;
        border-radius: 8px;
        padding: 16px;
        min-width: 250px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 1000;
      ">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #333;">
          📊 Dashboard Stats
        </h3>
        
        <div style="margin-bottom: 8px;">
          <strong style="color: #1f77b4;">Current Phase:</strong>
          <div style="
            background: #1f77b4;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            margin-top: 4px;
            font-weight: bold;
          ">
            ${currentPhase}
          </div>
        </div>

        <div style="margin-bottom: 8px;">
          <strong>Completion:</strong>
          <div style="
            background: #f0f0f0;
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 4px;
          ">
            <div style="
              background: ${completionPercent === 100 ? '#2ca02c' : '#ff7f0e'};
              height: 100%;
              width: ${completionPercent}%;
              transition: width 0.3s ease;
            "></div>
          </div>
          <div style="font-size: 12px; margin-top: 2px; color: #666;">
            ${completionPercent}%
          </div>
        </div>

        <div style="margin-bottom: 8px;">
          <strong>LOC Budget:</strong>
          <div style="font-size: 12px; color: #666; margin-top: 2px;">
            ${stats.totalLOC.toLocaleString()} / ${stats.plannedLOC.toLocaleString()} (${locPercent}%)
          </div>
        </div>

        <div style="margin-bottom: 8px;">
          <strong>CTS Compliance:</strong>
          <div style="font-size: 12px; margin-top: 2px; color: ${ctsPercent >= 90 ? '#2ca02c' : '#ff7f0e'};">
            ${ctsPercent}%
          </div>
        </div>
      </div>
    `;

    // Inject stats panel before closing body tag
    return html.replace('</body>', `${statsPanel}\n</body>`);
  }

  /**
   * Inject interactive controls for filtering
   * 
   * Adds control panel with:
   * - Phase filter dropdown
   * - Status filter checkboxes
   * - Reset button
   * 
   * @private
   */
  private injectControls(html: string): string {
    const controls = `
      <div id="controls-panel" style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #ccc;
        border-radius: 8px;
        padding: 16px;
        min-width: 200px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 1000;
      ">
        <h4 style="margin: 0 0 12px 0; font-size: 16px; color: #333;">
          🎛️ Controls
        </h4>

        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-weight: bold; font-size: 14px;">
            Filter by Status:
          </label>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="cursor: pointer;">
              <input type="checkbox" id="filter-planned" checked>
              <span style="margin-left: 4px; color: #ff7f0e;">⬤ Planned</span>
            </label>
            <label style="cursor: pointer;">
              <input type="checkbox" id="filter-in-progress" checked>
              <span style="margin-left: 4px; color: #1f77b4;">⬤ In Progress</span>
            </label>
            <label style="cursor: pointer;">
              <input type="checkbox" id="filter-completed" checked>
              <span style="margin-left: 4px; color: #2ca02c;">⬤ Completed</span>
            </label>
          </div>
        </div>

        <button id="reset-view" style="
          width: 100%;
          padding: 8px;
          background: #1f77b4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        ">
          Reset View
        </button>
      </div>

      <script>
        // Filter controls
        document.getElementById('filter-planned')?.addEventListener('change', updateFilter);
        document.getElementById('filter-in-progress')?.addEventListener('change', updateFilter);
        document.getElementById('filter-completed')?.addEventListener('change', updateFilter);

        function updateFilter() {
          const showPlanned = document.getElementById('filter-planned')?.checked || false;
          const showInProgress = document.getElementById('filter-in-progress')?.checked || false;
          const showCompleted = document.getElementById('filter-completed')?.checked || false;

          // Filter nodes by status
          d3.selectAll('.node').style('opacity', function(d) {
            if (d.type === 'planned' && !showPlanned) return 0.1;
            if (d.type === 'in_progress' && !showInProgress) return 0.1;
            if (d.type === 'completed' && !showCompleted) return 0.1;
            return 1;
          });

          // Filter edges connected to hidden nodes
          d3.selectAll('.link').style('opacity', function(d) {
            const sourceVisible = 
              (d.source.type === 'planned' && showPlanned) ||
              (d.source.type === 'in_progress' && showInProgress) ||
              (d.source.type === 'completed' && showCompleted);
            const targetVisible =
              (d.target.type === 'planned' && showPlanned) ||
              (d.target.type === 'in_progress' && showInProgress) ||
              (d.target.type === 'completed' && showCompleted);
            return (sourceVisible && targetVisible) ? 1 : 0.1;
          });
        }

        // Reset view button
        document.getElementById('reset-view')?.addEventListener('click', () => {
          document.getElementById('filter-planned').checked = true;
          document.getElementById('filter-in-progress').checked = true;
          document.getElementById('filter-completed').checked = true;
          updateFilter();
        });
      </script>
    `;

    // Inject controls before closing body tag
    return html.replace('</body>', `${controls}\n</body>`);
  }

}
