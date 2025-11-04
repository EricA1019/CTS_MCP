/**
 * Parser Diagnostics and Regression Harness
 * 
 * Validates parser accuracy against ground truth fixtures to ensure
 * tree-sitter parser handles all edge cases that regex parser missed.
 * 
 * Design Pattern: Validator + Reporter
 * - Compare extracted signals against ground truth
 * - Calculate precision, recall, F1 metrics
 * - Generate diagnostic reports
 * 
 * @module tree_sitter_diagnostics
 */

import { SignalDefinition } from './gdscript_parser.js';
import { z } from 'zod';

/**
 * Zod schema for ground truth signal definitions.
 * Matches SignalDefinition structure but marks all fields as required.
 */
export const GroundTruthSignalSchema = z.object({
  name: z.string().min(1),
  params: z.array(z.string()),
  filePath: z.string().min(1),
  line: z.number().int().positive(),
  source: z.string().min(1),
  paramTypes: z.record(z.string(), z.string()).optional(),
});

/**
 * Ground truth dataset for a single test fixture.
 */
export const GroundTruthDatasetSchema = z.object({
  fixture: z.string().min(1),
  description: z.string(),
  expectedSignals: z.array(GroundTruthSignalSchema),
});

export type GroundTruthDataset = z.infer<typeof GroundTruthDatasetSchema>;

/**
 * Diagnostic result for a single fixture validation.
 */
export interface FixtureDiagnostic {
  /** Fixture name */
  fixture: string;
  /** True positives: correctly identified signals */
  truePositives: number;
  /** False positives: incorrectly identified signals */
  falsePositives: number;
  /** False negatives: missed signals */
  falseNegatives: number;
  /** Precision: TP / (TP + FP) */
  precision: number;
  /** Recall: TP / (TP + FN) */
  recall: number;
  /** F1 score: 2 * (precision * recall) / (precision + recall) */
  f1Score: number;
  /** Mismatched signals (details) */
  mismatches: SignalMismatch[];
}

/**
 * Signal mismatch details for debugging.
 */
export interface SignalMismatch {
  type: 'false_positive' | 'false_negative' | 'incorrect_params';
  signalName: string;
  expected?: SignalDefinition;
  actual?: SignalDefinition;
  details: string;
}

/**
 * Aggregate diagnostic result across all fixtures.
 */
export interface DiagnosticResult {
  /** Total fixtures validated */
  totalFixtures: number;
  /** Per-fixture diagnostics */
  fixtures: FixtureDiagnostic[];
  /** Aggregate precision */
  aggregatePrecision: number;
  /** Aggregate recall */
  aggregateRecall: number;
  /** Aggregate F1 score */
  aggregateF1: number;
  /** Total validation time in milliseconds */
  durationMs: number;
  /** Overall pass/fail status */
  passed: boolean;
}

/**
 * Parser Diagnostics class for regression testing.
 */
export class ParserDiagnostics {
  /**
   * Validate extracted signals against ground truth.
   * 
   * @param extracted - Signals extracted by parser
   * @param groundTruth - Expected signals from ground truth dataset
   * @returns Diagnostic result with accuracy metrics
   */
  validate(extracted: SignalDefinition[], groundTruth: GroundTruthDataset): FixtureDiagnostic {
    const expected = groundTruth.expectedSignals;
    const mismatches: SignalMismatch[] = [];

    // Normalize signals for comparison (remove absolute paths)
    const normalizeSignal = (sig: SignalDefinition) => ({
      name: sig.name,
      params: sig.params.slice().sort(),
      line: sig.line,
      source: sig.source.trim(),
    });

    const expectedNorm = expected.map(normalizeSignal);
    const extractedNorm = extracted.map(normalizeSignal);

    // Calculate true positives (exact matches)
    let truePositives = 0;
    const matchedExtracted = new Set<number>();
    const matchedExpected = new Set<number>();

    for (let i = 0; i < extractedNorm.length; i++) {
      for (let j = 0; j < expectedNorm.length; j++) {
        if (matchedExpected.has(j)) continue;
        
        const ext = extractedNorm[i];
        const exp = expectedNorm[j];
        
        if (ext.name === exp.name && 
            ext.line === exp.line &&
            JSON.stringify(ext.params) === JSON.stringify(exp.params)) {
          truePositives++;
          matchedExtracted.add(i);
          matchedExpected.add(j);
          break;
        }
      }
    }

    // Calculate false positives (extracted but not in ground truth)
    const falsePositives = extractedNorm.length - truePositives;
    for (let i = 0; i < extracted.length; i++) {
      if (!matchedExtracted.has(i)) {
        mismatches.push({
          type: 'false_positive',
          signalName: extracted[i].name,
          actual: extracted[i],
          details: `Signal "${extracted[i].name}" at line ${extracted[i].line} not in ground truth`,
        });
      }
    }

    // Calculate false negatives (in ground truth but not extracted)
    const falseNegatives = expectedNorm.length - truePositives;
    for (let j = 0; j < expected.length; j++) {
      if (!matchedExpected.has(j)) {
        mismatches.push({
          type: 'false_negative',
          signalName: expected[j].name,
          expected: expected[j],
          details: `Signal "${expected[j].name}" at line ${expected[j].line} missing from extraction`,
        });
      }
    }

    // Calculate metrics
    const precision = truePositives + falsePositives > 0 
      ? truePositives / (truePositives + falsePositives) 
      : 1.0;
    const recall = truePositives + falseNegatives > 0
      ? truePositives / (truePositives + falseNegatives)
      : 1.0;
    const f1Score = precision + recall > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0.0;

    return {
      fixture: groundTruth.fixture,
      truePositives,
      falsePositives,
      falseNegatives,
      precision,
      recall,
      f1Score,
      mismatches,
    };
  }

  /**
   * Validate multiple fixtures and calculate aggregate metrics.
   * 
   * @param results - Array of fixture validations
   * @param durationMs - Total validation time
   * @returns Aggregate diagnostic result
   */
  aggregateDiagnostics(results: FixtureDiagnostic[], durationMs: number): DiagnosticResult {
    const totalTP = results.reduce((sum, r) => sum + r.truePositives, 0);
    const totalFP = results.reduce((sum, r) => sum + r.falsePositives, 0);
    const totalFN = results.reduce((sum, r) => sum + r.falseNegatives, 0);

    const aggregatePrecision = totalTP + totalFP > 0 
      ? totalTP / (totalTP + totalFP) 
      : 1.0;
    const aggregateRecall = totalTP + totalFN > 0
      ? totalTP / (totalTP + totalFN)
      : 1.0;
    const aggregateF1 = aggregatePrecision + aggregateRecall > 0
      ? 2 * (aggregatePrecision * aggregateRecall) / (aggregatePrecision + aggregateRecall)
      : 0.0;

    // Pass if all fixtures have 100% accuracy (F1 = 1.0)
    const passed = results.every(r => r.f1Score === 1.0);

    return {
      totalFixtures: results.length,
      fixtures: results,
      aggregatePrecision,
      aggregateRecall,
      aggregateF1,
      durationMs,
      passed,
    };
  }

  /**
   * Format diagnostic result as human-readable report.
   * 
   * @param result - Diagnostic result to format
   * @returns Markdown-formatted diagnostic report
   */
  formatDiagnostics(result: DiagnosticResult): string {
    const lines: string[] = [];
    
    lines.push('# Parser Regression Diagnostic Report\n');
    lines.push(`**Generated**: ${new Date().toISOString()}\n`);
    lines.push(`**Total Fixtures**: ${result.totalFixtures}`);
    lines.push(`**Validation Time**: ${result.durationMs.toFixed(2)}ms\n`);
    
    lines.push('## Aggregate Metrics\n');
    lines.push(`- **Precision**: ${(result.aggregatePrecision * 100).toFixed(2)}%`);
    lines.push(`- **Recall**: ${(result.aggregateRecall * 100).toFixed(2)}%`);
    lines.push(`- **F1 Score**: ${(result.aggregateF1 * 100).toFixed(2)}%`);
    lines.push(`- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`);

    lines.push('## Per-Fixture Results\n');
    
    for (const fixture of result.fixtures) {
      const status = fixture.f1Score === 1.0 ? '✅' : '❌';
      lines.push(`### ${status} ${fixture.fixture}\n`);
      lines.push(`- **True Positives**: ${fixture.truePositives}`);
      lines.push(`- **False Positives**: ${fixture.falsePositives}`);
      lines.push(`- **False Negatives**: ${fixture.falseNegatives}`);
      lines.push(`- **Precision**: ${(fixture.precision * 100).toFixed(2)}%`);
      lines.push(`- **Recall**: ${(fixture.recall * 100).toFixed(2)}%`);
      lines.push(`- **F1 Score**: ${(fixture.f1Score * 100).toFixed(2)}%\n`);
      
      if (fixture.mismatches.length > 0) {
        lines.push('**Mismatches**:\n');
        for (const mismatch of fixture.mismatches) {
          lines.push(`- **${mismatch.type}**: ${mismatch.details}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
