/**
 * Dependency Graph Renderer
 * DAG-based visualization of hop, task, and file dependencies
 * Highlights critical paths and enables interactive exploration
 */
import { DependencyGraphDataSchema } from '../schemas/dependency_graph_schema.js';
export class DependencyGraphRenderer {
    type = 'dependency_graph';
    async render(data) {
        // Validate input data
        const graphData = DependencyGraphDataSchema.parse(data);
        const { nodes, edges } = graphData;
        // Limit graph depth to prevent infinite recursion
        if (nodes.length > 1000) {
            throw new Error('Graph too large: maximum 1000 nodes allowed');
        }
        // Serialize data for client-side rendering
        const nodesJson = JSON.stringify(nodes);
        const edgesJson = JSON.stringify(edges);
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dependency Graph - DAG Visualization</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
      cursor: grab;
    }

    svg:active {
      cursor: grabbing;
    }

    .node {
      cursor: pointer;
      transition: all 0.2s;
    }

    .node circle {
      stroke: #fff;
      stroke-width: 2px;
      transition: all 0.2s;
    }

    .node.hop circle {
      fill: #1f77b4;
    }

    .node.task circle {
      fill: #2ca02c;
    }

    .node.file circle {
      fill: #7f7f7f;
    }

    .node.critical circle {
      fill: #d62728;
      stroke: #ff0000;
      stroke-width: 3px;
    }

    .node.focused circle {
      stroke: #ffd700;
      stroke-width: 4px;
      filter: drop-shadow(0 0 8px #ffd700);
    }

    .node.dependency-highlight circle {
      stroke: #ffa500;
      stroke-width: 3px;
    }

    .node text {
      font-size: 12px;
      fill: #d4d4d4;
      pointer-events: none;
      text-anchor: middle;
      dominant-baseline: middle;
    }

    .link {
      fill: none;
      stroke: #999;
      stroke-width: 1.5px;
      marker-end: url(#arrowhead);
    }

    .link.critical {
      stroke: #d62728;
      stroke-width: 3px;
      marker-end: url(#arrowhead-critical);
    }

    .link.dependency-highlight {
      stroke: #ffa500;
      stroke-width: 2.5px;
    }

    .tooltip {
      position: absolute;
      font-size: 12px;
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

    .controls button {
      margin-top: 10px;
      padding: 5px 10px;
      background: #007acc;
      color: #fff;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    }

    .controls button:hover {
      background: #005a9e;
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
      border: 2px solid #fff;
    }
  </style>
</head>
<body>
  <div id="graph-container">
    <svg id="graph">
      <defs>
        <marker id="arrowhead" viewBox="0 -5 10 10" refX="20" refY="0"
                markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,-5L10,0L0,5" fill="#999"></path>
        </marker>
        <marker id="arrowhead-critical" viewBox="0 -5 10 10" refX="20" refY="0"
                markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,-5L10,0L0,5" fill="#d62728"></path>
        </marker>
      </defs>
    </svg>
    
    <div class="controls">
      <h3>📊 Dependency Graph</h3>
      <p><strong>Nodes:</strong> ${nodes.length}</p>
      <p><strong>Edges:</strong> ${edges.length}</p>
      <p><strong>Hops:</strong> <span id="hop-count">0</span></p>
      <p><strong>Tasks:</strong> <span id="task-count">0</span></p>
      <p><strong>Files:</strong> <span id="file-count">0</span></p>
      <button id="reset-btn">Reset View</button>
      <button id="fit-btn">Fit to Screen</button>
      <p style="margin-top: 10px; color: #858585; font-size: 11px;">
        Click nodes to highlight dependencies<br>
        Drag to pan, scroll to zoom<br>
        Red = critical path
      </p>
    </div>

    <div class="legend">
      <h4>Node Types</h4>
      <div class="legend-item">
        <div class="legend-color" style="background: #1f77b4;"></div>
        <span>Hop</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #2ca02c;"></div>
        <span>Task</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #7f7f7f;"></div>
        <span>File</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #d62728; border-color: #ff0000;"></div>
        <span>Critical Path</span>
      </div>
    </div>

    <div class="tooltip" id="tooltip"></div>
  </div>

  <script>
    const nodes = ${nodesJson};
    const edges = ${edgesJson};

    // Update node counts
    const hopCount = nodes.filter(n => n.type === 'hop').length;
    const taskCount = nodes.filter(n => n.type === 'task').length;
    const fileCount = nodes.filter(n => n.type === 'file').length;
    document.getElementById('hop-count').textContent = hopCount;
    document.getElementById('task-count').textContent = taskCount;
    document.getElementById('file-count').textContent = fileCount;

    // Build adjacency map for critical path calculation
    const adjacencyMap = new Map();
    nodes.forEach(node => adjacencyMap.set(node.id, []));
    edges.forEach(edge => {
      if (adjacencyMap.has(edge.source)) {
        adjacencyMap.get(edge.source).push(edge.target);
      }
    });

    // Calculate longest path (critical path) using topological sort + DP
    function findCriticalPath() {
      const inDegree = new Map();
      const pathLength = new Map();
      const parent = new Map();

      nodes.forEach(node => {
        inDegree.set(node.id, 0);
        pathLength.set(node.id, 0);
        parent.set(node.id, null);
      });

      edges.forEach(edge => {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      });

      // Topological sort queue
      const queue = [];
      nodes.forEach(node => {
        if (inDegree.get(node.id) === 0) {
          queue.push(node.id);
        }
      });

      const topoOrder = [];
      while (queue.length > 0) {
        const current = queue.shift();
        topoOrder.push(current);

        const neighbors = adjacencyMap.get(current) || [];
        neighbors.forEach(neighbor => {
          inDegree.set(neighbor, inDegree.get(neighbor) - 1);
          if (inDegree.get(neighbor) === 0) {
            queue.push(neighbor);
          }
        });
      }

      // Check for cycles
      if (topoOrder.length !== nodes.length) {
        console.warn('Cycle detected in dependency graph');
        return new Set();
      }

      // Calculate longest path using dynamic programming
      topoOrder.forEach(nodeId => {
        const neighbors = adjacencyMap.get(nodeId) || [];
        neighbors.forEach(neighbor => {
          const newLength = pathLength.get(nodeId) + 1;
          if (newLength > pathLength.get(neighbor)) {
            pathLength.set(neighbor, newLength);
            parent.set(neighbor, nodeId);
          }
        });
      });

      // Find node with maximum path length
      let maxLength = 0;
      let endNode = null;
      pathLength.forEach((length, nodeId) => {
        if (length > maxLength) {
          maxLength = length;
          endNode = nodeId;
        }
      });

      // Reconstruct critical path
      const criticalPath = new Set();
      let current = endNode;
      while (current !== null) {
        criticalPath.add(current);
        current = parent.get(current);
      }

      return criticalPath;
    }

    const criticalPath = findCriticalPath();

    // Set up SVG and zoom behavior
    const svg = d3.select('#graph');
    const width = window.innerWidth;
    const height = window.innerHeight;

    const g = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create hierarchical layout using D3 tree
    const root = d3.stratify()
      .id(d => d.id)
      .parentId(d => {
        // Find parent (first incoming edge)
        const incomingEdge = edges.find(e => e.target === d.id);
        return incomingEdge ? incomingEdge.source : null;
      })(nodes.filter((node, index, self) => {
        // Handle nodes without parents (roots) and ensure uniqueness
        const incomingEdges = edges.filter(e => e.target === node.id);
        return incomingEdges.length === 0 || index === self.findIndex(n => n.id === node.id);
      }));

    const treeLayout = d3.tree()
      .size([width - 200, height - 200])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2));

    const treeData = treeLayout(root);

    // Create position map from tree layout
    const positionMap = new Map();
    treeData.descendants().forEach(d => {
      positionMap.set(d.id, { x: d.x, y: d.y + 100 });
    });

    // Assign positions to all nodes (including those not in tree)
    nodes.forEach((node, i) => {
      if (!positionMap.has(node.id)) {
        // Fallback: circular layout for disconnected nodes
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = Math.min(width, height) / 3;
        positionMap.set(node.id, {
          x: width / 2 + radius * Math.cos(angle),
          y: height / 2 + radius * Math.sin(angle)
        });
      }
    });

    // Render edges
    const link = g.selectAll('.link')
      .data(edges)
      .enter().append('path')
      .attr('class', d => {
        const isCritical = criticalPath.has(d.source) && criticalPath.has(d.target);
        return isCritical ? 'link critical' : 'link';
      })
      .attr('d', d => {
        const source = positionMap.get(d.source);
        const target = positionMap.get(d.target);
        return \`M\${source.x},\${source.y}L\${target.x},\${target.y}\`;
      });

    // Render nodes
    const node = g.selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', d => {
        const classes = ['node', d.type];
        if (criticalPath.has(d.id)) classes.push('critical');
        return classes.join(' ');
      })
      .attr('transform', d => {
        const pos = positionMap.get(d.id);
        return \`translate(\${pos.x},\${pos.y})\`;
      })
      .on('click', handleNodeClick)
      .on('mouseenter', handleNodeHover)
      .on('mouseleave', handleNodeLeave);

    node.append('circle')
      .attr('r', 10);

    node.append('text')
      .attr('dy', -15)
      .text(d => d.label.length > 20 ? d.label.substring(0, 17) + '...' : d.label);

    // Tooltip
    const tooltip = d3.select('#tooltip');

    function handleNodeHover(event, d) {
      tooltip.classed('show', true)
        .html(\`
          <h4>\${d.label}</h4>
          <p><strong>Type:</strong> \${d.type}</p>
          <p><strong>ID:</strong> \${d.id}</p>
          \${d.metadata ? \`<p><strong>Metadata:</strong> \${JSON.stringify(d.metadata, null, 2)}</p>\` : ''}
        \`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px');
    }

    function handleNodeLeave() {
      tooltip.classed('show', false);
    }

    let focusedNode = null;

    function handleNodeClick(event, d) {
      event.stopPropagation();

      // Clear previous focus
      node.classed('focused', false).classed('dependency-highlight', false);
      link.classed('dependency-highlight', false);

      if (focusedNode === d.id) {
        focusedNode = null;
        return;
      }

      focusedNode = d.id;

      // Highlight clicked node
      d3.select(this).classed('focused', true);

      // Find all direct dependencies (outgoing edges)
      const dependencies = new Set();
      edges.forEach(edge => {
        if (edge.source === d.id) {
          dependencies.add(edge.target);
        }
      });

      // Highlight dependency nodes and edges
      node.filter(n => dependencies.has(n.id))
        .classed('dependency-highlight', true);

      link.filter(e => e.source === d.id)
        .classed('dependency-highlight', true);
    }

    // Click background to clear focus
    svg.on('click', () => {
      focusedNode = null;
      node.classed('focused', false).classed('dependency-highlight', false);
      link.classed('dependency-highlight', false);
    });

    // Reset view button
    document.getElementById('reset-btn').addEventListener('click', () => {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
      focusedNode = null;
      node.classed('focused', false).classed('dependency-highlight', false);
      link.classed('dependency-highlight', false);
    });

    // Fit to screen button
    document.getElementById('fit-btn').addEventListener('click', () => {
      const bounds = g.node().getBBox();
      const fullWidth = bounds.width;
      const fullHeight = bounds.height;
      const midX = bounds.x + fullWidth / 2;
      const midY = bounds.y + fullHeight / 2;

      const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
      const translate = [width / 2 - scale * midX, height / 2 - scale * midY];

      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    });

    // Keyboard navigation (WCAG AA compliance)
    let selectedIndex = 0;
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % nodes.length;
        const selectedNode = nodes[selectedIndex];
        const nodeSelection = node.filter(d => d.id === selectedNode.id);
        handleNodeClick({ stopPropagation: () => {} }, selectedNode);
        
        // Scroll to selected node
        const pos = positionMap.get(selectedNode.id);
        const transform = d3.zoomIdentity.translate(
          width / 2 - pos.x,
          height / 2 - pos.y
        ).scale(1);
        svg.transition().duration(500).call(zoom.transform, transform);
      }
    });

    console.log(\`[DependencyGraph] Rendered \${nodes.length} nodes, \${edges.length} edges\`);
    console.log(\`[DependencyGraph] Critical path length: \${criticalPath.size} nodes\`);
  </script>
</body>
</html>
    `.trim();
    }
}
//# sourceMappingURL=dependency_graph.js.map