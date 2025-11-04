/**
 * Audit Compliance Checkers
 *
 * Rule-based compliance checking for CTS standards, code quality, and project structure.
 * Categories:
 * - CTS: File size, hop size, signal-first architecture
 * - Code Quality: Type hints, error handling, complexity
 * - Project Structure: Template usage, addon integration
 */
import type { CTSRuleThresholds } from '../../config/config_loader.js';
export type ComplianceCategory = 'cts' | 'code_quality' | 'project_structure';
export type ViolationSeverity = 'error' | 'warning' | 'info';
export interface Violation {
    file: string;
    line: number;
    severity: ViolationSeverity;
    message: string;
}
export interface ComplianceResult {
    passed: boolean;
    violations: Violation[];
    score: number;
}
export interface AuditContext {
    projectPath: string;
    files: string[];
    config?: CTSRuleThresholds;
}
export interface ComplianceRule {
    id: string;
    name: string;
    category: ComplianceCategory;
    description: string;
    check: (context: AuditContext) => Promise<ComplianceResult>;
}
/**
 * All available compliance rules
 */
export declare const ALL_RULES: ComplianceRule[];
/**
 * Get rules by category
 */
export declare function getRulesByCategory(category: ComplianceCategory): ComplianceRule[];
//# sourceMappingURL=checkers.d.ts.map