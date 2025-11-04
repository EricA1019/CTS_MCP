/**
 * Cleanup Safety Validation
 *
 * Pre-flight safety checks to prevent accidental data loss:
 * - Git working tree validation
 * - Critical file protection
 * - Pattern-based exclusion matching
 */
export interface SafetyConfig {
    requireCleanGit: boolean;
    dryRun: boolean;
    exclusions: string[];
    trashDir: string;
}
export interface SafetyCheck {
    name: string;
    passed: boolean;
    message: string;
}
export interface SafetyReport {
    allPassed: boolean;
    checks: SafetyCheck[];
}
/**
 * Validate project safety before cleanup operations
 */
export declare function validateSafety(projectPath: string, config: SafetyConfig): Promise<SafetyReport>;
/**
 * Check if a file path matches any exclusion pattern
 *
 * Uses minimatch for glob pattern matching:
 * - ** matches any directory depth
 * - * matches any characters except /
 * - ? matches a single character
 */
export declare function isExcluded(filePath: string, exclusions: string[]): boolean;
/**
 * Check if cleanup operation would delete critical files
 */
export declare function willDeleteCritical(criticalFiles: string[], exclusions: string[]): boolean;
/**
 * Format safety report for display
 */
export declare function formatSafetyReport(report: SafetyReport): string;
//# sourceMappingURL=safety.d.ts.map