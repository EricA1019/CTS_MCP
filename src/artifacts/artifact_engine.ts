/**
 * Artifact Engine
 * Routes artifact types to appropriate renderers and manages caching
 */

import { createHash } from 'crypto';
import { ArtifactRenderer, ArtifactMetadata, ArtifactCacheEntry } from './types.js';
import { ArtifactVersionRegistry, CacheTagger } from './artifact_metadata.js';
import { initTreeSitter, getMetrics as getParserMetrics } from '../utils/tree_sitter.js';

/**
 * Performance metrics for artifact rendering
 */
export interface ArtifactMetrics {
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  errors: Array<{ type: string; message: string; timestamp: number }>;
  timeouts: number;
}

export class ArtifactEngine {
  private renderers: Map<string, ArtifactRenderer> = new Map();
  private cache: Map<string, ArtifactCacheEntry> = new Map();
  private readonly maxCacheSize = 50; // Maximum cached artifacts
  private registry: ArtifactVersionRegistry = new ArtifactVersionRegistry();
  
  /**
   * Performance metrics tracking
   */
  private metrics: ArtifactMetrics = {
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    errors: [],
    timeouts: 0,
  };
  
  /**
   * Default render timeout (5 seconds)
   */
  private readonly renderTimeout = 5000;

  /**
   * Register a renderer for a specific artifact type
   */
  registerRenderer(renderer: ArtifactRenderer, version?: string): void {
    this.renderers.set(renderer.type, renderer);
    
    // Register version if provided
    if (version) {
      this.registry.registerVersion(renderer.type, version);
    }
    
    console.error(`[ArtifactEngine] Registered renderer: ${renderer.type}${version ? ` (v${version})` : ''}`);
  }

  /**
   * Get all registered renderer types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.renderers.keys());
  }

  /**
   * Check if a renderer exists for a type
   */
  hasRenderer(type: string): boolean {
    return this.renderers.has(type);
  }

  /**
   * Render an artifact with caching, timeout enforcement, and performance tracking
   */
  async renderArtifact(
    type: string,
    data: unknown,
    metadata?: Partial<ArtifactMetadata>
  ): Promise<{ html: string; cached: boolean; metadata: ArtifactMetadata }> {
    const startTime = Date.now();

    try {
      // Ensure tree-sitter is initialized if this renderer needs it
      if (this.requiresTreeSitter(type)) {
        await this.ensureTreeSitterInit();
      }

      // Validate renderer exists
      const renderer = this.renderers.get(type);
      if (!renderer) {
        throw new Error(`No renderer registered for artifact type: ${type}`);
      }

      // Create metadata
      const fullMetadata: ArtifactMetadata = {
        type,
        title: metadata?.title || `${type} Artifact`,
        description: metadata?.description,
        timestamp: Date.now(),
      };

      // Check cache
      const version = this.registry.getVersion(type);
      const cacheKey = CacheTagger.generateKey(type, data, version);
      const cached = this.cache.get(cacheKey);

      if (cached) {
        this.recordMetric('cacheHit', Date.now() - startTime);
        console.error(`[ArtifactEngine] Cache hit for ${type} (${Date.now() - startTime}ms)`);
        return {
          html: cached.html,
          cached: true,
          metadata: cached.metadata,
        };
      }

      // Render artifact with timeout enforcement
      console.error(`[ArtifactEngine] Rendering ${type}...`);
      const html = await this.renderWithTimeout(renderer, data, type);
      const renderTime = Date.now() - startTime;

      console.error(`[ArtifactEngine] Rendered ${type} in ${renderTime}ms`);

      // Update cache with version
      const dataHash = this.hashData(data);
      this.addToCache(cacheKey, {
        metadata: fullMetadata,
        html,
        dataHash,
        schemaVersion: version,
      });

      this.recordMetric('cacheMiss', renderTime);

      return {
        html,
        cached: false,
        metadata: fullMetadata,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordError(type, error instanceof Error ? error.message : String(error));
      
      // Fall back to error placeholder
      return this.renderErrorPlaceholder(type, error, metadata);
    }
  }

  /**
   * Clear artifact cache
   */
  clearCache(): void {
    this.cache.clear();
    console.error('[ArtifactEngine] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; types: Record<string, number> } {
    const types: Record<string, number> = {};
    
    for (const [key] of this.cache.entries()) {
      const type = key.split(':')[0];
      types[type] = (types[type] || 0) + 1;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      types,
    };
  }

  /**
   * Get performance metrics
   */
  getMetrics(): ArtifactMetrics {
    // Update derived metrics
    this.metrics.averageRenderTime = 
      this.metrics.renderCount > 0 
        ? this.metrics.totalRenderTime / this.metrics.renderCount 
        : 0;
    
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    this.metrics.cacheHitRate = 
      totalRequests > 0 
        ? this.metrics.cacheHits / totalRequests 
        : 0;
    
    return { ...this.metrics };
  }

  /**
   * Check if an artifact type requires tree-sitter
   */
  private requiresTreeSitter(type: string): boolean {
    // Types that need AST parsing
    const parserTypes = ['signal_diagram', 'code_flow', 'dependency_graph'];
    return parserTypes.includes(type);
  }

  /**
   * Ensure tree-sitter is initialized before rendering
   */
  private async ensureTreeSitterInit(): Promise<void> {
    try {
      await initTreeSitter();
      
      // Verify initialization succeeded by checking metrics
      const metrics = getParserMetrics();
      if (metrics.initTime === 0) {
        throw new Error('Tree-sitter metrics indicate failed initialization');
      }
    } catch (error) {
      console.error('[ArtifactEngine] Tree-sitter init failed:', error);
      throw new Error(`WASM initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render with timeout enforcement
   */
  private async renderWithTimeout(
    renderer: ArtifactRenderer,
    data: unknown,
    type: string
  ): Promise<string> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        this.metrics.timeouts++;
        reject(new Error(`Render timeout: ${type} exceeded ${this.renderTimeout}ms`));
      }, this.renderTimeout);
    });

    try {
      const html = await Promise.race([
        renderer.render(data),
        timeoutPromise,
      ]);
      return html;
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        throw error; // Re-throw timeout errors
      }
      throw new Error(`Render failed for ${type}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Record performance metric
   */
  private recordMetric(type: 'cacheHit' | 'cacheMiss', renderTime: number): void {
    this.metrics.renderCount++;
    this.metrics.totalRenderTime += renderTime;
    
    if (type === 'cacheHit') {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Record error for debugging
   */
  private recordError(type: string, message: string): void {
    this.metrics.errors.push({
      type,
      message,
      timestamp: Date.now(),
    });
    
    // Keep only last 20 errors
    if (this.metrics.errors.length > 20) {
      this.metrics.errors.shift();
    }
  }

  /**
   * Render error placeholder when rendering fails
   */
  private renderErrorPlaceholder(
    type: string,
    error: unknown,
    metadata?: Partial<ArtifactMetadata>
  ): { html: string; cached: false; metadata: ArtifactMetadata } {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const html = `
      <div style="padding: 20px; background: #fee; border: 2px solid #c33; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #c33;">⚠️ Artifact Rendering Failed</h3>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Error:</strong> ${errorMessage}</p>
        <p style="font-size: 0.9em; color: #666;">
          This artifact could not be rendered. Check the console for more details.
        </p>
      </div>
    `;
    
    return {
      html,
      cached: false,
      metadata: {
        type,
        title: metadata?.title || `Failed ${type} Artifact`,
        description: metadata?.description,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Get version registry (for testing and introspection)
   */
  getVersionRegistry(): ArtifactVersionRegistry {
    return this.registry;
  }

  /**
   * Add entry to cache with LRU eviction
   */
  private addToCache(key: string, entry: ArtifactCacheEntry): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, entry);
  }

  /**
   * Hash data for cache key generation
   */
  private hashData(data: unknown): string {
    const json = JSON.stringify(data);
    return createHash('sha256').update(json).digest('hex').substring(0, 16);
  }
}
