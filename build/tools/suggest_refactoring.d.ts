/**
 * CTS Suggest Refactoring Tool
 * AI-powered refactoring suggestions for signal names
 *
 * NOTE: This tool currently uses TreeSitterBridge (native bindings).
 * Migration to WASM parser (utils/tree_sitter.ts) is planned for future releases.
 * See: docs/mcp_upgrade_plan.md Tier 1 Task 3
 */
import { ToolDefinition, ToolHandler } from '../types.js';
export declare const suggestRefactoringTool: ToolDefinition;
/**
 * Create tool handler
 */
export declare function createSuggestRefactoringHandler(): ToolHandler;
//# sourceMappingURL=suggest_refactoring.d.ts.map