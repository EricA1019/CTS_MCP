/**
 * D3.js Clustered Signal Map Renderer
 * Force-directed graph with community detection clustering for large networks (150+ nodes)
 */
import { ArtifactRenderer } from '../types.js';
import { SignalDefinition } from '../parsers/gdscript_parser.js';
export interface SignalMapData {
    signals: SignalDefinition[];
    projectPath: string;
    metadata?: {
        eventBusCount: number;
        signalBusCount: number;
    };
}
export declare class ClusteredSignalMapRenderer implements ArtifactRenderer {
    readonly type = "clustered_signal_map";
    render(data: unknown): Promise<string>;
    /**
     * Get the community detection script to embed in HTML
     */
    private getCommunityDetectionScript;
}
//# sourceMappingURL=d3_signal_map_v2.d.ts.map