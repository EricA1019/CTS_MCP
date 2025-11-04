/**
 * Artifact Engine
 * Routes artifact types to appropriate renderers and manages caching
 */
import { ArtifactRenderer, ArtifactMetadata } from './types.js';
import { ArtifactVersionRegistry } from './artifact_metadata.js';
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
    errors: Array<{
        type: string;
        message: string;
        timestamp: number;
    }>;
    timeouts: number;
}
export declare class ArtifactEngine {
    private renderers;
    private cache;
    private readonly maxCacheSize;
    private registry;
    /**
     * Performance metrics tracking
     */
    private metrics;
    /**
     * Default render timeout (5 seconds)
     */
    private readonly renderTimeout;
    /**
     * Register a renderer for a specific artifact type
     */
    registerRenderer(renderer: ArtifactRenderer, version?: string): void;
    /**
     * Get all registered renderer types
     */
    getRegisteredTypes(): string[];
    /**
     * Check if a renderer exists for a type
     */
    hasRenderer(type: string): boolean;
    /**
     * Render an artifact with caching, timeout enforcement, and performance tracking
     */
    renderArtifact(type: string, data: unknown, metadata?: Partial<ArtifactMetadata>): Promise<{
        html: string;
        cached: boolean;
        metadata: ArtifactMetadata;
    }>;
    /**
     * Clear artifact cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
        types: Record<string, number>;
    };
    /**
     * Get performance metrics
     */
    getMetrics(): ArtifactMetrics;
    /**
     * Check if an artifact type requires tree-sitter
     */
    private requiresTreeSitter;
    /**
     * Ensure tree-sitter is initialized before rendering
     */
    private ensureTreeSitterInit;
    /**
     * Render with timeout enforcement
     */
    private renderWithTimeout;
    /**
     * Record performance metric
     */
    private recordMetric;
    /**
     * Record error for debugging
     */
    private recordError;
    /**
     * Render error placeholder when rendering fails
     */
    private renderErrorPlaceholder;
    /**
     * Get version registry (for testing and introspection)
     */
    getVersionRegistry(): ArtifactVersionRegistry;
    /**
     * Add entry to cache with LRU eviction
     */
    private addToCache;
    /**
     * Hash data for cache key generation
     */
    private hashData;
}
//# sourceMappingURL=artifact_engine.d.ts.map