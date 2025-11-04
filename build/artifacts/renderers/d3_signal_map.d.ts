/**
 * D3.js Signal Map Renderer
 * Force-directed graph visualization of EventBus/SignalBus connections
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
export declare class D3SignalMapRenderer implements ArtifactRenderer {
    readonly type = "signal_map";
    render(data: unknown): Promise<string>;
}
//# sourceMappingURL=d3_signal_map.d.ts.map