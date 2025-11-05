/**
 * MCP-UI Adapter
 * Wraps @mcp-ui/server createUIResource for CTS artifact rendering
 * 
 * Phase 1: Minimal implementation with placeholder HTML
 * Phase 2: Full @mcp-ui/server integration + real-time updates + theming
 */

import { ArtifactMetadata } from '../artifacts/types.js';
import { generatePollingScript } from '../realtime/polling_script.js';
import { ThemeManager } from '../artifacts/theming/index.js';
import { ExportCoordinator } from '../artifacts/export/index.js';

/**
 * Options for creating MCP-UI artifacts
 */
export interface MCPUIAdapterOptions {
  artifactType: 'signal_map' | 'hop_dashboard';
  data: unknown;
  metadata?: Partial<ArtifactMetadata>;
  /** Enable real-time polling (Phase 2) */
  realtime?: boolean;
  /** Polling interval in ms (default: 2000) */
  pollingInterval?: number;
  /** Theme name (Phase 2, default: 'dark') */
  theme?: string;
}

/**
 * Adapter for @mcp-ui/server artifact rendering
 * Converts CTS artifact types to MCP-UI resource format
 */
export class MCPUIAdapter {
  private themeManager: ThemeManager;
  private exportCoordinator: ExportCoordinator;
  
  constructor() {
    this.themeManager = new ThemeManager();
    this.exportCoordinator = new ExportCoordinator();
  }
  
  /**
   * Create UI artifact using @mcp-ui/server standard
   * 
   * @param options Artifact creation options
   * @returns HTML string for Claude Desktop webview
   */
  async createArtifact(options: MCPUIAdapterOptions): Promise<string> {
    const { artifactType, data, metadata, realtime = false, pollingInterval, theme = 'dark' } = options;
    
    // TODO: Phase 1 - Replace with actual @mcp-ui/server createUIResource call
    // For now, return deterministic placeholder HTML for testing wiring
    
    const title = metadata?.title || `${artifactType} visualization`;
    const description = metadata?.description || `MCP-UI ${artifactType} artifact`;
    const timestamp = new Date().toISOString();
    
    // Generate artifact ID for polling (use timestamp from metadata or current time)
    const artifactId = `${artifactType}_${metadata?.timestamp || Date.now()}`;
    
    // Generate theme CSS (Phase 2)
    const themeCSS = this.themeManager.generateThemeCSS(theme);
    const themeSwitcher = this.themeManager.generateThemeSwitcherHTML();
    
    // Generate export controls (Phase 2 - Task 5)
    const exportHTML = this.exportCoordinator.generateExportHTML();
    const exportStyles = this.exportCoordinator.generateExportStyles();
    
    const baseHTML = this.generatePlaceholderHTML(artifactType, title, description, timestamp, themeCSS, themeSwitcher, exportHTML, exportStyles);
    
    // Inject polling script if realtime enabled (Phase 2)
    if (realtime) {
      const pollingScript = generatePollingScript({
        artifactId,
        pollingInterval,
      });
      
      // Insert polling script before closing </body> tag
      return baseHTML.replace('</body>', `${pollingScript}\n</body>`);
    }
    
    return baseHTML;
  }  /**
   * Generate placeholder HTML for Phase 1 testing
   * 
   * @param artifactType Type of artifact (signal_map, hop_dashboard)
   * @param title Artifact title
   * @param description Artifact description
   * @param timestamp ISO timestamp
   * @param themeCSS Generated theme CSS (Phase 2)
   * @param themeSwitcher Generated theme switcher HTML (Phase 2)
   * @param exportHTML Generated export HTML (Phase 2 - Task 5)
   * @param exportStyles Generated export styles (Phase 2 - Task 5)
   * @returns Deterministic HTML string
   */
  private generatePlaceholderHTML(
    artifactType: string,
    title: string,
    description: string,
    timestamp: string,
    themeCSS: string = '',
    themeSwitcher: string = '',
    exportHTML: string = '',
    exportStyles: string = ''
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHTML(title)}</title>
  ${themeCSS}
  ${exportStyles}
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
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    
    .placeholder-container {
      max-width: 800px;
      padding: 40px;
      background: #252526;
      border-radius: 8px;
      border: 2px solid #007acc;
      text-align: center;
    }
    
    .placeholder-title {
      font-size: 24px;
      color: #007acc;
      margin-bottom: 20px;
    }
    
    .placeholder-description {
      font-size: 16px;
      color: #858585;
      margin-bottom: 30px;
    }
    
    .placeholder-info {
      background: #1e1e1e;
      padding: 20px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .placeholder-label {
      color: #4ec9b0;
      font-weight: bold;
    }
    
    .placeholder-value {
      color: #ce9178;
    }
    
    .placeholder-status {
      margin-top: 30px;
      padding: 15px;
      background: #1a472a;
      border-left: 4px solid #16825d;
      color: #16825d;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${themeSwitcher}
  <div id="artifact-container">
    <div class="placeholder-container">
    <h1 class="placeholder-title">🔧 MCP-UI Adapter - Phase 1 Placeholder</h1>
    <p class="placeholder-description">${this.escapeHTML(description)}</p>
    
    <div class="placeholder-info">
      <div><span class="placeholder-label">Artifact Type:</span> <span class="placeholder-value">${this.escapeHTML(artifactType)}</span></div>
      <div><span class="placeholder-label">Title:</span> <span class="placeholder-value">${this.escapeHTML(title)}</span></div>
      <div><span class="placeholder-label">Generated:</span> <span class="placeholder-value">${this.escapeHTML(timestamp)}</span></div>
      <div><span class="placeholder-label">Adapter:</span> <span class="placeholder-value">MCPUIAdapter v1.0.0</span></div>
    </div>
    
    <div class="placeholder-status">
      ✅ Adapter wiring successful - Ready for @mcp-ui/server integration
    </div>
    </div>
  </div>
  ${exportHTML}
</body>
</html>`;
  }
  
  /**
   * Escape HTML special characters to prevent XSS
   * 
   * @param text Text to escape
   * @returns Escaped HTML string
   */
  private escapeHTML(text: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    
    return text.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
  }
  
  /**
   * Map CTS artifact types to MCP-UI resource types
   * (Placeholder for Phase 2 implementation)
   * 
   * @param artifactType CTS artifact type
   * @returns MCP-UI resource type
   */
  private mapArtifactType(artifactType: string): string {
    const typeMap: Record<string, string> = {
      'signal_map': 'graph',
      'hop_dashboard': 'dashboard',
    };
    
    return typeMap[artifactType] || artifactType;
  }
  
  /**
   * Transform CTS data to MCP-UI format
   * (Placeholder for Phase 2 implementation)
   * 
   * @param data CTS artifact data
   * @param artifactType Artifact type
   * @returns Transformed data for MCP-UI
   */
  private transformData(data: unknown, artifactType: string): unknown {
    // Phase 1: Pass-through
    // Phase 2: Add transformation logic if @mcp-ui/server requires different schema
    return data;
  }
}
