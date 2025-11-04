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
export function generateReport(
  results: RuleResult[],
  metrics: ProjectMetrics
): AuditReport {
  // Collect all violations
  const violations = results.flatMap((r) => r.violations);

  // Calculate category scores
  const categoryScores: CategoryScores = {
    cts: calculateCategoryScore(
      results.filter((r) => r.rule.category === 'cts')
    ),
    code_quality: calculateCategoryScore(
      results.filter((r) => r.rule.category === 'code_quality')
    ),
    project_structure: calculateCategoryScore(
      results.filter((r) => r.rule.category === 'project_structure')
    ),
  };

  // Overall score (weighted average)
  const overallScore =
    (categoryScores.cts * 0.4 +
      categoryScores.code_quality * 0.4 +
      categoryScores.project_structure * 0.2);

  // Count violations by severity
  const summary = {
    totalViolations: violations.length,
    errorCount: violations.filter((v) => v.severity === 'error').length,
    warningCount: violations.filter((v) => v.severity === 'warning').length,
    infoCount: violations.filter((v) => v.severity === 'info').length,
  };

  // Count violations by rule
  const violationsByRule: Record<string, number> = {};
  for (const result of results) {
    violationsByRule[result.rule.id] = result.violations.length;
  }

  // Generate recommendations
  const recommendations = generateRecommendations(results);

  return {
    overallScore,
    categoryScores,
    violations,
    violationsByRule,
    recommendations,
    metrics,
    summary,
  };
}

/**
 * Calculate score for a category (0-100)
 */
function calculateCategoryScore(results: RuleResult[]): number {
  if (results.length === 0) return 100;

  // Average the individual rule scores
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  return totalScore / results.length;
}

/**
 * Generate actionable recommendations based on violations
 */
function generateRecommendations(results: RuleResult[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const result of results) {
    if (result.violations.length === 0) continue;

    const affectedFiles = [
      ...new Set(result.violations.map((v) => v.file)),
    ].filter((f) => f !== '');

    switch (result.rule.id) {
      case 'cts_file_size':
        recommendations.push({
          priority: 'high',
          action: `Split ${affectedFiles.length} large file(s) into smaller modules (CTS limit: 500 lines)`,
          affectedFiles,
          estimatedEffort: 'medium',
          ruleId: result.rule.id,
        });
        break;

      case 'cts_signal_first':
        recommendations.push({
          priority: 'medium',
          action: `Add signals to ${affectedFiles.length} class(es) for signal-first architecture`,
          affectedFiles,
          estimatedEffort: 'low',
          ruleId: result.rule.id,
        });
        break;

      case 'type_hints':
        recommendations.push({
          priority: 'medium',
          action: `Add type hints to ${result.violations.length} function(s) for better type safety`,
          affectedFiles,
          estimatedEffort: 'low',
          ruleId: result.rule.id,
        });
        break;

      case 'error_handling':
        recommendations.push({
          priority: 'high',
          action: `Add error handling (assertions, null checks) to ${affectedFiles.length} file(s)`,
          affectedFiles,
          estimatedEffort: 'medium',
          ruleId: result.rule.id,
        });
        break;

      case 'complexity':
        recommendations.push({
          priority: 'high',
          action: `Refactor ${result.violations.length} complex function(s) (complexity > 10)`,
          affectedFiles,
          estimatedEffort: 'high',
          ruleId: result.rule.id,
        });
        break;

      case 'naming_conventions':
        recommendations.push({
          priority: 'low',
          action: `Update ${result.violations.length} identifier(s) to follow snake_case convention`,
          affectedFiles,
          estimatedEffort: 'low',
          ruleId: result.rule.id,
        });
        break;

      case 'addon_integration':
        recommendations.push({
          priority: 'medium',
          action: `Add plugin.cfg to ${affectedFiles.length} addon(s) for proper Godot integration`,
          affectedFiles,
          estimatedEffort: 'low',
          ruleId: result.rule.id,
        });
        break;

      case 'directory_organization':
        recommendations.push({
          priority: 'low',
          action: 'Reorganize project structure using standard directories (scripts/, scenes/, assets/)',
          affectedFiles: [],
          estimatedEffort: 'medium',
          ruleId: result.rule.id,
        });
        break;

      case 'cts_template_usage':
        recommendations.push({
          priority: 'low',
          action: `Apply CTS templates to ${affectedFiles.length} file(s) for consistency`,
          affectedFiles,
          estimatedEffort: 'low',
          ruleId: result.rule.id,
        });
        break;

      case 'cts_hop_size':
        // Info only, no action needed
        break;
    }
  }

  // Sort by priority (critical > high > medium > low)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return recommendations;
}

/**
 * Format audit report as markdown
 */
export function formatMarkdown(report: AuditReport): string {
  const lines: string[] = [];

  // Header
  lines.push('# 📊 CTS Audit Report\n');
  lines.push(
    `**Overall Score:** ${report.overallScore.toFixed(1)}/100 ${getScoreEmoji(report.overallScore)}\n`
  );

  // Category Scores
  lines.push('## Category Scores\n');
  lines.push('| Category | Score | Status |');
  lines.push('|----------|-------|--------|');
  lines.push(
    `| CTS Compliance | ${report.categoryScores.cts.toFixed(1)}/100 | ${getScoreEmoji(report.categoryScores.cts)} |`
  );
  lines.push(
    `| Code Quality | ${report.categoryScores.code_quality.toFixed(1)}/100 | ${getScoreEmoji(report.categoryScores.code_quality)} |`
  );
  lines.push(
    `| Project Structure | ${report.categoryScores.project_structure.toFixed(1)}/100 | ${getScoreEmoji(report.categoryScores.project_structure)} |\n`
  );

  // Summary
  lines.push('## Summary\n');
  lines.push(`- **Total Violations:** ${report.summary.totalViolations}`);
  lines.push(`- **Errors:** 🔴 ${report.summary.errorCount}`);
  lines.push(`- **Warnings:** 🟠 ${report.summary.warningCount}`);
  lines.push(`- **Info:** 🔵 ${report.summary.infoCount}\n`);

  // Metrics
  lines.push('## Project Metrics\n');
  lines.push(`- **Total Files:** ${report.metrics.files.total}`);
  lines.push(`- **GDScript Files:** ${report.metrics.files.gdscript}`);
  lines.push(`- **Total LOC:** ${report.metrics.loc.total.toLocaleString()}`);
  lines.push(`- **Average LOC/File:** ${report.metrics.loc.average}`);
  lines.push(`- **Average Complexity:** ${report.metrics.complexity.average}`);
  lines.push(
    `- **Max Complexity:** ${report.metrics.complexity.max} (${report.metrics.complexity.maxFile})`
  );
  lines.push(`- **Test Coverage:** ${report.metrics.testCoverage}%\n`);

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('## 🎯 Recommendations\n');
    for (let i = 0; i < report.recommendations.length; i++) {
      const rec = report.recommendations[i];
      const emoji = getPriorityEmoji(rec.priority);
      lines.push(`### ${i + 1}. ${emoji} ${rec.action}`);
      lines.push(`- **Priority:** ${rec.priority}`);
      lines.push(`- **Effort:** ${rec.estimatedEffort}`);
      if (rec.affectedFiles.length > 0) {
        lines.push(
          `- **Affected Files:** ${Math.min(rec.affectedFiles.length, 5)} file(s)`
        );
      }
      lines.push('');
    }
  }

  // Top Violations
  if (report.violations.length > 0) {
    lines.push('## ⚠️ Top Violations\n');
    const topViolations = report.violations.slice(0, 10);
    for (const violation of topViolations) {
      const emoji = getSeverityEmoji(violation.severity);
      lines.push(`${emoji} **${violation.file}:${violation.line}**`);
      lines.push(`   ${violation.message}\n`);
    }
  }

  return lines.join('\n');
}

/**
 * Get emoji for score range
 */
function getScoreEmoji(score: number): string {
  if (score >= 90) return '✅ Excellent';
  if (score >= 75) return '✔️ Good';
  if (score >= 60) return '⚠️ Fair';
  return '❌ Needs Improvement';
}

/**
 * Get emoji for priority
 */
function getPriorityEmoji(priority: RecommendationPriority): string {
  switch (priority) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🟠';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
  }
}

/**
 * Get emoji for severity
 */
function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'error':
      return '🔴';
    case 'warning':
      return '🟠';
    case 'info':
      return '🔵';
    default:
      return '⚪';
  }
}
