/**
 * Performance Trends Renderer
 * D3-based line/bar chart visualization of LOC, test count, and coverage trends
 */
import { ArtifactRenderer } from '../types.js';
export declare class PerformanceTrendRenderer implements ArtifactRenderer {
    readonly type = "performance_trends";
    render(data: unknown): Promise<string>;
}
//# sourceMappingURL=performance_trends.d.ts.map