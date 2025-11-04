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
import { globalCache } from '../cache/result-cache.js';
import { logger, metrics } from '../observability/index.js';

export interface WrapperOptions {
  toolName: string;
  cacheable?: boolean;
  bypassCacheParam?: string; // Parameter name to bypass cache (e.g., '_bypassCache')
}

/**
 * Wrap tool handler with caching and observability
 */
export function wrapToolHandler(
  handler: ToolHandler,
  options: WrapperOptions
): ToolHandler {
  const { toolName, cacheable = false, bypassCacheParam = '_bypassCache' } = options;

  return async (args: Record<string, unknown>) => {
    const startTime = performance.now();
    let success = true;
    let cacheHit = false;
    let result: any;

    try {
      // Check if cache should be bypassed
      const bypassCache = cacheable && args[bypassCacheParam] === true;
      delete args[bypassCacheParam]; // Remove from args before processing

      // Check cache if enabled and not bypassed
      if (cacheable && !bypassCache) {
        const cacheKey = globalCache.generateKey(toolName, args);
        result = globalCache.get(cacheKey);

        if (result !== undefined) {
          cacheHit = true;
          logger.debug('Cache hit', { tool: toolName, key: cacheKey });
        } else {
          logger.debug('Cache miss', { tool: toolName, key: cacheKey });
        }
      }

      // Execute tool if not cached
      if (result === undefined) {
        result = await handler(args);

        // Store in cache if cacheable
        if (cacheable && !bypassCache) {
          const cacheKey = globalCache.generateKey(toolName, args);
          globalCache.set(cacheKey, result);
          logger.debug('Result cached', { tool: toolName, key: cacheKey });
        }
      }

      // Add cache metadata to result
      if (cacheable && typeof result === 'object' && result !== null) {
        result.cached = cacheHit;
      }

      return result;
    } catch (error) {
      success = false;
      logger.error('Tool execution failed', {
        tool: toolName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      // Record metrics
      const duration = performance.now() - startTime;
      metrics.recordToolExecution(toolName, duration, success, cacheHit);

      logger.info('Tool executed', {
        tool: toolName,
        duration: Math.round(duration * 100) / 100,
        success,
        cacheHit: cacheable ? cacheHit : undefined,
      });
    }
  };
}

/**
 * Convenience function for cacheable tools
 */
export function withCache(toolName: string, handler: ToolHandler): ToolHandler {
  return wrapToolHandler(handler, { toolName, cacheable: true });
}

/**
 * Convenience function for non-cacheable tools
 */
export function withObservability(toolName: string, handler: ToolHandler): ToolHandler {
  return wrapToolHandler(handler, { toolName, cacheable: false });
}
