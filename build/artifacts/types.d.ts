/**
 * Artifact Renderer Interface
 * Contract for all artifact renderers
 */
export interface ArtifactRenderer {
    /**
     * Artifact type identifier (e.g., 'signal_map', 'hop_dashboard')
     */
    readonly type: string;
    /**
     * Render artifact data to HTML
     * @param data Artifact-specific data to render
     * @returns HTML string with embedded scripts and styles
     */
    render(data: unknown): Promise<string>;
}
export interface ArtifactMetadata {
    type: string;
    title: string;
    description?: string;
    timestamp: number;
}
export interface ArtifactCacheEntry {
    metadata: ArtifactMetadata;
    html: string;
    dataHash: string;
    /** Schema version for cache invalidation (optional for Phase 1 compatibility) */
    schemaVersion?: string;
}
//# sourceMappingURL=types.d.ts.map