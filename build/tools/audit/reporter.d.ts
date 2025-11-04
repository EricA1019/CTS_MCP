/**
 * Audit Report Generator
 *
 * Generates comprehensive audit reports with:
 * - Compliance scoring (0-100 per category)
 * - Violation details (file, line, rule, severity)
 * - Actionable recommendations with effort estimates
 */
import type { Violation, ComplianceResult, ComplianceRule } from './checkers.js';
import type { ProjectMetrics } from './metrics.js';
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type EstimatedEffort = 'low' | 'medium' | 'high';
export interface Recommendation {
    priority: RecommendationPriority;
    action: string;
    affectedFiles: string[];
    estimatedEffort: EstimatedEffort;
    ruleId: string;
}
export interface CategoryScores {
    cts: number;
    code_quality: number;
    project_structure: number;
}
export interface AuditReport {
    overallScore: number;
    categoryScores: CategoryScores;
    violations: Violation[];
    violationsByRule: Record<string, number>;
    recommendations: Recommendation[];
    metrics: ProjectMetrics;
    summary: {
        totalViolations: number;
        errorCount: number;
        warningCount: number;
        infoCount: number;
    };
}
export interface RuleResult extends ComplianceResult {
    rule: ComplianceRule;
}
/**
 * Generate comprehensive audit report
 */
export declare function generateReport(results: RuleResult[], metrics: ProjectMetrics): AuditReport;
/**
 * Format audit report as markdown
 */
export declare function formatMarkdown(report: AuditReport): string;
//# sourceMappingURL=reporter.d.ts.map