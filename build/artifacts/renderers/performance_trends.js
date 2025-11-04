/**
 * Performance Trends Renderer
 * D3-based line/bar chart visualization of LOC, test count, and coverage trends
 */
import { TrendDatasetSchema } from '../schemas/trend_data_schema.js';
export class PerformanceTrendRenderer {
    type = 'performance_trends';
    async render(data) {
        // Validate input data
        const trendData = TrendDatasetSchema.parse(data);
        // Serialize data for client-side rendering
        const dataJson = JSON.stringify(trendData);
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Trends - 12-Week Analytics</title>
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

    #chart-container {
      width: 100vw;
      height: 100vh;
      position: relative;
      padding: 20px;
    }

    svg {
      width: 100%;
      height: calc(100% - 100px);
    }

    .line {
      fill: none;
      stroke-width: 2.5px;
    }

    .line.loc {
      stroke: #1f77b4;
    }

    .line.tests {
      stroke: #2ca02c;
    }

    .area {
      opacity: 0.3;
    }

    .area.coverage {
      fill: #ff7f0e;
    }

    .bar {
      fill: #2ca02c;
      opacity: 0.6;
    }

    .bar:hover {
      opacity: 0.8;
    }

    .threshold-line {
      stroke: #d62728;
      stroke-width: 2px;
      stroke-dasharray: 5,5;
    }

    .threshold-label {
      fill: #d62728;
      font-size: 12px;
    }

    .axis {
      font-size: 12px;
    }

    .axis path,
    .axis line {
      stroke: #666;
    }

    .axis text {
      fill: #d4d4d4;
    }

    .axis-label {
      font-size: 14px;
      font-weight: bold;
    }

    .grid line {
      stroke: #333;
      stroke-opacity: 0.7;
      shape-rendering: crispEdges;
    }

    .grid path {
      stroke-width: 0;
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
      top: 20px;
      left: 20px;
      background: #252526;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #007acc;
      z-index: 100;
    }

    .controls h3 {
      margin: 0 0 10px 0;
      color: #007acc;
      font-size: 14px;
    }

    .controls label {
      display: block;
      margin: 10px 0 5px 0;
      font-size: 12px;
    }

    .controls select {
      width: 100%;
      padding: 5px;
      background: #1e1e1e;
      color: #d4d4d4;
      border: 1px solid #007acc;
      border-radius: 3px;
      font-size: 12px;
    }

    .legend {
      position: absolute;
      top: 20px;
      right: 20px;
      background: #252526;
      padding: 15px;
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

    .legend-line {
      width: 30px;
      height: 3px;
      margin-right: 8px;
    }

    .legend-rect {
      width: 15px;
      height: 15px;
      margin-right: 8px;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div id="chart-container">
    <div class="controls">
      <h3>📈 Performance Trends</h3>
      <label for="time-range">Time Range:</label>
      <select id="time-range">
        <option value="4">4 Weeks</option>
        <option value="8">8 Weeks</option>
        <option value="12" selected>12 Weeks</option>
      </select>
      <p style="margin-top: 15px; color: #858585; font-size: 11px;">
        <strong>Project:</strong><br>
        ${trendData.projectPath.split('/').pop()}<br><br>
        <strong>Goal:</strong> 75% Coverage
      </p>
    </div>

    <div class="legend">
      <h4>Metrics</h4>
      <div class="legend-item">
        <div class="legend-line" style="background: #1f77b4;"></div>
        <span>Lines of Code</span>
      </div>
      <div class="legend-item">
        <div class="legend-rect" style="background: #2ca02c;"></div>
        <span>Test Count</span>
      </div>
      <div class="legend-item">
        <div class="legend-line" style="background: #ff7f0e; opacity: 0.5;"></div>
        <span>Coverage %</span>
      </div>
      <div class="legend-item">
        <div class="legend-line" style="background: #d62728; border-top: 2px dashed #d62728;"></div>
        <span>Coverage Goal (75%)</span>
      </div>
    </div>

    <svg id="chart" role="img" aria-label="Performance trends chart showing LOC, test count, and coverage over time"></svg>
    <div class="tooltip" id="tooltip"></div>
  </div>

  <script>
    const fullData = ${dataJson};
    let visibleWeeks = 12;

    // Chart dimensions
    const margin = { top: 40, right: 80, bottom: 60, left: 80 };
    const containerWidth = document.getElementById('chart-container').clientWidth;
    const containerHeight = document.getElementById('chart-container').clientHeight - 100;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // SVG setup
    const svg = d3.select('#chart')
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    const g = svg.append('g')
      .attr('transform', \`translate(\${margin.left},\${margin.top})\`);

    // Goal threshold
    const coverageGoal = 75;

    function updateChart(weeks) {
      // Filter data to visible weeks
      const data = {
        loc: fullData.loc.slice(-weeks),
        tests: fullData.tests.slice(-weeks),
        coverage: fullData.coverage.slice(-weeks)
      };

      // Clear previous chart
      g.selectAll('*').remove();

      // Scales
      const x = d3.scaleTime()
        .domain(d3.extent(data.loc, d => d.timestamp))
        .range([0, width]);

      const yLOC = d3.scaleLinear()
        .domain([0, d3.max(data.loc, d => d.value) * 1.1])
        .range([height, 0]);

      const yTests = d3.scaleLinear()
        .domain([0, d3.max(data.tests, d => d.value) * 1.2])
        .range([height, 0]);

      const yCoverage = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);

      // Grid lines
      const gridX = d3.axisBottom(x)
        .tickSize(-height)
        .tickFormat('');

      const gridY = d3.axisLeft(yLOC)
        .tickSize(-width)
        .tickFormat('');

      g.append('g')
        .attr('class', 'grid')
        .attr('transform', \`translate(0,\${height})\`)
        .call(gridX);

      g.append('g')
        .attr('class', 'grid')
        .call(gridY);

      // Coverage area chart (background)
      const areaGenerator = d3.area()
        .x(d => x(d.timestamp))
        .y0(height)
        .y1(d => yCoverage(d.value));

      g.append('path')
        .datum(data.coverage)
        .attr('class', 'area coverage')
        .attr('d', areaGenerator);

      // Test count bars
      const barWidth = width / weeks * 0.6;

      g.selectAll('.bar')
        .data(data.tests)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.timestamp) - barWidth / 2)
        .attr('y', d => yTests(d.value))
        .attr('width', barWidth)
        .attr('height', d => height - yTests(d.value))
        .on('mouseover', (event, d) => showTooltip(event, d, 'Tests'))
        .on('mouseout', hideTooltip);

      // LOC line chart
      const lineGenerator = d3.line()
        .x(d => x(d.timestamp))
        .y(d => yLOC(d.value));

      g.append('path')
        .datum(data.loc)
        .attr('class', 'line loc')
        .attr('d', lineGenerator);

      // LOC data points
      g.selectAll('.dot-loc')
        .data(data.loc)
        .enter()
        .append('circle')
        .attr('class', 'dot-loc')
        .attr('cx', d => x(d.timestamp))
        .attr('cy', d => yLOC(d.value))
        .attr('r', 4)
        .attr('fill', '#1f77b4')
        .on('mouseover', (event, d) => showTooltip(event, d, 'LOC'))
        .on('mouseout', hideTooltip);

      // Coverage line chart
      const coverageLineGenerator = d3.line()
        .x(d => x(d.timestamp))
        .y(d => yCoverage(d.value));

      g.append('path')
        .datum(data.coverage)
        .attr('class', 'line')
        .attr('stroke', '#ff7f0e')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('d', coverageLineGenerator);

      // Coverage data points
      g.selectAll('.dot-coverage')
        .data(data.coverage)
        .enter()
        .append('circle')
        .attr('class', 'dot-coverage')
        .attr('cx', d => x(d.timestamp))
        .attr('cy', d => yCoverage(d.value))
        .attr('r', 4)
        .attr('fill', '#ff7f0e')
        .on('mouseover', (event, d) => showTooltip(event, d, 'Coverage'))
        .on('mouseout', hideTooltip);

      // Coverage goal threshold line
      g.append('line')
        .attr('class', 'threshold-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yCoverage(coverageGoal))
        .attr('y2', yCoverage(coverageGoal));

      g.append('text')
        .attr('class', 'threshold-label')
        .attr('x', width + 5)
        .attr('y', yCoverage(coverageGoal))
        .attr('dy', 4)
        .text(\`\${coverageGoal}% Goal\`);

      // Axes
      const xAxis = d3.axisBottom(x)
        .ticks(weeks)
        .tickFormat(d3.timeFormat('%m/%d'));

      const yAxisLOC = d3.axisLeft(yLOC)
        .ticks(5);

      const yAxisCoverage = d3.axisRight(yCoverage)
        .ticks(5)
        .tickFormat(d => d + '%');

      g.append('g')
        .attr('class', 'axis')
        .attr('transform', \`translate(0,\${height})\`)
        .call(xAxis);

      g.append('g')
        .attr('class', 'axis')
        .call(yAxisLOC);

      g.append('g')
        .attr('class', 'axis')
        .attr('transform', \`translate(\${width},0)\`)
        .call(yAxisCoverage);

      // Axis labels
      g.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .attr('text-anchor', 'middle')
        .attr('fill', '#d4d4d4')
        .text('Week');

      g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -55)
        .attr('text-anchor', 'middle')
        .attr('fill', '#d4d4d4')
        .text('Lines of Code / Test Count');

      g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', width + 65)
        .attr('text-anchor', 'middle')
        .attr('fill', '#d4d4d4')
        .text('Coverage %');
    }

    // Tooltip
    const tooltip = d3.select('#tooltip');

    function showTooltip(event, d, metric) {
      const date = new Date(d.timestamp);
      const formattedDate = date.toLocaleDateString();
      
      let content = \`
        <h4>\${metric}</h4>
        <p><strong>Date:</strong> \${formattedDate}</p>
        <p><strong>Value:</strong> \${d.value.toLocaleString()}\${metric === 'Coverage' ? '%' : ''}</p>
      \`;

      tooltip.classed('show', true)
        .html(content)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px');
    }

    function hideTooltip() {
      tooltip.classed('show', false);
    }

    // Time range selector
    document.getElementById('time-range').addEventListener('change', (event) => {
      visibleWeeks = parseInt(event.target.value, 10);
      updateChart(visibleWeeks);
    });

    // Initial render
    updateChart(visibleWeeks);

    console.log(\`[PerformanceTrends] Rendered \${fullData.loc.length}-week trend chart\`);
  </script>
</body>
</html>
    `.trim();
    }
}
//# sourceMappingURL=performance_trends.js.map