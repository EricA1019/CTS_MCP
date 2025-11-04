/**
 * Tool Wrapper - Integrates Tier 2C Infrastructure
 *
 * Wraps tool handlers with:
 * - Result caching (Tier 2C.5)
 * - Observability (Tier 3.3)
 * - Configuration (Tier 2C.6)
 * - Error handling (Tier 2C.2)
 */
import { ToolHandler } from '../types.js';
export interface WrapperOptions {
    toolName: string;
    cacheable?: boolean;
    bypassCacheParam?: string;
}
/**
 * Wrap tool handler with caching and observability
 */
export declare function wrapToolHandler(handler: ToolHandler, options: WrapperOptions): ToolHandler;
/**
 * Convenience function for cacheable tools
 */
export declare function withCache(toolName: string, handler: ToolHandler): ToolHandler;
/**
 * Convenience function for non-cacheable tools
 */
export declare function withObservability(toolName: string, handler: ToolHandler): ToolHandler;
//# sourceMappingURL=tool-wrapper.d.ts.map