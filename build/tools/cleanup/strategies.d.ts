/**
 * Cleanup Strategies
 *
 * Analysis strategies for detecting cleanup opportunities:
 * - Dead code detection (unused imports, unreferenced files)
 * - Duplicate file detection (hash-based comparison)
 */
export interface CleanupAction {
    type: 'remove_unused_imports' | 'duplicate_files' | 'unreferenced_file';
    file?: string;
    files?: string[];
    details?: string[];
    impact: 'low' | 'medium' | 'high';
    bytesFreed?: number;
}
export interface CleanupStrategy {
    name: string;
    analyze: (projectPath: string, exclusions: string[]) => Promise<CleanupAction[]>;
}
/**
 * Dead code detection strategy
 */
export declare const deadCodeStrategy: CleanupStrategy;
/**
 * Duplicate file detection strategy
 */
export declare const duplicateStrategy: CleanupStrategy;
/**
 * Get all available strategies
 */
export declare const STRATEGIES: Record<string, CleanupStrategy>;
//# sourceMappingURL=strategies.d.ts.map