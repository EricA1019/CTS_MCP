/**
 * MCP Protocol Types
 * Based on Model Context Protocol specification
 */
export interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: Record<string, unknown>;
}
export interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: unknown;
    error?: MCPError;
}
export interface MCPError {
    code: number;
    message: string;
    data?: unknown;
}
export interface ServerInfo {
    name: string;
    version: string;
}
export interface ServerCapabilities {
    tools?: Record<string, unknown>;
    resources?: Record<string, unknown>;
    prompts?: Record<string, unknown>;
}
export interface InitializeResult {
    protocolVersion: string;
    serverInfo: ServerInfo;
    capabilities: ServerCapabilities;
}
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}
export interface ToolCallParams {
    name: string;
    arguments?: Record<string, unknown>;
}
export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;
/**
 * MCP Resource Types
 * Based on MCP 2024-11-05 specification
 */
export interface Resource {
    uri: string;
    name: string;
    description?: string;
    mimeType: string;
}
export interface ResourceContents {
    uri: string;
    mimeType: string;
    text?: string;
    blob?: string;
}
export interface ResourceReadParams {
    uri: string;
}
/**
 * MCP Prompt Types
 * Based on MCP 2024-11-05 specification
 */
export interface PromptMessage {
    role: 'user' | 'assistant';
    content: {
        type: 'text';
        text: string;
    };
}
export interface ArgumentSchema {
    name: string;
    description: string;
    required?: boolean;
}
export interface PromptInfo {
    name: string;
    description: string;
    arguments?: ArgumentSchema[];
}
export interface PromptTemplate extends PromptInfo {
    render(args: Record<string, unknown>): {
        description: string;
        messages: PromptMessage[];
    };
}
export interface PromptGetParams {
    name: string;
    arguments?: Record<string, unknown>;
}
export interface PromptGetResult {
    description: string;
    messages: PromptMessage[];
}
//# sourceMappingURL=types.d.ts.map