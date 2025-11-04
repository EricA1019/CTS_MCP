/**
 * Dependency Graph Renderer
 * DAG-based visualization of hop, task, and file dependencies
 * Highlights critical paths and enables interactive exploration
 */
import { ArtifactRenderer } from '../types.js';
export declare class DependencyGraphRenderer implements ArtifactRenderer {
    readonly type = "dependency_graph";
    render(data: unknown): Promise<string>;
}
//# sourceMappingURL=dependency_graph.d.ts.map