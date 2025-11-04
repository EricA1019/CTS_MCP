/**
 * Performance Trend Data Pipeline
 * Aggregates LOC, test count, and coverage metrics from Git history
 */
import { TrendDataset } from '../schemas/trend_data_schema.js';
export declare class TrendDataPipeline {
    /**
     * Aggregate performance metrics from Git history
     * @param projectPath Path to Git repository
     * @param weeks Number of weeks to analyze (default 12)
     * @returns Time-series dataset with LOC, test count, and coverage
     */
    aggregateMetrics(projectPath: string, weeks?: number): Promise<TrendDataset>;
    /**
     * Generate dataset from current project snapshot (no Git history)
     */
    private generateSnapshotDataset;
    /**
     * Generate ISO week boundaries for time range
     */
    private generateWeekBoundaries;
    /**
     * Get Monday of the week containing given date at 00:00:00
     */
    private getMonday;
    /**
     * Get Git commits in date range
     */
    private getCommitsInRange;
    /**
     * Aggregate metrics per week from commits
     */
    private aggregateWeeklyMetrics;
    /**
     * Calculate LOC, test count, and coverage at specific commit
     */
    private calculateMetricsAtCommit;
    /**
     * Count lines of code (TypeScript/JavaScript files)
     */
    private countLinesOfCode;
    /**
     * Count test files and test cases
     */
    private countTests;
    /**
     * Estimate coverage percentage (simple heuristic: tests / LOC ratio)
     */
    private estimateCoverage;
    /**
     * Interpolate missing data points using linear interpolation
     */
    private interpolateMissingData;
    /**
     * Linear interpolation for missing data point
     */
    private interpolatePoint;
}
//# sourceMappingURL=trend_data_pipeline.d.ts.map