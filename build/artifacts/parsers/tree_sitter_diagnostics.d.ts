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
export declare const GroundTruthSignalSchema: z.ZodObject<{
    name: z.ZodString;
    params: z.ZodArray<z.ZodString, "many">;
    filePath: z.ZodString;
    line: z.ZodNumber;
    source: z.ZodString;
    paramTypes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    line: number;
    params: string[];
    name: string;
    source: string;
    paramTypes?: Record<string, string> | undefined;
}, {
    filePath: string;
    line: number;
    params: string[];
    name: string;
    source: string;
    paramTypes?: Record<string, string> | undefined;
}>;
/**
 * Ground truth dataset for a single test fixture.
 */
export declare const GroundTruthDatasetSchema: z.ZodObject<{
    fixture: z.ZodString;
    description: z.ZodString;
    expectedSignals: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        params: z.ZodArray<z.ZodString, "many">;
        filePath: z.ZodString;
        line: z.ZodNumber;
        source: z.ZodString;
        paramTypes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        line: number;
        params: string[];
        name: string;
        source: string;
        paramTypes?: Record<string, string> | undefined;
    }, {
        filePath: string;
        line: number;
        params: string[];
        name: string;
        source: string;
        paramTypes?: Record<string, string> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    description: string;
    fixture: string;
    expectedSignals: {
        filePath: string;
        line: number;
        params: string[];
        name: string;
        source: string;
        paramTypes?: Record<string, string> | undefined;
    }[];
}, {
    description: string;
    fixture: string;
    expectedSignals: {
        filePath: string;
        line: number;
        params: string[];
        name: string;
        source: string;
        paramTypes?: Record<string, string> | undefined;
    }[];
}>;
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
export declare class ParserDiagnostics {
    /**
     * Validate extracted signals against ground truth.
     *
     * @param extracted - Signals extracted by parser
     * @param groundTruth - Expected signals from ground truth dataset
     * @returns Diagnostic result with accuracy metrics
     */
    validate(extracted: SignalDefinition[], groundTruth: GroundTruthDataset): FixtureDiagnostic;
    /**
     * Validate multiple fixtures and calculate aggregate metrics.
     *
     * @param results - Array of fixture validations
     * @param durationMs - Total validation time
     * @returns Aggregate diagnostic result
     */
    aggregateDiagnostics(results: FixtureDiagnostic[], durationMs: number): DiagnosticResult;
    /**
     * Format diagnostic result as human-readable report.
     *
     * @param result - Diagnostic result to format
     * @returns Markdown-formatted diagnostic report
     */
    formatDiagnostics(result: DiagnosticResult): string;
}
//# sourceMappingURL=tree_sitter_diagnostics.d.ts.map