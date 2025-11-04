/**
 * Audit Metrics Collection
 *
 * Collects project-wide metrics:
 * - Lines of Code (LOC)
 * - Cyclomatic Complexity
 * - File counts
 * - Test coverage (placeholder)
 */
export interface ProjectMetrics {
    loc: {
        total: number;
        byFile: Record<string, number>;
        average: number;
    };
    complexity: {
        total: number;
        byFile: Record<string, number>;
        average: number;
        max: number;
        maxFile: string;
    };
    files: {
        total: number;
        gdscript: number;
        scenes: number;
        resources: number;
    };
    testCoverage: number;
}
/**
 * Collect comprehensive project metrics
 */
export declare function collectMetrics(projectPath: string, files: string[]): Promise<ProjectMetrics>;
/**
 * Calculate file-level complexity breakdown
 */
export declare function getComplexityBreakdown(metrics: ProjectMetrics): {
    low: number;
    medium: number;
    high: number;
};
/**
 * Get top N most complex files
 */
export declare function getTopComplexFiles(metrics: ProjectMetrics, n?: number): Array<{
    file: string;
    complexity: number;
}>;
/**
 * Get top N largest files
 */
export declare function getTopLargestFiles(metrics: ProjectMetrics, n?: number): Array<{
    file: string;
    loc: number;
}>;
//# sourceMappingURL=metrics.d.ts.map