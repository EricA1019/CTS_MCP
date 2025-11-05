/**
 * CTS MCP Server
 * Handles MCP protocol over stdio transport
 */

import { z } from 'zod';
import {
  MCPRequest,
  MCPResponse,
  MCPError,
  InitializeResult,
  ToolDefinition,
  ToolHandler,
  ToolCallParams,
  Resource,
  ResourceContents,
  ResourceReadParams,
  PromptTemplate,
  PromptInfo,
  PromptGetParams,
  PromptGetResult,
} from './types.js';
import { getConfig, formatConfig } from './config.js';
import { reasoningTool, createReasoningHandler } from './tools/reasoning/index.js';
import { bughunterTool, createBughunterHandler } from './tools/bughunter/index.js';
// TEMPORARILY DISABLED: CTS_Cleanup has sync/async file operation issues
// import { cleanupTool, createCleanupHandler } from './tools/cleanup/index.js';
import { auditTool, createAuditHandler } from './tools/audit/index.js';
import { MCPError as MCPErrorType, Errors } from './errors.js';
import { logger, Logger } from './logger.js';
import { withCache, withObservability } from './tools/tool-wrapper.js';
import {
  ctsExportToShrimpTool,
  ctsExportToShrimpHandler,
} from './tools/cts_export_to_shrimp.js';
import { ArtifactEngine } from './artifacts/artifact_engine.js';
import { PlaceholderSignalMapRenderer } from './artifacts/renderers/placeholder_signal_map.js';
import { PlaceholderHopDashboardRenderer } from './artifacts/renderers/placeholder_hop_dashboard.js';
import { DependencyGraphRenderer } from './artifacts/renderers/dependency_graph.js';
import { PerformanceTrendRenderer } from './artifacts/renderers/performance_trends.js';
import { D3HopDashboardRenderer } from './artifacts/renderers/d3_hop_dashboard.js';
import { InteractiveSignalMapRenderer } from './artifacts/renderers/interactive_signal_map.js';
import { MCPUIAdapter } from './adapters/mcp_ui_adapter.js';
import { renderArtifactTool, createRenderArtifactHandler } from './tools/render_artifact.js';
import { scanProjectSignalsTool, createScanSignalsHandler } from './tools/scan_project_signals.js';
import { analyzeProjectTool, createAnalyzeProjectHandler } from './tools/analyze_project.js';
import { suggestRefactoringTool, createSuggestRefactoringHandler } from './tools/suggest_refactoring.js';
import { getArtifactUpdatesTool, createGetArtifactUpdatesHandler } from './tools/realtime/get_artifact_updates.js';

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
  private tools: Map<string, { definition: ToolDefinition; handler: ToolHandler }> = new Map();
  private resources: Map<string, Resource> = new Map();
  private prompts: Map<string, PromptTemplate> = new Map();
  private resourceContentProvider?: (uri: string) => Promise<ResourceContents>;
  private readonly serverName = 'cts-mcp-server';
  private readonly serverVersion = '0.1.0';
  private readonly protocolVersion = '2024-11-05';
  private artifactEngine: ArtifactEngine;

  constructor() {
    // Load and validate configuration
    const config = getConfig();
    logger.info('[CTS MCP] Loading configuration...', {
      config: formatConfig(config)
    });

    // Initialize ArtifactEngine with conditional renderer registration
    this.artifactEngine = new ArtifactEngine();
    
    // Phase 3: Conditional renderer registration based on feature flag
    if (config.experimental.useMCPUI) {
      // Production D3-based renderers (Phase 3 complete)
      logger.info('[CTS MCP] Registering Phase 3 D3 renderers (CTS_EXPERIMENTAL_MCP_UI=true)');
      this.artifactEngine.registerRenderer(new InteractiveSignalMapRenderer());
      this.artifactEngine.registerRenderer(new D3HopDashboardRenderer());
      logger.info('[CTS MCP] ✅ InteractiveSignalMapRenderer registered');
      logger.info('[CTS MCP] ✅ D3HopDashboardRenderer registered');
    } else {
      // Legacy placeholder renderers (backward compatibility)
      logger.warn('[CTS MCP] Using placeholder renderers (CTS_EXPERIMENTAL_MCP_UI=false)');
      logger.warn('[CTS MCP] Enable production D3 renderers with: CTS_EXPERIMENTAL_MCP_UI=true');
      this.artifactEngine.registerRenderer(new PlaceholderSignalMapRenderer());
      this.artifactEngine.registerRenderer(new PlaceholderHopDashboardRenderer());
    }
    
    // MCP-UI adapter (supports both placeholder and production renderers)
    const mcpUIAdapter = new MCPUIAdapter();
    
    // Register MCP-UI wrapper renderers (backward compatibility)
    this.artifactEngine.registerRenderer({
      type: 'signal_map_mcp_ui',
      render: async (data: unknown): Promise<string> => {
        return mcpUIAdapter.createArtifact({
          artifactType: 'signal_map',
          data,
          metadata: {},
        });
      },
    });
    
    this.artifactEngine.registerRenderer({
      type: 'hop_dashboard_mcp_ui',
      render: async (data: unknown): Promise<string> => {
        return mcpUIAdapter.createArtifact({
          artifactType: 'hop_dashboard',
          data,
          metadata: {},
        });
      },
    });
    
    // Register other renderers (dependency graph, performance trends)
    this.artifactEngine.registerRenderer(new DependencyGraphRenderer());
    this.artifactEngine.registerRenderer(new PerformanceTrendRenderer());

    // Register built-in tools with caching and observability
    this.registerTool(ctsExportToShrimpTool, withObservability('CTS_Export_to_Shrimp', ctsExportToShrimpHandler));
    this.registerTool(renderArtifactTool, withCache('CTS_Render_Artifact', createRenderArtifactHandler(this.artifactEngine)));
    this.registerTool(scanProjectSignalsTool, withCache('CTS_Scan_Project_Signals', createScanSignalsHandler(this.artifactEngine)));
    
    // Phase 2 real-time update tool (no caching - always returns latest)
    this.registerTool(getArtifactUpdatesTool, withObservability('CTS_Get_Artifact_Updates', createGetArtifactUpdatesHandler()));
    
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
  async handleMessage(rawMessage: unknown): Promise<MCPResponse> {
    const startTime = Date.now();
    let requestId: string | number | null = null;
    let method: string | undefined;
    
    try {
      // Validate request structure
      const request = MCPRequestSchema.parse(rawMessage) as MCPRequest;
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
      
    } catch (error) {
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
        
        return this.createErrorResponse(
          requestId,
          error.code,
          error.message,
          error.data
        );
      }
      
      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        logger.error('Request validation failed', error, {
          requestId: requestId ?? undefined,
          method,
          duration,
        });
        
        return this.createErrorResponse(
          requestId,
          Errors.invalidRequest().code,
          'Invalid request structure',
          error.errors
        );
      }

      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Unexpected error handling message', error as Error, {
        requestId: requestId ?? undefined,
        method,
        duration,
      });
      
      return this.createErrorResponse(
        requestId,
        Errors.internalError(errorMessage, errorStack).code,
        `Internal error: ${errorMessage}`,
        { stack: errorStack }
      );
    }
  }

  /**
   * Handle initialize request
   */
  private async handleInitialize(): Promise<InitializeResult> {
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
  private async handleToolsList(): Promise<{ tools: ToolDefinition[] }> {
    const tools = Array.from(this.tools.values()).map(t => t.definition);
    return { tools };
  }

  /**
   * Handle tools/call request
   */
  private async handleToolCall(params: unknown): Promise<{ content: unknown[] }> {
    const startTime = Date.now();
    let toolName: string | undefined;
    
    try {
      const validated = ToolCallParamsSchema.parse(params) as ToolCallParams;
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
        return result as { content: unknown[] };
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
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Handle MCP errors
      if (error instanceof MCPErrorType) {
        if (toolName) {
          logger.toolError(toolName, error as Error, duration);
        }
        throw error; // Re-throw to be caught by handleMessage
      }
      
      // Handle tool execution errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const toolError = toolName 
        ? Errors.toolExecutionFailed(toolName, error as Error)
        : Errors.internalError(errorMessage);
      
      if (toolName) {
        logger.toolError(toolName, error as Error, duration);
      }
      
      throw toolError;
    }
  }

  /**
   * Register a tool with the server
   */
  registerTool(definition: ToolDefinition, handler: ToolHandler): void {
    this.tools.set(definition.name, { definition, handler });
    console.error(`[CTS MCP] Registered tool: ${definition.name}`);
  }

  /**
   * Register a resource with the server
   */
  registerResource(uri: string, resource: Resource): void {
    this.resources.set(uri, resource);
    console.error(`[CTS MCP] Registered resource: ${uri}`);
  }

  /**
   * Set the resource content provider (e.g., PromptLoader)
   */
  setResourceContentProvider(provider: (uri: string) => Promise<ResourceContents>): void {
    this.resourceContentProvider = provider;
  }

  /**
   * Register a prompt template with the server
   */
  registerPrompt(name: string, template: PromptTemplate): void {
    this.prompts.set(name, template);
    console.error(`[CTS MCP] Registered prompt: ${name}`);
  }

  /**
   * Handle prompts/list request
   */
  private async handlePromptsList(): Promise<{ prompts: PromptInfo[] }> {
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
  private async handlePromptsGet(params: unknown): Promise<PromptGetResult> {
    const validated = PromptGetParamsSchema.parse(params) as PromptGetParams;
    
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
  private async handleResourcesList(): Promise<{ resources: Resource[] }> {
    const resources = Array.from(this.resources.values());
    return { resources };
  }

  /**
   * Handle resources/read request
   */
  private async handleResourceRead(params: unknown): Promise<{ contents: [ResourceContents] }> {
    const validated = ResourceReadParamsSchema.parse(params) as ResourceReadParams;
    
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
  private async handleMetrics(): Promise<{
    artifact_engine: unknown;
    cache_stats: unknown;
    tree_sitter?: unknown;
  }> {
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
    } catch {
      // Tree-sitter not initialized or not available
      return metrics;
    }
  }

  /**
   * Create successful response
   */
  private createResponse(id: string | number, result: unknown): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown
  ): MCPResponse {
    const error: MCPError = { code, message };
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
