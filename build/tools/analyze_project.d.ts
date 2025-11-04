/**
 * CTS Analyze Project Tool
 * Comprehensive signal intelligence analysis using Phase 3 components
 *
 * NOTE: This tool currently uses TreeSitterBridge (native bindings).
 * Migration to WASM parser (utils/tree_sitter.ts) is planned for future releases.
 * See: docs/mcp_upgrade_plan.md Tier 1 Task 3
 */
import { ToolDefinition, ToolHandler } from '../types.js';
export declare const analyzeProjectTool: ToolDefinition;
/**
 * Create tool handler
 */
export declare function createAnalyzeProjectHandler(): ToolHandler;
//# sourceMappingURL=analyze_project.d.ts.map