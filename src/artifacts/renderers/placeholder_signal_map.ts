/**
 * Placeholder Signal Map Renderer
 * Returns simple HTML until D3 implementation is complete
 */

import { ArtifactRenderer } from '../types.js';

export class PlaceholderSignalMapRenderer implements ArtifactRenderer {
  readonly type = 'signal_map';

  async render(data: unknown): Promise<string> {
    const signals = Array.isArray(data) ? data : [];
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signal Map (Placeholder)</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: #1e1e1e;
      color: #d4d4d4;
      margin: 0;
    }
    .header {
      border-bottom: 2px solid #007acc;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h1 {
      margin: 0;
      color: #007acc;
    }
    .placeholder-note {
      background: #2d2d30;
      border-left: 4px solid #ffa500;
      padding: 15px;
      margin: 20px 0;
    }
    .signal-list {
      list-style: none;
      padding: 0;
    }
    .signal-item {
      background: #252526;
      padding: 10px;
      margin: 5px 0;
      border-radius: 4px;
      border-left: 3px solid #007acc;
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
    <h1>🗺️ Signal Map</h1>
    <p>Force-directed graph visualization of EventBus/SignalBus connections</p>
  </div>

  <div class="placeholder-note">
    <strong>⚠️ Placeholder Renderer</strong>
    <p>D3.js implementation pending (Task 5). This is a temporary renderer for testing.</p>
  </div>

  <h2>Signal Data (${signals.length} signals)</h2>
  <ul class="signal-list">
    ${signals.slice(0, 10).map((s: any, i: number) => `
      <li class="signal-item">
        <strong>Signal ${i + 1}:</strong> ${JSON.stringify(s).substring(0, 100)}...
      </li>
    `).join('')}
    ${signals.length > 10 ? `<li class="signal-item"><em>... and ${signals.length - 10} more</em></li>` : ''}
  </ul>

  <h2>Raw Data Preview</h2>
  <div class="data-preview">
    <pre>${JSON.stringify(data, null, 2).substring(0, 1000)}${JSON.stringify(data, null, 2).length > 1000 ? '\n...' : ''}</pre>
  </div>

  <script>
    // Placeholder for D3.js force simulation
    console.log('[Signal Map] Placeholder renderer loaded');
    console.log('[Signal Map] Data:', ${JSON.stringify(data)});
    
    // Send ready message to extension
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'artifact_ready', artifactType: 'signal_map' }, '*');
    }
  </script>
</body>
</html>
    `.trim();
  }
}
