/**
 * CTS MCP Server
 * Handles MCP protocol over stdio transport
 */
import { MCPResponse, ToolDefinition, ToolHandler, Resource, ResourceContents, PromptTemplate } from './types.js';
export declare class CTSMCPServer {
    private tools;
    private resources;
    private prompts;
    private resourceContentProvider?;
    private readonly serverName;
    private readonly serverVersion;
    private readonly protocolVersion;
    private artifactEngine;
    constructor();
    /**
     * Handle incoming MCP request
     */
    handleMessage(rawMessage: unknown): Promise<MCPResponse>;
    /**
     * Handle initialize request
     */
    private handleInitialize;
    /**
     * Handle tools/list request
     */
    private handleToolsList;
    /**
     * Handle tools/call request
     */
    private handleToolCall;
    /**
     * Register a tool with the server
     */
    registerTool(definition: ToolDefinition, handler: ToolHandler): void;
    /**
     * Register a resource with the server
     */
    registerResource(uri: string, resource: Resource): void;
    /**
     * Set the resource content provider (e.g., PromptLoader)
     */
    setResourceContentProvider(provider: (uri: string) => Promise<ResourceContents>): void;
    /**
     * Register a prompt template with the server
     */
    registerPrompt(name: string, template: PromptTemplate): void;
    /**
     * Handle prompts/list request
     */
    private handlePromptsList;
    /**
     * Handle prompts/get request
     */
    private handlePromptsGet;
    /**
     * Handle resources/list request
     */
    private handleResourcesList;
    /**
     * Handle resources/read request
     */
    private handleResourceRead;
    /**
     * Handle cts/metrics request (custom endpoint for performance monitoring)
     */
    private handleMetrics;
    /**
     * Create successful response
     */
    private createResponse;
    /**
     * Create error response
     */
    private createErrorResponse;
}
//# sourceMappingURL=server.d.ts.map