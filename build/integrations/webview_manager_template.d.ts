/**
 * Webview Manager Template
 *
 * This is a template/reference implementation for VS Code extension integration.
 * The actual webview manager will be implemented in a VS Code extension that
 * consumes this MCP server.
 *
 * Usage in VS Code Extension:
 * 1. Import this template as reference
 * 2. Implement using VS Code API (vscode.window.createWebviewPanel)
 * 3. Connect to MCP server via stdio transport
 * 4. Call MCP tools to get artifact HTML
 * 5. Display HTML in webview panel
 */
export interface WebviewManagerInterface {
    /**
     * Display artifact HTML in a webview panel
     * @param type Artifact type (signal_map, hop_dashboard)
     * @param html Rendered HTML from ArtifactEngine
     * @param metadata Artifact metadata
     */
    displayArtifact(type: string, html: string, metadata: ArtifactMetadata): Promise<void>;
    /**
     * Close webview panel for artifact type
     */
    closeArtifact(type: string): void;
    /**
     * Get active artifact types
     */
    getActiveArtifacts(): string[];
}
export interface ArtifactMetadata {
    type: string;
    title: string;
    description?: string;
    timestamp: number;
}
export interface WebviewMessage {
    type: string;
    payload?: unknown;
}
/**
 * Reference implementation (pseudocode for VS Code extension)
 *
 * class VSCodeWebviewManager implements WebviewManagerInterface {
 *   private panels: Map<string, vscode.WebviewPanel> = new Map();
 *
 *   async displayArtifact(type: string, html: string, metadata: ArtifactMetadata): Promise<void> {
 *     let panel = this.panels.get(type);
 *
 *     if (!panel) {
 *       // Create new webview panel
 *       panel = vscode.window.createWebviewPanel(
 *         `cts-artifact-${type}`,
 *         metadata.title,
 *         vscode.ViewColumn.Two,
 *         {
 *           enableScripts: true,
 *           retainContextWhenHidden: true,
 *         }
 *       );
 *
 *       // Handle disposal
 *       panel.onDidDispose(() => {
 *         this.panels.delete(type);
 *       });
 *
 *       // Handle messages from webview
 *       panel.webview.onDidReceiveMessage((msg: WebviewMessage) => {
 *         this.handleWebviewMessage(type, msg);
 *       });
 *
 *       this.panels.set(type, panel);
 *     }
 *
 *     // Update HTML content
 *     panel.webview.html = html;
 *     panel.reveal(vscode.ViewColumn.Two);
 *   }
 *
 *   closeArtifact(type: string): void {
 *     const panel = this.panels.get(type);
 *     if (panel) {
 *       panel.dispose();
 *       this.panels.delete(type);
 *     }
 *   }
 *
 *   getActiveArtifacts(): string[] {
 *     return Array.from(this.panels.keys());
 *   }
 *
 *   private handleWebviewMessage(type: string, msg: WebviewMessage): void {
 *     switch (msg.type) {
 *       case 'artifact_ready':
 *         console.log(`Artifact ${type} ready`);
 *         break;
 *
 *       case 'open_file':
 *         // Open file at specific line
 *         const { filePath, line } = msg.payload as any;
 *         vscode.workspace.openTextDocument(filePath).then(doc => {
 *           vscode.window.showTextDocument(doc, {
 *             selection: new vscode.Range(line, 0, line, 0)
 *           });
 *         });
 *         break;
 *
 *       case 'refresh_artifact':
 *         // Re-render artifact (call MCP server again)
 *         this.refreshArtifact(type);
 *         break;
 *     }
 *   }
 *
 *   private async refreshArtifact(type: string): Promise<void> {
 *     // Call MCP server to re-render artifact
 *     // Implementation depends on MCP client setup
 *   }
 * }
 */
export declare const WEBVIEW_MANAGER_IMPLEMENTATION_NOTES = "\nVS Code Extension Integration Steps:\n\n1. Create VS Code Extension Project:\n   - npm install -g yo generator-code\n   - yo code (select TypeScript extension)\n   - Add dependency: @modelcontextprotocol/sdk\n\n2. Connect to CTS MCP Server:\n   - Spawn MCP server process: child_process.spawn('node', ['cts_mcp/build/index.js'])\n   - Setup stdio transport for JSON-RPC communication\n   - Call tools via MCP protocol\n\n3. Implement Webview Manager:\n   - Use vscode.window.createWebviewPanel() for artifact display\n   - Handle webview lifecycle (creation, disposal, message passing)\n   - Implement message handlers for file navigation, refresh\n\n4. Register Commands:\n   - \"cts.showSignalMap\" - Display signal map artifact\n   - \"cts.showHopDashboard\" - Display hop dashboard artifact\n   - \"cts.exportToShrimp\" - Run CTS_Export_to_Shrimp tool\n\n5. Package Extension:\n   - vsce package\n   - Install .vsix in VS Code\n   - Test artifact rendering workflow\n";
//# sourceMappingURL=webview_manager_template.d.ts.map