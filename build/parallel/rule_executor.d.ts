/**
 * Parallel Rule Executor
 *
 * Executes compliance rules in parallel using worker threads.
 * Features:
 * - Worker pool with max 4 workers
 * - Automatic rule distribution across workers
 * - Progress reporting (X/Y rules complete)
 * - Graceful crash recovery
 * - 3x+ speedup for 10+ rules
 */
import type { ComplianceRule, AuditContext } from '../tools/audit/checkers.js';
import type { RuleResult } from '../tools/audit/reporter.js';
interface ProgressCallback {
    (completed: number, total: number, ruleId: string): void;
}
/**
 * Execute rules in parallel using worker threads
 *
 * @param rules - Array of compliance rules to execute
 * @param context - Audit context (project path, files, config)
 * @param maxWorkers - Maximum concurrent workers (default: 4)
 * @param onProgress - Optional progress callback
 * @returns Array of rule results
 */
export declare function executeRulesParallel(rules: ComplianceRule[], context: AuditContext, maxWorkers?: number, onProgress?: ProgressCallback): Promise<RuleResult[]>;
/**
 * Determine if parallel execution should be used
 *
 * Heuristics:
 * - Less than 3 rules: Sequential (overhead not worth it)
 * - Less than 20 files: Sequential (small project)
 * - Otherwise: Parallel
 */
export declare function shouldUseParallel(ruleCount: number, fileCount: number): boolean;
export {};
//# sourceMappingURL=rule_executor.d.ts.map