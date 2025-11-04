/**
 * Placeholder Hop Dashboard Renderer
 * Returns simple HTML until React implementation is complete
 */

import { ArtifactRenderer } from '../types.js';

export class PlaceholderHopDashboardRenderer implements ArtifactRenderer {
  readonly type = 'hop_dashboard';

  async render(data: unknown): Promise<string> {
    const hops = Array.isArray(data) ? data : [];
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hop Dashboard (Placeholder)</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #1e1e1e;
      color: #d4d4d4;
      margin: 0;
    }
    .header {
      border-bottom: 2px solid #16825d;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h1 {
      margin: 0;
      color: #16825d;
    }
    .placeholder-note {
      background: #2d2d30;
      border-left: 4px solid #ffa500;
      padding: 15px;
      margin: 20px 0;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .hop-card {
      background: #252526;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #16825d;
    }
    .hop-card.pending { border-left-color: #ffa500; }
    .hop-card.in-progress { border-left-color: #007acc; }
    .hop-card.completed { border-left-color: #16825d; }
    .hop-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .status-pending { background: #ffa500; color: #000; }
    .status-in-progress { background: #007acc; color: #fff; }
    .status-completed { background: #16825d; color: #fff; }
    .hop-title {
      font-size: 18px;
      font-weight: bold;
      margin: 10px 0;
    }
    .hop-meta {
      font-size: 12px;
      color: #858585;
      margin-top: 10px;
    }
    .data-preview {
      background: #1e1e1e;
      padding: 15px;
      border-radius: 4px;
      overflow: auto;
      max-height: 300px;
    }
    pre {
      margin: 0;
      color: #ce9178;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Hop Dashboard</h1>
    <p>Real-time phase progress, LOC budgets, and CTS compliance</p>
  </div>

  <div class="placeholder-note">
    <strong>⚠️ Placeholder Renderer</strong>
    <p>React implementation pending (Task 6). This is a temporary renderer for testing.</p>
  </div>

  <h2>Hops Overview (${hops.length} hops)</h2>
  <div class="dashboard-grid">
    ${hops.map((hop: any, i: number) => {
      const status = hop.status || 'pending';
      return `
        <div class="hop-card ${status}">
          <span class="hop-status status-${status}">${status.toUpperCase()}</span>
          <div class="hop-title">${hop.name || `Hop ${i + 1}`}</div>
          <p>${hop.description || 'No description'}</p>
          <div class="hop-meta">
            <div>📝 LOC: ${hop.estimatedLOC || 'N/A'}</div>
            <div>🔗 Dependencies: ${hop.dependencies?.length || 0}</div>
          </div>
        </div>
      `;
    }).join('')}
  </div>

  <h2>Raw Data Preview</h2>
  <div class="data-preview">
    <pre>${JSON.stringify(data, null, 2).substring(0, 1000)}${JSON.stringify(data, null, 2).length > 1000 ? '\n...' : ''}</pre>
  </div>

  <script>
    // Placeholder for React dashboard
    console.log('[Hop Dashboard] Placeholder renderer loaded');
    console.log('[Hop Dashboard] Data:', ${JSON.stringify(data)});
    
    // Send ready message to extension
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'artifact_ready', artifactType: 'hop_dashboard' }, '*');
    }
  </script>
</body>
</html>
    `.trim();
  }
}
