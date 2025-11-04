/**
 * D3.js Signal Map Renderer
 * Force-directed graph visualization of EventBus/SignalBus connections
 */

import { ArtifactRenderer } from '../types.js';
import { SignalDefinition } from '../parsers/gdscript_parser.js';

export interface SignalMapData {
  signals: SignalDefinition[];
  projectPath: string;
  metadata?: {
    eventBusCount: number;
    signalBusCount: number;
  };
}

export class D3SignalMapRenderer implements ArtifactRenderer {
  readonly type = 'signal_map';

  async render(data: unknown): Promise<string> {
    const mapData = data as SignalMapData;
    const signals = mapData.signals || [];

    // Group signals by source (EventBus vs SignalBus)
    const nodes = signals.map((sig, index) => ({
      id: sig.name,
      label: sig.name,
      group: sig.source,
      filePath: sig.filePath,
      line: sig.line,
      params: sig.params,
      paramTypes: sig.paramTypes || {},
      index,
    }));

    // For Phase 1, no connections yet (Phase 2 will add real connections)
    const links: any[] = [];

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signal Map - D3.js Force-Directed Graph</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1e1e1e;
      color: #d4d4d4;
      overflow: hidden;
    }

    #graph-container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .node {
      cursor: pointer;
      stroke: #fff;
      stroke-width: 1.5px;
    }

    .node:hover {
      stroke: #ffa500;
      stroke-width: 3px;
    }

    .node-label {
      font-size: 10px;
      pointer-events: none;
      user-select: none;
      fill: #d4d4d4;
      text-shadow: 0 0 3px #000, 0 0 3px #000, 0 0 3px #000;
    }

    .link {
      stroke: #999;
      stroke-opacity: 0.6;
      stroke-width: 1.5px;
    }

    .tooltip {
      position: absolute;
      padding: 10px;
      background: #252526;
      border: 1px solid #007acc;
      border-radius: 4px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      max-width: 300px;
      z-index: 1000;
    }

    .tooltip.show {
      opacity: 1;
    }

    .tooltip h4 {
      margin: 0 0 5px 0;
      color: #007acc;
    }

    .tooltip p {
      margin: 3px 0;
      font-size: 12px;
    }

    .controls {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #252526;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #007acc;
      z-index: 100;
    }

    .controls h3 {
      margin: 0 0 10px 0;
      color: #007acc;
      font-size: 14px;
    }

    .controls p {
      margin: 5px 0;
      font-size: 12px;
    }

    .legend {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #252526;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #007acc;
      z-index: 100;
    }

    .legend h4 {
      margin: 0 0 10px 0;
      color: #007acc;
      font-size: 14px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      margin: 5px 0;
      font-size: 12px;
    }

    .legend-color {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      margin-right: 8px;
      border: 1px solid #fff;
    }
  </style>
</head>
<body>
  <div id="graph-container">
    <svg id="graph"></svg>
    
    <div class="controls">
      <h3>🗺️ Signal Map</h3>
      <p><strong>Total Signals:</strong> ${signals.length}</p>
      <p><strong>EventBus:</strong> ${mapData.metadata?.eventBusCount || 0}</p>
      <p><strong>SignalBus:</strong> ${mapData.metadata?.signalBusCount || 0}</p>
      <p style="margin-top: 10px; color: #858585; font-size: 11px;">
        Click nodes to view details<br>
        Drag nodes to rearrange<br>
        Scroll to zoom
      </p>
    </div>

    <div class="legend">
      <h4>Legend</h4>
      <div class="legend-item">
        <div class="legend-color" style="background: #1f77b4;"></div>
        <span>EventBus Signals</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #ff7f0e;"></div>
        <span>SignalBus Signals</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #2ca02c;"></div>
        <span>Component Signals</span>
      </div>
    </div>

    <div class="tooltip" id="tooltip"></div>
  </div>

  <script>
    // Data
    const nodes = ${JSON.stringify(nodes)};
    const links = ${JSON.stringify(links)};

    // Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(['EventBus', 'SignalBus', 'Component'])
      .range(['#1f77b4', '#ff7f0e', '#2ca02c']);

    // SVG setup
    const svg = d3.select('#graph');
    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link');

    // Nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g');

    node.append('circle')
      .attr('class', 'node')
      .attr('r', 8)
      .attr('fill', d => colorScale(d.group))
      .on('click', handleNodeClick)
      .on('mouseover', handleNodeMouseOver)
      .on('mouseout', handleNodeMouseOut)
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));

    // Labels
    node.append('text')
      .attr('class', 'node-label')
      .attr('dx', 12)
      .attr('dy', 4)
      .text(d => d.label);

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
    });

    // Tooltip
    const tooltip = d3.select('#tooltip');

    function handleNodeClick(event, d) {
      event.stopPropagation();
      
      // Send message to VS Code extension
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'artifact_interaction',
          action: 'open_file',
          payload: {
            filePath: d.filePath,
            line: d.line
          }
        }, '*');
      }

      console.log('[Signal Map] Node clicked:', d);
    }

    function handleNodeMouseOver(event, d) {
      const params = d.params && d.params.length > 0
        ? d.params.map(p => {
            const type = d.paramTypes[p];
            return type ? \`\${p}: \${type}\` : p;
          }).join(', ')
        : 'none';

      tooltip.html(\`
        <h4>\${d.label}</h4>
        <p><strong>Source:</strong> \${d.group}</p>
        <p><strong>Parameters:</strong> \${params}</p>
        <p><strong>File:</strong> \${d.filePath.split('/').pop()}</p>
        <p><strong>Line:</strong> \${d.line}</p>
        <p style="margin-top: 8px; color: #007acc; font-size: 11px;">Click to open in editor</p>
      \`)
        .classed('show', true)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px');
    }

    function handleNodeMouseOut() {
      tooltip.classed('show', false);
    }

    // Drag handlers
    function dragStarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragEnded(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Initial zoom to fit
    setTimeout(() => {
      const bounds = g.node().getBBox();
      const fullWidth = bounds.width;
      const fullHeight = bounds.height;
      const midX = bounds.x + fullWidth / 2;
      const midY = bounds.y + fullHeight / 2;

      if (fullWidth === 0 || fullHeight === 0) return;

      const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
      const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }, 1000);

    // Send ready message
    console.log('[Signal Map] D3.js renderer loaded');
    console.log('[Signal Map] Nodes:', nodes.length);
    console.log('[Signal Map] Links:', links.length);
    
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'artifact_ready', artifactType: 'signal_map' }, '*');
    }
  </script>
</body>
</html>
    `.trim();
  }
}
