/**
 * Bughunter Report Formatters
 *
 * Formats bug scan results into multiple output formats:
 * - JSON: Structured data for programmatic consumption
 * - Markdown: Human-readable report
 * - CTS Plan: Hop-based task format for Shrimp integration
 */
import { BugScanReport } from './scanner.js';
/**
 * Format bug report in specified format
 */
export declare function formatReport(report: BugScanReport, format: 'json' | 'markdown' | 'cts_plan'): string;
//# sourceMappingURL=reporter.d.ts.map