/**
 * Bughunter Scanner
 *
 * Scans Godot projects for potential bugs using heuristic pattern matching.
 * Reuses ProjectScanner infrastructure for efficient file traversal.
 */
import { BugMatch } from './heuristics.js';
/**
 * Bug report for a single file
 */
export interface FileBugReport {
    file: string;
    bugCount: number;
    bugs: BugMatch[];
    severityBreakdown: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
}
/**
 * Complete bug scan report
 */
export interface BugScanReport {
    projectPath: string;
    totalFiles: number;
    totalBugs: number;
    overallScore: number;
    severityBreakdown: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    byFile: FileBugReport[];
    scanTimeMs: number;
}
/**
 * Scan project for potential bugs using heuristic analysis
 *
 * @param projectPath - Path to Godot project root
 * @param options - Scan options
 * @returns Bug scan report
 */
export declare function scanForBugs(projectPath: string, options?: {
    filePattern?: string;
    maxFiles?: number;
}): Promise<BugScanReport>;
/**
 * Get top N most problematic files
 */
export declare function getTopBuggyFiles(report: BugScanReport, topN?: number): FileBugReport[];
/**
 * Filter bugs by severity
 */
export declare function filterBySeverity(report: BugScanReport, minSeverity: 'low' | 'medium' | 'high' | 'critical'): BugMatch[];
//# sourceMappingURL=scanner.d.ts.map