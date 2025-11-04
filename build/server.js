/**
 * CTS MCP Server
 * Handles MCP protocol over stdio transport
 */
import { z } from 'zod';
import { getConfig, formatConfig } from './config.js';
import { reasoningTool, createReasoningHandler } from './tools/reasoning/index.js';
import { bughunterTool, createBughunterHandler } from './tools/bughunter/index.js';
// TEMPORARILY DISABLED: CTS_Cleanup has sync/async file operation issues
// import { cleanupTool, createCleanupHandler } from './tools/cleanup/index.js';
import { auditTool, createAuditHandler } from './tools/audit/index.js';
import { MCPError as MCPErrorType, Errors } from './errors.js';
import { logger } from './logger.js';
import { withCache, withObservability } from './tools/tool-wrapper.js';
import { ctsExportToShrimpTool, ctsExportToShrimpHandler, } from './tools/cts_export_to_shrimp.js';
import { ArtifactEngine } from './artifacts/artifact_engine.js';
import { D3SignalMapRenderer } from './artifacts/renderers/d3_signal_map.js';
import { ClusteredSignalMapRenderer } from './artifacts/renderers/d3_signal_map_v2.js';
import { ReactHopDashboardRenderer } from './artifacts/renderers/react_hop_dashboard.js';
import { DependencyGraphRenderer } from './artifacts/renderers/dependency_graph.js';
import { PerformanceTrendRenderer } from './artifacts/renderers/performance_trends.js';
import { renderArtifactTool, createRenderArtifactHandler } from './tools/render_artifact.js';
import { scanProjectSignalsTool, createScanSignalsHandler } from './tools/scan_project_signals.js';
import { analyzeProjectTool, createAnalyzeProjectHandler } from './tools/analyze_project.js';
import { suggestRefactoringTool, createSuggestRefactoringHandler } from './tools/suggest_refactoring.js';
// Zod schemas for validation
const MCPRequestSchema = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string(), z.number()]),
    method: z.string(),
    params: z.record(z.unknown()).optional(),
});
const ToolCallParamsSchema = z.object({
    name: z.string(),
    arguments: z.record(z.unknown()).optional(),
});
const ResourceReadParamsSchema = z.object({
    uri: z.string(),
});
const PromptGetParamsSchema = z.object({
    name: z.string(),
    arguments: z.record(z.unknown()).optional(),
});
export class CTSMCPServer {
    tools = new Map();
    resources = new Map();
    prompts = new Map();
    resourceContentProvider;
    serverName = 'cts-mcp-server';
    serverVersion = '0.1.0';
    protocolVersion = '2024-11-05';
    artifactEngine;
    constructor() {
        // Load and validate configuration
        const config = getConfig();
        logger.info('[CTS MCP] Loading configuration...', {
            config: formatConfig(config)
        });
        // Initialize ArtifactEngine with production renderers
        this.artifactEngine = new ArtifactEngine();
        this.artifactEngine.registerRenderer(new D3SignalMapRenderer());
        this.artifactEngine.registerRenderer(new ClusteredSignalMapRenderer());
        this.artifactEngine.registerRenderer(new ReactHopDashboardRenderer());
        this.artifactEngine.registerRenderer(new DependencyGraphRenderer());
        this.artifactEngine.registerRenderer(new PerformanceTrendRenderer());
        // Register built-in tools with caching and observability
        this.registerTool(ctsExportToShrimpTool, withObservability('CTS_Export_to_Shrimp', ctsExportToShrimpHandler));
        this.registerTool(renderArtifactTool, withCache('CTS_Render_Artifact', createRenderArtifactHandler(this.artifactEngine)));
        this.registerTool(scanProjectSignalsTool, withCache('CTS_Scan_Project_Signals', createScanSignalsHandler(this.artifactEngine)));
        // Phase 3 tools with caching
        this.registerTool(analyzeProjectTool, withCache('CTS_Analyze_Project', createAnalyzeProjectHandler()));
        this.registerTool(suggestRefactoringTool, withCache('CTS_Suggest_Refactoring', createSuggestRefactoringHandler()));
        // Tier 2B tools with observability
        this.registerTool(reasoningTool, withObservability('CTS_Reasoning', createReasoningHandler()));
        this.registerTool(bughunterTool, withCache('CTS_Bughunter', createBughunterHandler()));
        // TEMPORARILY DISABLED: CTS_Cleanup has sync/async file operation issues
        // this.registerTool(cleanupTool, withCache('CTS_Cleanup', createCleanupHandler()));
        this.registerTool(auditTool, withCache('CTS_Audit', createAuditHandler()));
    }
    /**
     * Handle incoming MCP request
     */
    async handleMessage(rawMessage) {
        const startTime = Date.now();
        let requestId = null;
        let method;
        try {
            // Validate request structure
            const request = MCPRequestSchema.parse(rawMessage);
            requestId = request.id;
            method = request.method;
            // Trace incoming request
            logger.traceRequest(requestId, method, request.params);
            let result;
            // Route to appropriate handler
            switch (request.method) {
                case 'initialize':
                    result = await this.handleInitialize();
                    break;
                case 'tools/list':
                    result = await this.handleToolsList();
                    break;
                case 'tools/call':
                    result = await this.handleToolCall(request.params);
                    break;
                case 'resources/list':
                    result = await this.handleResourcesList();
                    break;
                case 'resources/read':
                    result = await this.handleResourceRead(request.params);
                    break;
                case 'prompts/list':
                    result = await this.handlePromptsList();
                    break;
                case 'prompts/get':
                    result = await this.handlePromptsGet(request.params);
                    break;
                case 'cts/metrics':
                    result = await this.handleMetrics();
                    break;
                default:
                    throw Errors.methodNotFound(request.method);
            }
            const duration = Date.now() - startTime;
            logger.traceResponse(requestId, duration, true);
            return this.createResponse(request.id, result);
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // Handle MCP structured errors
            if (error instanceof MCPErrorType) {
                logger.warn('MCP error occurred', {
                    requestId: requestId ?? undefined,
                    method,
                    code: error.code,
                    message: error.message,
                    duration,
                });
                return this.createErrorResponse(requestId, error.code, error.message, error.data);
            }
            // Handle Zod validation errors
            if (error instanceof z.ZodError) {
                logger.error('Request validation failed', error, {
                    requestId: requestId ?? undefined,
                    method,
                    duration,
                });
                return this.createErrorResponse(requestId, Errors.invalidRequest().code, 'Invalid request structure', error.errors);
            }
            // Handle unexpected errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            logger.error('Unexpected error handling message', error, {
                requestId: requestId ?? undefined,
                method,
                duration,
            });
            return this.createErrorResponse(requestId, Errors.internalError(errorMessage, errorStack).code, `Internal error: ${errorMessage}`, { stack: errorStack });
        }
    }
    /**
     * Handle initialize request
     */
    async handleInitialize() {
        return {
            protocolVersion: this.protocolVersion,
            serverInfo: {
                name: this.serverName,
                version: this.serverVersion,
            },
            capabilities: {
                tools: {},
                resources: {},
                prompts: {},
                // Note: sampling is a CLIENT capability (servers request, clients execute)
                // We document this capability for reference but don't implement it server-side
            },
        };
    }
    /**
     * Handle tools/list request
     */
    async handleToolsList() {
        const tools = Array.from(this.tools.values()).map(t => t.definition);
        return { tools };
    }
    /**
     * Handle tools/call request
     */
    async handleToolCall(params) {
        const startTime = Date.now();
        let toolName;
        try {
            const validated = ToolCallParamsSchema.parse(params);
            toolName = validated.name;
            const tool = this.tools.get(validated.name);
            if (!tool) {
                throw Errors.toolNotFound(validated.name);
            }
            logger.toolStart(toolName, validated.arguments);
            const result = await tool.handler(validated.arguments || {});
            const duration = Date.now() - startTime;
            logger.toolComplete(toolName, duration, true);
            // Check if tool already returns MCP format { content: [...] }
            if (result && typeof result === 'object' && 'content' in result) {
                // Old Tier 2B format (already wrapped in MCP content)
                return result;
            }
            // New Tier 2C format - BaseToolResponse needs to be wrapped
            // All tools now return: { success, timestamp, toolName, duration_ms?, result }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            // Handle MCP errors
            if (error instanceof MCPErrorType) {
                if (toolName) {
                    logger.toolError(toolName, error, duration);
                }
                throw error; // Re-throw to be caught by handleMessage
            }
            // Handle tool execution errors
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const toolError = toolName
                ? Errors.toolExecutionFailed(toolName, error)
                : Errors.internalError(errorMessage);
            if (toolName) {
                logger.toolError(toolName, error, duration);
            }
            throw toolError;
        }
    }
    /**
     * Register a tool with the server
     */
    registerTool(definition, handler) {
        this.tools.set(definition.name, { definition, handler });
        console.error(`[CTS MCP] Registered tool: ${definition.name}`);
    }
    /**
     * Register a resource with the server
     */
    registerResource(uri, resource) {
        this.resources.set(uri, resource);
        console.error(`[CTS MCP] Registered resource: ${uri}`);
    }
    /**
     * Set the resource content provider (e.g., PromptLoader)
     */
    setResourceContentProvider(provider) {
        this.resourceContentProvider = provider;
    }
    /**
     * Register a prompt template with the server
     */
    registerPrompt(name, template) {
        this.prompts.set(name, template);
        console.error(`[CTS MCP] Registered prompt: ${name}`);
    }
    /**
     * Handle prompts/list request
     */
    async handlePromptsList() {
        const prompts = Array.from(this.prompts.values()).map(p => ({
            name: p.name,
            description: p.description,
            arguments: p.arguments,
        }));
        return { prompts };
    }
    /**
     * Handle prompts/get request
     */
    async handlePromptsGet(params) {
        const validated = PromptGetParamsSchema.parse(params);
        const prompt = this.prompts.get(validated.name);
        if (!prompt) {
            throw new Error(`Prompt not found: ${validated.name}`);
        }
        // Render the prompt with provided arguments
        const result = prompt.render(validated.arguments || {});
        return result;
    }
    /**
     * Handle resources/list request
     */
    async handleResourcesList() {
        const resources = Array.from(this.resources.values());
        return { resources };
    }
    /**
     * Handle resources/read request
     */
    async handleResourceRead(params) {
        const validated = ResourceReadParamsSchema.parse(params);
        const resource = this.resources.get(validated.uri);
        if (!resource) {
            throw new Error(`Resource not found: ${validated.uri}`);
        }
        if (!this.resourceContentProvider) {
            throw new Error('Resource content provider not configured');
        }
        const contents = await this.resourceContentProvider(validated.uri);
        return { contents: [contents] };
    }
    /**
     * Handle cts/metrics request (custom endpoint for performance monitoring)
     */
    async handleMetrics() {
        const metrics = {
            artifact_engine: this.artifactEngine.getMetrics(),
            cache_stats: this.artifactEngine.getCacheStats(),
        };
        // Try to include tree-sitter metrics if available
        try {
            const { getMetrics: getParserMetrics } = await import('./utils/tree_sitter.js');
            return {
                ...metrics,
                tree_sitter: getParserMetrics(),
            };
        }
        catch {
            // Tree-sitter not initialized or not available
            return metrics;
        }
    }
    /**
     * Create successful response
     */
    createResponse(id, result) {
        return {
            jsonrpc: '2.0',
            id,
            result,
        };
    }
    /**
     * Create error response
     */
    createErrorResponse(id, code, message, data) {
        const error = { code, message };
        if (data !== undefined) {
            error.data = data;
        }
        return {
            jsonrpc: '2.0',
            id: id ?? 0,
            error,
        };
    }
}
//# sourceMappingURL=server.js.map