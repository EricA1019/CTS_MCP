/**
 * D3.js Clustered Signal Map Renderer
 * Force-directed graph with community detection clustering for large networks (150+ nodes)
 */
export class ClusteredSignalMapRenderer {
    type = 'clustered_signal_map';
    async render(data) {
        const mapData = data;
        const signals = mapData.signals || [];
        // Build nodes
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
        // Build links (for Phase 1, create synthetic connections based on file proximity)
        const links = [];
        const fileGroups = new Map();
        nodes.forEach(node => {
            if (!fileGroups.has(node.filePath)) {
                fileGroups.set(node.filePath, []);
            }
            fileGroups.get(node.filePath).push(node);
        });
        // Connect signals in the same file
        fileGroups.forEach(fileNodes => {
            for (let i = 0; i < fileNodes.length - 1; i++) {
                for (let j = i + 1; j < fileNodes.length; j++) {
                    links.push({
                        source: fileNodes[i].id,
                        target: fileNodes[j].id,
                        value: 1,
                    });
                }
            }
        });
        // Detect communities (client-side will do this, but we prepare the data)
        const clusterData = {
            nodes: nodes.map(n => ({ id: n.id })),
            links: links.map(l => ({ source: l.source, target: l.target })),
        };
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clustered Signal Map - D3.js</title>
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
      stroke-opacity: 0.3;
      stroke-width: 1px;
    }

    .link.highlighted {
      stroke: #ffa500;
      stroke-opacity: 0.8;
      stroke-width: 2px;
    }

    .cluster-hull {
      fill-opacity: 0.2;
      stroke-width: 2px;
      stroke-opacity: 0.5;
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
      max-height: 90vh;
      overflow-y: auto;
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
      cursor: pointer;
      padding: 3px;
      border-radius: 3px;
      transition: background 0.2s;
    }

    .legend-item:hover {
      background: #2d2d30;
    }

    .legend-item.selected {
      background: #094771;
    }

    .legend-color {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      margin-right: 8px;
      border: 1px solid #fff;
    }

    .performance-overlay {
      position: absolute;
      bottom: 10px;
      left: 10px;
      background: #252526;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #007acc;
      font-size: 11px;
      opacity: 0.8;
    }

    .performance-overlay.warning {
      border-color: #ffa500;
      color: #ffa500;
    }

    .performance-overlay.error {
      border-color: #f48771;
      color: #f48771;
    }
  </style>
</head>
<body>
  <div id="graph-container">
    <svg id="graph"></svg>
    
    <div class="controls">
      <h3>🧩 Clustered Signal Map</h3>
      <p><strong>Total Signals:</strong> ${signals.length}</p>
      <p><strong>Clusters:</strong> <span id="cluster-count">Calculating...</span></p>
      <p><strong>Modularity:</strong> <span id="modularity">Calculating...</span></p>
      <p style="margin-top: 10px; color: #858585; font-size: 11px;">
        Click nodes to view details<br>
        Click legend to filter clusters<br>
        Drag nodes to rearrange<br>
        Scroll to zoom
      </p>
    </div>

    <div class="legend" id="cluster-legend">
      <h4>Clusters</h4>
      <div id="legend-items"></div>
    </div>

    <div class="performance-overlay" id="perf-overlay">
      Rendering...
    </div>

    <div class="tooltip" id="tooltip"></div>
  </div>

  <script>
    // Embedded community detection algorithm
    ${this.getCommunityDetectionScript()}

    // Performance tracking
    const perfStart = performance.now();
    const perfMarks = {};

    // Data
    const nodes = ${JSON.stringify(nodes)};
    const links = ${JSON.stringify(links)};

    // Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Detect communities
    perfMarks.clusteringStart = performance.now();
    const clusterResult = detectCommunities(
      nodes.map(n => ({ id: n.id })),
      links.map(l => ({ source: l.source, target: l.target }))
    );
    perfMarks.clusteringEnd = performance.now();

    // Assign cluster colors
    const clusterIds = Array.from(clusterResult.clusters.keys()).sort((a, b) => {
      const sizeA = clusterResult.clusters.get(a).size;
      const sizeB = clusterResult.clusters.get(b).size;
      return sizeB - sizeA; // Sort by size descending
    });

    const clusterColors = d3.scaleOrdinal()
      .domain(clusterIds.map(String))
      .range(d3.schemeCategory10);

    // Assign clusters to nodes
    nodes.forEach(node => {
      node.cluster = clusterResult.nodeToCluster.get(node.id);
      node.clusterColor = clusterColors(String(node.cluster));
    });

    // Update controls
    document.getElementById('cluster-count').textContent = clusterResult.clusters.size;
    document.getElementById('modularity').textContent = clusterResult.modularity.toFixed(4);

    // Build cluster legend
    const legendItems = document.getElementById('legend-items');
    clusterIds.forEach(clusterId => {
      const clusterNodes = clusterResult.clusters.get(clusterId);
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.dataset.cluster = clusterId;
      item.innerHTML = \`
        <div class="legend-color" style="background: \${clusterColors(String(clusterId))};"></div>
        <span>Cluster \${clusterId} (\${clusterNodes.size} nodes)</span>
      \`;
      item.addEventListener('click', () => toggleCluster(clusterId));
      legendItems.appendChild(item);
    });

    // SVG setup
    const svg = d3.select('#graph');
    const g = svg.append('g');

    // Cluster hulls group
    const hullsGroup = g.append('g').attr('class', 'hulls');

    // Links group
    const linksGroup = g.append('g').attr('class', 'links');

    // Nodes group
    const nodesGroup = g.append('g').attr('class', 'nodes');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Force simulation
    perfMarks.simulationStart = performance.now();
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20))
      .force('cluster', clusterForce());

    // Links
    const link = linksGroup
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link');

    // Nodes
    const node = nodesGroup
      .selectAll('g')
      .data(nodes)
      .join('g');

    node.append('circle')
      .attr('class', 'node')
      .attr('r', 8)
      .attr('fill', d => d.clusterColor)
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

    // Cluster hulls
    const hulls = hullsGroup.selectAll('path');

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => \`translate(\${d.x},\${d.y})\`);

      // Update cluster hulls
      updateHulls();
    });

    simulation.on('end', () => {
      perfMarks.simulationEnd = performance.now();
      updatePerformanceOverlay();
    });

    // Cluster force to keep clusters together
    function clusterForce() {
      const strength = 0.5;
      return alpha => {
        nodes.forEach(node => {
          // Find cluster centroid
          const clusterNodes = nodes.filter(n => n.cluster === node.cluster);
          const cx = d3.mean(clusterNodes, n => n.x) || 0;
          const cy = d3.mean(clusterNodes, n => n.y) || 0;
          
          // Pull towards centroid
          node.vx -= (node.x - cx) * strength * alpha;
          node.vy -= (node.y - cy) * strength * alpha;
        });
      };
    }

    // Update cluster hulls
    function updateHulls() {
      const hullData = [];
      clusterIds.forEach(clusterId => {
        const clusterNodes = nodes.filter(n => n.cluster === clusterId);
        if (clusterNodes.length > 2) {
          hullData.push({
            cluster: clusterId,
            points: clusterNodes.map(n => [n.x, n.y]),
            color: clusterColors(String(clusterId)),
          });
        }
      });

      hullsGroup
        .selectAll('path')
        .data(hullData)
        .join('path')
        .attr('class', 'cluster-hull')
        .attr('d', d => {
          const hull = d3.polygonHull(d.points);
          return hull ? \`M\${hull.join('L')}Z\` : null;
        })
        .attr('fill', d => d.color)
        .attr('stroke', d => d.color);
    }

    // Cluster filtering
    let selectedClusters = new Set();

    function toggleCluster(clusterId) {
      const item = document.querySelector(\`.legend-item[data-cluster="\${clusterId}"]\`);
      
      if (selectedClusters.has(clusterId)) {
        selectedClusters.delete(clusterId);
        item.classList.remove('selected');
      } else {
        selectedClusters.add(clusterId);
        item.classList.add('selected');
      }

      if (selectedClusters.size === 0) {
        // Show all
        node.style('opacity', 1);
        link.style('opacity', 1);
      } else {
        // Filter by selected clusters
        node.style('opacity', d => selectedClusters.has(d.cluster) ? 1 : 0.1);
        link.style('opacity', d => {
          const sourceCluster = nodes.find(n => n.id === d.source.id)?.cluster;
          const targetCluster = nodes.find(n => n.id === d.target.id)?.cluster;
          return (selectedClusters.has(sourceCluster) && selectedClusters.has(targetCluster)) ? 1 : 0.05;
        });
      }
    }

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

      console.log('[Clustered Signal Map] Node clicked:', d);
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
        <p><strong>Cluster:</strong> \${d.cluster}</p>
        <p><strong>Parameters:</strong> \${params}</p>
        <p><strong>File:</strong> \${d.filePath.split('/').pop()}</p>
        <p><strong>Line:</strong> \${d.line}</p>
        <p style="margin-top: 8px; color: #007acc; font-size: 11px;">Click to open in editor</p>
      \`)
        .classed('show', true)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px');

      // Highlight connected links
      link.classed('highlighted', l => 
        l.source.id === d.id || l.target.id === d.id
      );
    }

    function handleNodeMouseOut() {
      tooltip.classed('show', false);
      link.classed('highlighted', false);
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

    // Performance overlay
    function updatePerformanceOverlay() {
      const totalTime = performance.now() - perfStart;
      const clusteringTime = perfMarks.clusteringEnd - perfMarks.clusteringStart;
      const simulationTime = perfMarks.simulationEnd - perfMarks.simulationStart;

      const overlay = document.getElementById('perf-overlay');
      overlay.innerHTML = \`
        <strong>Performance:</strong><br>
        Total: \${totalTime.toFixed(0)}ms<br>
        Clustering: \${clusteringTime.toFixed(0)}ms<br>
        Simulation: \${simulationTime.toFixed(0)}ms
      \`;

      if (totalTime > 750) {
        overlay.classList.add('warning');
      }
      if (totalTime > 1500) {
        overlay.classList.remove('warning');
        overlay.classList.add('error');
      }
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
    console.log('[Clustered Signal Map] D3.js renderer loaded');
    console.log('[Clustered Signal Map] Nodes:', nodes.length);
    console.log('[Clustered Signal Map] Links:', links.length);
    console.log('[Clustered Signal Map] Clusters:', clusterResult.clusters.size);
    console.log('[Clustered Signal Map] Modularity:', clusterResult.modularity.toFixed(4));
    
    if (window.parent !== window) {
      window.parent.postMessage({ 
        type: 'artifact_ready', 
        artifactType: 'clustered_signal_map',
        metadata: {
          clusters: clusterResult.clusters.size,
          modularity: clusterResult.modularity,
        }
      }, '*');
    }
  </script>
</body>
</html>
    `.trim();
    }
    /**
     * Get the community detection script to embed in HTML
     */
    getCommunityDetectionScript() {
        return `
    function detectCommunities(nodes, links) {
      const startTime = performance.now();

      if (nodes.length === 0) {
        return { clusters: new Map(), nodeToCluster: new Map(), modularity: 0 };
      }

      if (nodes.length === 1) {
        const nodeId = nodes[0].id;
        return {
          clusters: new Map([[0, new Set([nodeId])]]),
          nodeToCluster: new Map([[nodeId, 0]]),
          modularity: 0,
        };
      }

      // Build adjacency list
      const adjacency = new Map();
      nodes.forEach(node => adjacency.set(node.id, new Set()));
      
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        adjacency.get(sourceId)?.add(targetId);
        adjacency.get(targetId)?.add(sourceId);
      });

      // Calculate degrees
      const degrees = new Map();
      nodes.forEach(node => {
        degrees.set(node.id, adjacency.get(node.id)?.size || 0);
      });

      const totalEdges = links.length;
      const m2 = 2 * totalEdges;

      // Initialize clusters
      const nodeToCluster = new Map();
      const clusters = new Map();
      
      nodes.forEach((node, index) => {
        nodeToCluster.set(node.id, index);
        clusters.set(index, new Set([node.id]));
      });

      // Greedy modularity optimization
      let improved = true;
      let iterations = 0;

      while (improved && iterations < 100) {
        improved = false;
        iterations++;

        for (const node of nodes) {
          const nodeId = node.id;
          const currentCluster = nodeToCluster.get(nodeId);
          const neighbors = adjacency.get(nodeId) || new Set();

          const neighborClusters = new Set();
          neighbors.forEach(neighborId => {
            const cluster = nodeToCluster.get(neighborId);
            if (cluster !== undefined && cluster !== currentCluster) {
              neighborClusters.add(cluster);
            }
          });

          let bestCluster = currentCluster;
          let bestGain = 0;

          neighborClusters.forEach(targetCluster => {
            const gain = calculateModularityGain(
              nodeId, currentCluster, targetCluster,
              adjacency, degrees, clusters, nodeToCluster, m2
            );

            if (gain > bestGain) {
              bestGain = gain;
              bestCluster = targetCluster;
            }
          });

          if (bestCluster !== currentCluster && bestGain > 1e-6) {
            clusters.get(currentCluster)?.delete(nodeId);
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

      const modularity = calculateModularity(clusters, adjacency, degrees, totalEdges);

      return { clusters, nodeToCluster, modularity };
    }

    function calculateModularityGain(nodeId, fromCluster, toCluster, adjacency, degrees, clusters, nodeToCluster, m2) {
      const neighbors = adjacency.get(nodeId) || new Set();
      const nodeDegree = degrees.get(nodeId) || 0;

      let edgesToTarget = 0;
      neighbors.forEach(neighborId => {
        if (nodeToCluster.get(neighborId) === toCluster) edgesToTarget++;
      });

      let edgesFromSource = 0;
      neighbors.forEach(neighborId => {
        if (nodeToCluster.get(neighborId) === fromCluster) edgesFromSource++;
      });

      const targetClusterNodes = clusters.get(toCluster) || new Set();
      let targetDegreeSum = 0;
      targetClusterNodes.forEach(id => {
        targetDegreeSum += degrees.get(id) || 0;
      });

      const sourceClusterNodes = clusters.get(fromCluster) || new Set();
      let sourceDegreeSum = 0;
      sourceClusterNodes.forEach(id => {
        sourceDegreeSum += degrees.get(id) || 0;
      });

      return (edgesToTarget - edgesFromSource) / m2 - 
             (nodeDegree * (targetDegreeSum - sourceDegreeSum + nodeDegree)) / (m2 * m2);
    }

    function calculateModularity(clusters, adjacency, degrees, totalEdges) {
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
            if (clusterNodes.has(neighborId)) internalEdges++;
          });
        });

        internalEdges /= 2;
        modularity += internalEdges / totalEdges - Math.pow(degreeSum / m2, 2);
      });

      return modularity;
    }
    `;
    }
}
//# sourceMappingURL=d3_signal_map_v2.js.map