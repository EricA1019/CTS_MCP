/**
 * Tool Response Schemas
 * Standardized response formats for all CTS MCP tools
 */
import { z } from 'zod';
/**
 * Base response schema for all tools
 */
export declare const BaseToolResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    timestamp: string;
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: boolean;
    timestamp: string;
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Error response schema
 */
export declare const ErrorResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        category: z.ZodEnum<["VALIDATION", "PARSING", "EXECUTION", "FILESYSTEM", "CONFIGURATION", "NETWORK", "INTERNAL", "RESOURCE"]>;
        severity: z.ZodEnum<["ERROR", "WARNING", "INFO"]>;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        suggestions: z.ZodArray<z.ZodObject<{
            action: z.ZodString;
            details: z.ZodString;
            example: z.ZodOptional<z.ZodString>;
            documentationUrl: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            details: string;
            action: string;
            example?: string | undefined;
            documentationUrl?: string | undefined;
        }, {
            details: string;
            action: string;
            example?: string | undefined;
            documentationUrl?: string | undefined;
        }>, "many">;
        errorCode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        category: "VALIDATION" | "PARSING" | "EXECUTION" | "FILESYSTEM" | "CONFIGURATION" | "NETWORK" | "INTERNAL" | "RESOURCE";
        severity: "ERROR" | "INFO" | "WARNING";
        suggestions: {
            details: string;
            action: string;
            example?: string | undefined;
            documentationUrl?: string | undefined;
        }[];
        details?: Record<string, unknown> | undefined;
        errorCode?: string | undefined;
    }, {
        message: string;
        category: "VALIDATION" | "PARSING" | "EXECUTION" | "FILESYSTEM" | "CONFIGURATION" | "NETWORK" | "INTERNAL" | "RESOURCE";
        severity: "ERROR" | "INFO" | "WARNING";
        suggestions: {
            details: string;
            action: string;
            example?: string | undefined;
            documentationUrl?: string | undefined;
        }[];
        details?: Record<string, unknown> | undefined;
        errorCode?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    timestamp: string;
    error: {
        message: string;
        category: "VALIDATION" | "PARSING" | "EXECUTION" | "FILESYSTEM" | "CONFIGURATION" | "NETWORK" | "INTERNAL" | "RESOURCE";
        severity: "ERROR" | "INFO" | "WARNING";
        suggestions: {
            details: string;
            action: string;
            example?: string | undefined;
            documentationUrl?: string | undefined;
        }[];
        details?: Record<string, unknown> | undefined;
        errorCode?: string | undefined;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: false;
    timestamp: string;
    error: {
        message: string;
        category: "VALIDATION" | "PARSING" | "EXECUTION" | "FILESYSTEM" | "CONFIGURATION" | "NETWORK" | "INTERNAL" | "RESOURCE";
        severity: "ERROR" | "INFO" | "WARNING";
        suggestions: {
            details: string;
            action: string;
            example?: string | undefined;
            documentationUrl?: string | undefined;
        }[];
        details?: Record<string, unknown> | undefined;
        errorCode?: string | undefined;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * CTS_Reasoning response schema
 */
export declare const ReasoningResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    toolName: z.ZodLiteral<"CTS_Reasoning">;
    success: z.ZodLiteral<true>;
    result: z.ZodObject<{
        reasoning_chain: z.ZodArray<z.ZodObject<{
            iteration: z.ZodNumber;
            stage: z.ZodString;
            thought: z.ZodString;
            assumptions_challenged: z.ZodArray<z.ZodString, "many">;
            axioms_used: z.ZodArray<z.ZodString, "many">;
            tags: z.ZodArray<z.ZodString, "many">;
            next_thought_needed: z.ZodBoolean;
            prompt_used: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            iteration: number;
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            prompt_used: string | null;
        }, {
            iteration: number;
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            prompt_used: string | null;
        }>, "many">;
        summary: z.ZodObject<{
            topic: z.ZodString;
            total_iterations: z.ZodNumber;
            converged: z.ZodBoolean;
            final_stage: z.ZodString;
            total_assumptions_challenged: z.ZodNumber;
            total_axioms_used: z.ZodNumber;
            unique_tags: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            topic: string;
            total_iterations: number;
            converged: boolean;
            final_stage: string;
            total_assumptions_challenged: number;
            total_axioms_used: number;
            unique_tags: string[];
        }, {
            topic: string;
            total_iterations: number;
            converged: boolean;
            final_stage: string;
            total_assumptions_challenged: number;
            total_axioms_used: number;
            unique_tags: string[];
        }>;
        final_state: z.ZodObject<{
            thought: z.ZodString;
            thought_number: z.ZodNumber;
            total_thoughts: z.ZodNumber;
            next_thought_needed: z.ZodBoolean;
            stage: z.ZodString;
            assumptions_challenged: z.ZodArray<z.ZodString, "many">;
            axioms_used: z.ZodArray<z.ZodString, "many">;
            tags: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            thought_number: number;
            total_thoughts: number;
        }, {
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            thought_number: number;
            total_thoughts: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        reasoning_chain: {
            iteration: number;
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            prompt_used: string | null;
        }[];
        summary: {
            topic: string;
            total_iterations: number;
            converged: boolean;
            final_stage: string;
            total_assumptions_challenged: number;
            total_axioms_used: number;
            unique_tags: string[];
        };
        final_state: {
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            thought_number: number;
            total_thoughts: number;
        };
    }, {
        reasoning_chain: {
            iteration: number;
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            prompt_used: string | null;
        }[];
        summary: {
            topic: string;
            total_iterations: number;
            converged: boolean;
            final_stage: string;
            total_assumptions_challenged: number;
            total_axioms_used: number;
            unique_tags: string[];
        };
        final_state: {
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            thought_number: number;
            total_thoughts: number;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    timestamp: string;
    toolName: "CTS_Reasoning";
    result: {
        reasoning_chain: {
            iteration: number;
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            prompt_used: string | null;
        }[];
        summary: {
            topic: string;
            total_iterations: number;
            converged: boolean;
            final_stage: string;
            total_assumptions_challenged: number;
            total_axioms_used: number;
            unique_tags: string[];
        };
        final_state: {
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            thought_number: number;
            total_thoughts: number;
        };
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: true;
    timestamp: string;
    toolName: "CTS_Reasoning";
    result: {
        reasoning_chain: {
            iteration: number;
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            prompt_used: string | null;
        }[];
        summary: {
            topic: string;
            total_iterations: number;
            converged: boolean;
            final_stage: string;
            total_assumptions_challenged: number;
            total_axioms_used: number;
            unique_tags: string[];
        };
        final_state: {
            stage: string;
            thought: string;
            assumptions_challenged: string[];
            axioms_used: string[];
            tags: string[];
            next_thought_needed: boolean;
            thought_number: number;
            total_thoughts: number;
        };
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * CTS_Scan_Project_Signals response schema
 */
export declare const ScanSignalsResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    success: z.ZodLiteral<true>;
    toolName: z.ZodLiteral<"CTS_Scan_Project_Signals">;
    result: z.ZodObject<{
        projectPath: z.ZodString;
        totalSignals: z.ZodNumber;
        eventBusSignals: z.ZodNumber;
        signalBusSignals: z.ZodNumber;
        signals: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            file: z.ZodString;
            line: z.ZodNumber;
            source: z.ZodString;
            params: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            line: number;
            params: string[];
            name: string;
            file: string;
            source: string;
        }, {
            line: number;
            params: string[];
            name: string;
            file: string;
            source: string;
        }>, "many">;
        rendered: z.ZodBoolean;
        html: z.ZodOptional<z.ZodString>;
        cached: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        projectPath: string;
        totalSignals: number;
        eventBusSignals: number;
        signalBusSignals: number;
        signals: {
            line: number;
            params: string[];
            name: string;
            file: string;
            source: string;
        }[];
        rendered: boolean;
        html?: string | undefined;
        cached?: boolean | undefined;
    }, {
        projectPath: string;
        totalSignals: number;
        eventBusSignals: number;
        signalBusSignals: number;
        signals: {
            line: number;
            params: string[];
            name: string;
            file: string;
            source: string;
        }[];
        rendered: boolean;
        html?: string | undefined;
        cached?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    timestamp: string;
    toolName: "CTS_Scan_Project_Signals";
    result: {
        projectPath: string;
        totalSignals: number;
        eventBusSignals: number;
        signalBusSignals: number;
        signals: {
            line: number;
            params: string[];
            name: string;
            file: string;
            source: string;
        }[];
        rendered: boolean;
        html?: string | undefined;
        cached?: boolean | undefined;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: true;
    timestamp: string;
    toolName: "CTS_Scan_Project_Signals";
    result: {
        projectPath: string;
        totalSignals: number;
        eventBusSignals: number;
        signalBusSignals: number;
        signals: {
            line: number;
            params: string[];
            name: string;
            file: string;
            source: string;
        }[];
        rendered: boolean;
        html?: string | undefined;
        cached?: boolean | undefined;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * CTS_Bughunter response schema
 */
export declare const BughunterResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    success: z.ZodLiteral<true>;
    toolName: z.ZodLiteral<"CTS_Bughunter">;
    result: z.ZodObject<{
        bugs: z.ZodArray<z.ZodObject<{
            file: z.ZodString;
            line: z.ZodNumber;
            severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
            category: z.ZodString;
            message: z.ZodString;
            suggestion: z.ZodOptional<z.ZodString>;
            codeSnippet: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            line: number;
            message: string;
            category: string;
            severity: "low" | "medium" | "high" | "critical";
            file: string;
            suggestion?: string | undefined;
            codeSnippet?: string | undefined;
        }, {
            line: number;
            message: string;
            category: string;
            severity: "low" | "medium" | "high" | "critical";
            file: string;
            suggestion?: string | undefined;
            codeSnippet?: string | undefined;
        }>, "many">;
        stats: z.ZodObject<{
            totalBugs: z.ZodNumber;
            bySeverity: z.ZodRecord<z.ZodString, z.ZodNumber>;
            byCategory: z.ZodRecord<z.ZodString, z.ZodNumber>;
            filesScanned: z.ZodNumber;
            duration_ms: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            duration_ms: number;
            totalBugs: number;
            bySeverity: Record<string, number>;
            byCategory: Record<string, number>;
            filesScanned: number;
        }, {
            duration_ms: number;
            totalBugs: number;
            bySeverity: Record<string, number>;
            byCategory: Record<string, number>;
            filesScanned: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        bugs: {
            line: number;
            message: string;
            category: string;
            severity: "low" | "medium" | "high" | "critical";
            file: string;
            suggestion?: string | undefined;
            codeSnippet?: string | undefined;
        }[];
        stats: {
            duration_ms: number;
            totalBugs: number;
            bySeverity: Record<string, number>;
            byCategory: Record<string, number>;
            filesScanned: number;
        };
    }, {
        bugs: {
            line: number;
            message: string;
            category: string;
            severity: "low" | "medium" | "high" | "critical";
            file: string;
            suggestion?: string | undefined;
            codeSnippet?: string | undefined;
        }[];
        stats: {
            duration_ms: number;
            totalBugs: number;
            bySeverity: Record<string, number>;
            byCategory: Record<string, number>;
            filesScanned: number;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    timestamp: string;
    toolName: "CTS_Bughunter";
    result: {
        bugs: {
            line: number;
            message: string;
            category: string;
            severity: "low" | "medium" | "high" | "critical";
            file: string;
            suggestion?: string | undefined;
            codeSnippet?: string | undefined;
        }[];
        stats: {
            duration_ms: number;
            totalBugs: number;
            bySeverity: Record<string, number>;
            byCategory: Record<string, number>;
            filesScanned: number;
        };
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: true;
    timestamp: string;
    toolName: "CTS_Bughunter";
    result: {
        bugs: {
            line: number;
            message: string;
            category: string;
            severity: "low" | "medium" | "high" | "critical";
            file: string;
            suggestion?: string | undefined;
            codeSnippet?: string | undefined;
        }[];
        stats: {
            duration_ms: number;
            totalBugs: number;
            bySeverity: Record<string, number>;
            byCategory: Record<string, number>;
            filesScanned: number;
        };
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * cts_audit response schema
 */
export declare const AuditResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    toolName: z.ZodLiteral<"cts_audit">;
    success: z.ZodLiteral<true>;
    result: z.ZodObject<{
        report: z.ZodObject<{
            overallScore: z.ZodNumber;
            categoryScores: z.ZodObject<{
                cts: z.ZodNumber;
                code_quality: z.ZodNumber;
                project_structure: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                cts: number;
                code_quality: number;
                project_structure: number;
            }, {
                cts: number;
                code_quality: number;
                project_structure: number;
            }>;
            violations: z.ZodArray<z.ZodObject<{
                file: z.ZodString;
                line: z.ZodNumber;
                severity: z.ZodEnum<["error", "warning", "info"]>;
                message: z.ZodString;
                ruleId: z.ZodString;
                category: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                line: number;
                message: string;
                category: string;
                severity: "error" | "warning" | "info";
                file: string;
                ruleId: string;
            }, {
                line: number;
                message: string;
                category: string;
                severity: "error" | "warning" | "info";
                file: string;
                ruleId: string;
            }>, "many">;
            violationsByRule: z.ZodRecord<z.ZodString, z.ZodNumber>;
            recommendations: z.ZodArray<z.ZodObject<{
                priority: z.ZodEnum<["critical", "high", "medium", "low"]>;
                action: z.ZodString;
                affectedFiles: z.ZodArray<z.ZodString, "many">;
                estimatedEffort: z.ZodEnum<["low", "medium", "high"]>;
                ruleId: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                action: string;
                ruleId: string;
                priority: "low" | "medium" | "high" | "critical";
                affectedFiles: string[];
                estimatedEffort: "low" | "medium" | "high";
            }, {
                action: string;
                ruleId: string;
                priority: "low" | "medium" | "high" | "critical";
                affectedFiles: string[];
                estimatedEffort: "low" | "medium" | "high";
            }>, "many">;
            metrics: z.ZodObject<{
                loc: z.ZodObject<{
                    total: z.ZodNumber;
                    byFile: z.ZodRecord<z.ZodString, z.ZodNumber>;
                    average: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                }, {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                }>;
                complexity: z.ZodObject<{
                    total: z.ZodNumber;
                    byFile: z.ZodRecord<z.ZodString, z.ZodNumber>;
                    average: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                }, {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                }>;
                testCoverage: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                loc: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                complexity: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                testCoverage?: number | undefined;
            }, {
                loc: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                complexity: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                testCoverage?: number | undefined;
            }>;
            summary: z.ZodObject<{
                totalViolations: z.ZodNumber;
                errorCount: z.ZodNumber;
                warningCount: z.ZodNumber;
                infoCount: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                totalViolations: number;
                errorCount: number;
                warningCount: number;
                infoCount: number;
            }, {
                totalViolations: number;
                errorCount: number;
                warningCount: number;
                infoCount: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            summary: {
                totalViolations: number;
                errorCount: number;
                warningCount: number;
                infoCount: number;
            };
            overallScore: number;
            categoryScores: {
                cts: number;
                code_quality: number;
                project_structure: number;
            };
            violations: {
                line: number;
                message: string;
                category: string;
                severity: "error" | "warning" | "info";
                file: string;
                ruleId: string;
            }[];
            violationsByRule: Record<string, number>;
            recommendations: {
                action: string;
                ruleId: string;
                priority: "low" | "medium" | "high" | "critical";
                affectedFiles: string[];
                estimatedEffort: "low" | "medium" | "high";
            }[];
            metrics: {
                loc: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                complexity: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                testCoverage?: number | undefined;
            };
        }, {
            summary: {
                totalViolations: number;
                errorCount: number;
                warningCount: number;
                infoCount: number;
            };
            overallScore: number;
            categoryScores: {
                cts: number;
                code_quality: number;
                project_structure: number;
            };
            violations: {
                line: number;
                message: string;
                category: string;
                severity: "error" | "warning" | "info";
                file: string;
                ruleId: string;
            }[];
            violationsByRule: Record<string, number>;
            recommendations: {
                action: string;
                ruleId: string;
                priority: "low" | "medium" | "high" | "critical";
                affectedFiles: string[];
                estimatedEffort: "low" | "medium" | "high";
            }[];
            metrics: {
                loc: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                complexity: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                testCoverage?: number | undefined;
            };
        }>;
        performance: z.ZodObject<{
            durationMs: z.ZodNumber;
            rulesChecked: z.ZodNumber;
            metricsCollected: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            durationMs: number;
            rulesChecked: number;
            metricsCollected: boolean;
        }, {
            durationMs: number;
            rulesChecked: number;
            metricsCollected: boolean;
        }>;
        format: z.ZodEnum<["json", "markdown"]>;
        markdown: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        report: {
            summary: {
                totalViolations: number;
                errorCount: number;
                warningCount: number;
                infoCount: number;
            };
            overallScore: number;
            categoryScores: {
                cts: number;
                code_quality: number;
                project_structure: number;
            };
            violations: {
                line: number;
                message: string;
                category: string;
                severity: "error" | "warning" | "info";
                file: string;
                ruleId: string;
            }[];
            violationsByRule: Record<string, number>;
            recommendations: {
                action: string;
                ruleId: string;
                priority: "low" | "medium" | "high" | "critical";
                affectedFiles: string[];
                estimatedEffort: "low" | "medium" | "high";
            }[];
            metrics: {
                loc: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                complexity: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                testCoverage?: number | undefined;
            };
        };
        performance: {
            durationMs: number;
            rulesChecked: number;
            metricsCollected: boolean;
        };
        format: "json" | "markdown";
        markdown?: string | undefined;
    }, {
        report: {
            summary: {
                totalViolations: number;
                errorCount: number;
                warningCount: number;
                infoCount: number;
            };
            overallScore: number;
            categoryScores: {
                cts: number;
                code_quality: number;
                project_structure: number;
            };
            violations: {
                line: number;
                message: string;
                category: string;
                severity: "error" | "warning" | "info";
                file: string;
                ruleId: string;
            }[];
            violationsByRule: Record<string, number>;
            recommendations: {
                action: string;
                ruleId: string;
                priority: "low" | "medium" | "high" | "critical";
                affectedFiles: string[];
                estimatedEffort: "low" | "medium" | "high";
            }[];
            metrics: {
                loc: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                complexity: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                testCoverage?: number | undefined;
            };
        };
        performance: {
            durationMs: number;
            rulesChecked: number;
            metricsCollected: boolean;
        };
        format: "json" | "markdown";
        markdown?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    timestamp: string;
    toolName: "cts_audit";
    result: {
        report: {
            summary: {
                totalViolations: number;
                errorCount: number;
                warningCount: number;
                infoCount: number;
            };
            overallScore: number;
            categoryScores: {
                cts: number;
                code_quality: number;
                project_structure: number;
            };
            violations: {
                line: number;
                message: string;
                category: string;
                severity: "error" | "warning" | "info";
                file: string;
                ruleId: string;
            }[];
            violationsByRule: Record<string, number>;
            recommendations: {
                action: string;
                ruleId: string;
                priority: "low" | "medium" | "high" | "critical";
                affectedFiles: string[];
                estimatedEffort: "low" | "medium" | "high";
            }[];
            metrics: {
                loc: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                complexity: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                testCoverage?: number | undefined;
            };
        };
        performance: {
            durationMs: number;
            rulesChecked: number;
            metricsCollected: boolean;
        };
        format: "json" | "markdown";
        markdown?: string | undefined;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: true;
    timestamp: string;
    toolName: "cts_audit";
    result: {
        report: {
            summary: {
                totalViolations: number;
                errorCount: number;
                warningCount: number;
                infoCount: number;
            };
            overallScore: number;
            categoryScores: {
                cts: number;
                code_quality: number;
                project_structure: number;
            };
            violations: {
                line: number;
                message: string;
                category: string;
                severity: "error" | "warning" | "info";
                file: string;
                ruleId: string;
            }[];
            violationsByRule: Record<string, number>;
            recommendations: {
                action: string;
                ruleId: string;
                priority: "low" | "medium" | "high" | "critical";
                affectedFiles: string[];
                estimatedEffort: "low" | "medium" | "high";
            }[];
            metrics: {
                loc: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                complexity: {
                    total: number;
                    byFile: Record<string, number>;
                    average: number;
                };
                testCoverage?: number | undefined;
            };
        };
        performance: {
            durationMs: number;
            rulesChecked: number;
            metricsCollected: boolean;
        };
        format: "json" | "markdown";
        markdown?: string | undefined;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * CTS_Analyze_Project response schema
 */
export declare const AnalyzeProjectResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    toolName: z.ZodLiteral<"CTS_Analyze_Project">;
    success: z.ZodLiteral<true>;
    result: z.ZodObject<{
        projectPath: z.ZodString;
        scanStats: z.ZodObject<{
            filesScanned: z.ZodNumber;
            totalSignals: z.ZodNumber;
            totalEmissions: z.ZodNumber;
            totalConnections: z.ZodNumber;
            scanTime: z.ZodNumber;
            graphBuildTime: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            totalSignals: number;
            filesScanned: number;
            totalEmissions: number;
            totalConnections: number;
            scanTime: number;
            graphBuildTime: number;
        }, {
            totalSignals: number;
            filesScanned: number;
            totalEmissions: number;
            totalConnections: number;
            scanTime: number;
            graphBuildTime: number;
        }>;
        unused: z.ZodOptional<z.ZodObject<{
            orphanSignals: z.ZodArray<z.ZodObject<{
                signal: z.ZodString;
                file: z.ZodString;
                confidence: z.ZodNumber;
                reason: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }, {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }>, "many">;
            deadEmitters: z.ZodArray<z.ZodObject<{
                signal: z.ZodString;
                file: z.ZodString;
                confidence: z.ZodNumber;
                reason: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }, {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }>, "many">;
            isolatedSignals: z.ZodArray<z.ZodObject<{
                signal: z.ZodString;
                file: z.ZodString;
                confidence: z.ZodNumber;
                reason: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }, {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }>, "many">;
            summary: z.ZodObject<{
                totalOrphans: z.ZodNumber;
                totalDeadEmitters: z.ZodNumber;
                totalIsolated: z.ZodNumber;
                highConfidenceCount: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                totalOrphans: number;
                totalDeadEmitters: number;
                totalIsolated: number;
                highConfidenceCount: number;
            }, {
                totalOrphans: number;
                totalDeadEmitters: number;
                totalIsolated: number;
                highConfidenceCount: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            summary: {
                totalOrphans: number;
                totalDeadEmitters: number;
                totalIsolated: number;
                highConfidenceCount: number;
            };
            orphanSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            deadEmitters: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            isolatedSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
        }, {
            summary: {
                totalOrphans: number;
                totalDeadEmitters: number;
                totalIsolated: number;
                highConfidenceCount: number;
            };
            orphanSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            deadEmitters: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            isolatedSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
        }>>;
        clusters: z.ZodOptional<z.ZodObject<{
            topLevel: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                size: z.ZodNumber;
                subclusters: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    label: z.ZodString;
                    size: z.ZodNumber;
                    signals: z.ZodArray<z.ZodString, "many">;
                }, "strip", z.ZodTypeAny, {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }, {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                label: string;
                size: number;
                subclusters?: {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }[] | undefined;
            }, {
                id: string;
                label: string;
                size: number;
                subclusters?: {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }[] | undefined;
            }>, "many">;
            summary: z.ZodObject<{
                totalClusters: z.ZodNumber;
                totalSubclusters: z.ZodNumber;
                avgClusterSize: z.ZodNumber;
                labelingMethod: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                totalClusters: number;
                totalSubclusters: number;
                avgClusterSize: number;
                labelingMethod: string;
            }, {
                totalClusters: number;
                totalSubclusters: number;
                avgClusterSize: number;
                labelingMethod: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            summary: {
                totalClusters: number;
                totalSubclusters: number;
                avgClusterSize: number;
                labelingMethod: string;
            };
            topLevel: {
                id: string;
                label: string;
                size: number;
                subclusters?: {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }[] | undefined;
            }[];
        }, {
            summary: {
                totalClusters: number;
                totalSubclusters: number;
                avgClusterSize: number;
                labelingMethod: string;
            };
            topLevel: {
                id: string;
                label: string;
                size: number;
                subclusters?: {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }[] | undefined;
            }[];
        }>>;
        performance: z.ZodObject<{
            overheadMs: z.ZodNumber;
            alertsGenerated: z.ZodNumber;
            baselineEstablished: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            overheadMs: number;
            alertsGenerated: number;
            baselineEstablished: boolean;
        }, {
            overheadMs: number;
            alertsGenerated: number;
            baselineEstablished: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        projectPath: string;
        performance: {
            overheadMs: number;
            alertsGenerated: number;
            baselineEstablished: boolean;
        };
        scanStats: {
            totalSignals: number;
            filesScanned: number;
            totalEmissions: number;
            totalConnections: number;
            scanTime: number;
            graphBuildTime: number;
        };
        unused?: {
            summary: {
                totalOrphans: number;
                totalDeadEmitters: number;
                totalIsolated: number;
                highConfidenceCount: number;
            };
            orphanSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            deadEmitters: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            isolatedSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
        } | undefined;
        clusters?: {
            summary: {
                totalClusters: number;
                totalSubclusters: number;
                avgClusterSize: number;
                labelingMethod: string;
            };
            topLevel: {
                id: string;
                label: string;
                size: number;
                subclusters?: {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }[] | undefined;
            }[];
        } | undefined;
    }, {
        projectPath: string;
        performance: {
            overheadMs: number;
            alertsGenerated: number;
            baselineEstablished: boolean;
        };
        scanStats: {
            totalSignals: number;
            filesScanned: number;
            totalEmissions: number;
            totalConnections: number;
            scanTime: number;
            graphBuildTime: number;
        };
        unused?: {
            summary: {
                totalOrphans: number;
                totalDeadEmitters: number;
                totalIsolated: number;
                highConfidenceCount: number;
            };
            orphanSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            deadEmitters: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            isolatedSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
        } | undefined;
        clusters?: {
            summary: {
                totalClusters: number;
                totalSubclusters: number;
                avgClusterSize: number;
                labelingMethod: string;
            };
            topLevel: {
                id: string;
                label: string;
                size: number;
                subclusters?: {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }[] | undefined;
            }[];
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    timestamp: string;
    toolName: "CTS_Analyze_Project";
    result: {
        projectPath: string;
        performance: {
            overheadMs: number;
            alertsGenerated: number;
            baselineEstablished: boolean;
        };
        scanStats: {
            totalSignals: number;
            filesScanned: number;
            totalEmissions: number;
            totalConnections: number;
            scanTime: number;
            graphBuildTime: number;
        };
        unused?: {
            summary: {
                totalOrphans: number;
                totalDeadEmitters: number;
                totalIsolated: number;
                highConfidenceCount: number;
            };
            orphanSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            deadEmitters: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            isolatedSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
        } | undefined;
        clusters?: {
            summary: {
                totalClusters: number;
                totalSubclusters: number;
                avgClusterSize: number;
                labelingMethod: string;
            };
            topLevel: {
                id: string;
                label: string;
                size: number;
                subclusters?: {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }[] | undefined;
            }[];
        } | undefined;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: true;
    timestamp: string;
    toolName: "CTS_Analyze_Project";
    result: {
        projectPath: string;
        performance: {
            overheadMs: number;
            alertsGenerated: number;
            baselineEstablished: boolean;
        };
        scanStats: {
            totalSignals: number;
            filesScanned: number;
            totalEmissions: number;
            totalConnections: number;
            scanTime: number;
            graphBuildTime: number;
        };
        unused?: {
            summary: {
                totalOrphans: number;
                totalDeadEmitters: number;
                totalIsolated: number;
                highConfidenceCount: number;
            };
            orphanSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            deadEmitters: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
            isolatedSignals: {
                file: string;
                signal: string;
                confidence: number;
                reason: string;
            }[];
        } | undefined;
        clusters?: {
            summary: {
                totalClusters: number;
                totalSubclusters: number;
                avgClusterSize: number;
                labelingMethod: string;
            };
            topLevel: {
                id: string;
                label: string;
                size: number;
                subclusters?: {
                    signals: string[];
                    id: string;
                    label: string;
                    size: number;
                }[] | undefined;
            }[];
        } | undefined;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * CTS_Suggest_Refactoring response schema
 */
export declare const SuggestRefactoringResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    toolName: z.ZodLiteral<"CTS_Suggest_Refactoring">;
    success: z.ZodLiteral<true>;
    result: z.ZodObject<{
        projectPath: z.ZodString;
        suggestions: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["rename", "merge", "deprecate"]>;
            target: z.ZodString;
            replacement: z.ZodString;
            confidence: z.ZodNumber;
            reason: z.ZodString;
            affectedFiles: z.ZodArray<z.ZodString, "many">;
            estimatedImpact: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "rename" | "merge" | "deprecate";
            affectedFiles: string[];
            confidence: number;
            reason: string;
            target: string;
            replacement: string;
            estimatedImpact: string;
        }, {
            type: "rename" | "merge" | "deprecate";
            affectedFiles: string[];
            confidence: number;
            reason: string;
            target: string;
            replacement: string;
            estimatedImpact: string;
        }>, "many">;
        summary: z.ZodObject<{
            totalGenerated: z.ZodNumber;
            afterFiltering: z.ZodNumber;
            returned: z.ZodNumber;
            byType: z.ZodObject<{
                merge: z.ZodNumber;
                rename: z.ZodNumber;
                deprecate: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                rename: number;
                merge: number;
                deprecate: number;
            }, {
                rename: number;
                merge: number;
                deprecate: number;
            }>;
            avgConfidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            totalGenerated: number;
            afterFiltering: number;
            returned: number;
            byType: {
                rename: number;
                merge: number;
                deprecate: number;
            };
            avgConfidence: number;
        }, {
            totalGenerated: number;
            afterFiltering: number;
            returned: number;
            byType: {
                rename: number;
                merge: number;
                deprecate: number;
            };
            avgConfidence: number;
        }>;
        performance: z.ZodObject<{
            scanTime: z.ZodNumber;
            graphTime: z.ZodNumber;
            suggestionTime: z.ZodNumber;
            cacheHit: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            scanTime: number;
            graphTime: number;
            suggestionTime: number;
            cacheHit: boolean;
        }, {
            scanTime: number;
            graphTime: number;
            suggestionTime: number;
            cacheHit: boolean;
        }>;
    }, "strip", z.ZodTypeAny, {
        suggestions: {
            type: "rename" | "merge" | "deprecate";
            affectedFiles: string[];
            confidence: number;
            reason: string;
            target: string;
            replacement: string;
            estimatedImpact: string;
        }[];
        summary: {
            totalGenerated: number;
            afterFiltering: number;
            returned: number;
            byType: {
                rename: number;
                merge: number;
                deprecate: number;
            };
            avgConfidence: number;
        };
        projectPath: string;
        performance: {
            scanTime: number;
            graphTime: number;
            suggestionTime: number;
            cacheHit: boolean;
        };
    }, {
        suggestions: {
            type: "rename" | "merge" | "deprecate";
            affectedFiles: string[];
            confidence: number;
            reason: string;
            target: string;
            replacement: string;
            estimatedImpact: string;
        }[];
        summary: {
            totalGenerated: number;
            afterFiltering: number;
            returned: number;
            byType: {
                rename: number;
                merge: number;
                deprecate: number;
            };
            avgConfidence: number;
        };
        projectPath: string;
        performance: {
            scanTime: number;
            graphTime: number;
            suggestionTime: number;
            cacheHit: boolean;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    timestamp: string;
    toolName: "CTS_Suggest_Refactoring";
    result: {
        suggestions: {
            type: "rename" | "merge" | "deprecate";
            affectedFiles: string[];
            confidence: number;
            reason: string;
            target: string;
            replacement: string;
            estimatedImpact: string;
        }[];
        summary: {
            totalGenerated: number;
            afterFiltering: number;
            returned: number;
            byType: {
                rename: number;
                merge: number;
                deprecate: number;
            };
            avgConfidence: number;
        };
        projectPath: string;
        performance: {
            scanTime: number;
            graphTime: number;
            suggestionTime: number;
            cacheHit: boolean;
        };
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: true;
    timestamp: string;
    toolName: "CTS_Suggest_Refactoring";
    result: {
        suggestions: {
            type: "rename" | "merge" | "deprecate";
            affectedFiles: string[];
            confidence: number;
            reason: string;
            target: string;
            replacement: string;
            estimatedImpact: string;
        }[];
        summary: {
            totalGenerated: number;
            afterFiltering: number;
            returned: number;
            byType: {
                rename: number;
                merge: number;
                deprecate: number;
            };
            avgConfidence: number;
        };
        projectPath: string;
        performance: {
            scanTime: number;
            graphTime: number;
            suggestionTime: number;
            cacheHit: boolean;
        };
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * CTS_Render_Artifact response schema
 */
export declare const RenderArtifactResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    success: z.ZodLiteral<true>;
    toolName: z.ZodLiteral<"CTS_Render_Artifact">;
    result: z.ZodObject<{
        html: z.ZodString;
        artifactType: z.ZodString;
        renderer: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        html: string;
        artifactType: string;
        renderer: string;
    }, {
        html: string;
        artifactType: string;
        renderer: string;
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    timestamp: string;
    toolName: "CTS_Render_Artifact";
    result: {
        html: string;
        artifactType: string;
        renderer: string;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: true;
    timestamp: string;
    toolName: "CTS_Render_Artifact";
    result: {
        html: string;
        artifactType: string;
        renderer: string;
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * CTS_Export_to_Shrimp response schema
 */
export declare const ExportToShrimpResponseSchema: z.ZodObject<{
    timestamp: z.ZodString;
    duration_ms: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    toolName: z.ZodLiteral<"CTS_Export_to_Shrimp">;
    success: z.ZodLiteral<true>;
    result: z.ZodObject<{
        message: z.ZodString;
        conversionTime: z.ZodString;
        taskCount: z.ZodNumber;
        updateMode: z.ZodEnum<["append", "overwrite", "selective", "clearAllTasks"]>;
        shrimpTasksFormat: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            implementationGuide: z.ZodString;
            notes: z.ZodOptional<z.ZodString>;
            dependencies: z.ZodArray<z.ZodString, "many">;
            relatedFiles: z.ZodArray<z.ZodObject<{
                path: z.ZodString;
                type: z.ZodEnum<["TO_MODIFY", "REFERENCE", "CREATE", "DEPENDENCY", "OTHER"]>;
                description: z.ZodString;
                lineStart: z.ZodOptional<z.ZodNumber>;
                lineEnd: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                path: string;
                type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                description: string;
                lineStart?: number | undefined;
                lineEnd?: number | undefined;
            }, {
                path: string;
                type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                description: string;
                lineStart?: number | undefined;
                lineEnd?: number | undefined;
            }>, "many">;
            verificationCriteria: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            description: string;
            implementationGuide: string;
            dependencies: string[];
            relatedFiles: {
                path: string;
                type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                description: string;
                lineStart?: number | undefined;
                lineEnd?: number | undefined;
            }[];
            verificationCriteria: string;
            notes?: string | undefined;
        }, {
            name: string;
            description: string;
            implementationGuide: string;
            dependencies: string[];
            relatedFiles: {
                path: string;
                type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                description: string;
                lineStart?: number | undefined;
                lineEnd?: number | undefined;
            }[];
            verificationCriteria: string;
            notes?: string | undefined;
        }>, "many">;
        instructions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        message: string;
        conversionTime: string;
        taskCount: number;
        updateMode: "append" | "overwrite" | "selective" | "clearAllTasks";
        shrimpTasksFormat: {
            name: string;
            description: string;
            implementationGuide: string;
            dependencies: string[];
            relatedFiles: {
                path: string;
                type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                description: string;
                lineStart?: number | undefined;
                lineEnd?: number | undefined;
            }[];
            verificationCriteria: string;
            notes?: string | undefined;
        }[];
        instructions: string[];
    }, {
        message: string;
        conversionTime: string;
        taskCount: number;
        updateMode: "append" | "overwrite" | "selective" | "clearAllTasks";
        shrimpTasksFormat: {
            name: string;
            description: string;
            implementationGuide: string;
            dependencies: string[];
            relatedFiles: {
                path: string;
                type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                description: string;
                lineStart?: number | undefined;
                lineEnd?: number | undefined;
            }[];
            verificationCriteria: string;
            notes?: string | undefined;
        }[];
        instructions: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    success: true;
    timestamp: string;
    toolName: "CTS_Export_to_Shrimp";
    result: {
        message: string;
        conversionTime: string;
        taskCount: number;
        updateMode: "append" | "overwrite" | "selective" | "clearAllTasks";
        shrimpTasksFormat: {
            name: string;
            description: string;
            implementationGuide: string;
            dependencies: string[];
            relatedFiles: {
                path: string;
                type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                description: string;
                lineStart?: number | undefined;
                lineEnd?: number | undefined;
            }[];
            verificationCriteria: string;
            notes?: string | undefined;
        }[];
        instructions: string[];
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    success: true;
    timestamp: string;
    toolName: "CTS_Export_to_Shrimp";
    result: {
        message: string;
        conversionTime: string;
        taskCount: number;
        updateMode: "append" | "overwrite" | "selective" | "clearAllTasks";
        shrimpTasksFormat: {
            name: string;
            description: string;
            implementationGuide: string;
            dependencies: string[];
            relatedFiles: {
                path: string;
                type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                description: string;
                lineStart?: number | undefined;
                lineEnd?: number | undefined;
            }[];
            verificationCriteria: string;
            notes?: string | undefined;
        }[];
        instructions: string[];
    };
    duration_ms?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Schema registry for validation
 */
export declare const ToolSchemas: {
    readonly CTS_Reasoning: z.ZodObject<{
        timestamp: z.ZodString;
        duration_ms: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    } & {
        toolName: z.ZodLiteral<"CTS_Reasoning">;
        success: z.ZodLiteral<true>;
        result: z.ZodObject<{
            reasoning_chain: z.ZodArray<z.ZodObject<{
                iteration: z.ZodNumber;
                stage: z.ZodString;
                thought: z.ZodString;
                assumptions_challenged: z.ZodArray<z.ZodString, "many">;
                axioms_used: z.ZodArray<z.ZodString, "many">;
                tags: z.ZodArray<z.ZodString, "many">;
                next_thought_needed: z.ZodBoolean;
                prompt_used: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                iteration: number;
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                prompt_used: string | null;
            }, {
                iteration: number;
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                prompt_used: string | null;
            }>, "many">;
            summary: z.ZodObject<{
                topic: z.ZodString;
                total_iterations: z.ZodNumber;
                converged: z.ZodBoolean;
                final_stage: z.ZodString;
                total_assumptions_challenged: z.ZodNumber;
                total_axioms_used: z.ZodNumber;
                unique_tags: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                topic: string;
                total_iterations: number;
                converged: boolean;
                final_stage: string;
                total_assumptions_challenged: number;
                total_axioms_used: number;
                unique_tags: string[];
            }, {
                topic: string;
                total_iterations: number;
                converged: boolean;
                final_stage: string;
                total_assumptions_challenged: number;
                total_axioms_used: number;
                unique_tags: string[];
            }>;
            final_state: z.ZodObject<{
                thought: z.ZodString;
                thought_number: z.ZodNumber;
                total_thoughts: z.ZodNumber;
                next_thought_needed: z.ZodBoolean;
                stage: z.ZodString;
                assumptions_challenged: z.ZodArray<z.ZodString, "many">;
                axioms_used: z.ZodArray<z.ZodString, "many">;
                tags: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                thought_number: number;
                total_thoughts: number;
            }, {
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                thought_number: number;
                total_thoughts: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            reasoning_chain: {
                iteration: number;
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                prompt_used: string | null;
            }[];
            summary: {
                topic: string;
                total_iterations: number;
                converged: boolean;
                final_stage: string;
                total_assumptions_challenged: number;
                total_axioms_used: number;
                unique_tags: string[];
            };
            final_state: {
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                thought_number: number;
                total_thoughts: number;
            };
        }, {
            reasoning_chain: {
                iteration: number;
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                prompt_used: string | null;
            }[];
            summary: {
                topic: string;
                total_iterations: number;
                converged: boolean;
                final_stage: string;
                total_assumptions_challenged: number;
                total_axioms_used: number;
                unique_tags: string[];
            };
            final_state: {
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                thought_number: number;
                total_thoughts: number;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        success: true;
        timestamp: string;
        toolName: "CTS_Reasoning";
        result: {
            reasoning_chain: {
                iteration: number;
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                prompt_used: string | null;
            }[];
            summary: {
                topic: string;
                total_iterations: number;
                converged: boolean;
                final_stage: string;
                total_assumptions_challenged: number;
                total_axioms_used: number;
                unique_tags: string[];
            };
            final_state: {
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                thought_number: number;
                total_thoughts: number;
            };
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        success: true;
        timestamp: string;
        toolName: "CTS_Reasoning";
        result: {
            reasoning_chain: {
                iteration: number;
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                prompt_used: string | null;
            }[];
            summary: {
                topic: string;
                total_iterations: number;
                converged: boolean;
                final_stage: string;
                total_assumptions_challenged: number;
                total_axioms_used: number;
                unique_tags: string[];
            };
            final_state: {
                stage: string;
                thought: string;
                assumptions_challenged: string[];
                axioms_used: string[];
                tags: string[];
                next_thought_needed: boolean;
                thought_number: number;
                total_thoughts: number;
            };
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
    readonly CTS_Scan_Project_Signals: z.ZodObject<{
        timestamp: z.ZodString;
        duration_ms: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    } & {
        success: z.ZodLiteral<true>;
        toolName: z.ZodLiteral<"CTS_Scan_Project_Signals">;
        result: z.ZodObject<{
            projectPath: z.ZodString;
            totalSignals: z.ZodNumber;
            eventBusSignals: z.ZodNumber;
            signalBusSignals: z.ZodNumber;
            signals: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                file: z.ZodString;
                line: z.ZodNumber;
                source: z.ZodString;
                params: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                line: number;
                params: string[];
                name: string;
                file: string;
                source: string;
            }, {
                line: number;
                params: string[];
                name: string;
                file: string;
                source: string;
            }>, "many">;
            rendered: z.ZodBoolean;
            html: z.ZodOptional<z.ZodString>;
            cached: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            projectPath: string;
            totalSignals: number;
            eventBusSignals: number;
            signalBusSignals: number;
            signals: {
                line: number;
                params: string[];
                name: string;
                file: string;
                source: string;
            }[];
            rendered: boolean;
            html?: string | undefined;
            cached?: boolean | undefined;
        }, {
            projectPath: string;
            totalSignals: number;
            eventBusSignals: number;
            signalBusSignals: number;
            signals: {
                line: number;
                params: string[];
                name: string;
                file: string;
                source: string;
            }[];
            rendered: boolean;
            html?: string | undefined;
            cached?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        success: true;
        timestamp: string;
        toolName: "CTS_Scan_Project_Signals";
        result: {
            projectPath: string;
            totalSignals: number;
            eventBusSignals: number;
            signalBusSignals: number;
            signals: {
                line: number;
                params: string[];
                name: string;
                file: string;
                source: string;
            }[];
            rendered: boolean;
            html?: string | undefined;
            cached?: boolean | undefined;
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        success: true;
        timestamp: string;
        toolName: "CTS_Scan_Project_Signals";
        result: {
            projectPath: string;
            totalSignals: number;
            eventBusSignals: number;
            signalBusSignals: number;
            signals: {
                line: number;
                params: string[];
                name: string;
                file: string;
                source: string;
            }[];
            rendered: boolean;
            html?: string | undefined;
            cached?: boolean | undefined;
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
    readonly CTS_Bughunter: z.ZodObject<{
        timestamp: z.ZodString;
        duration_ms: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    } & {
        success: z.ZodLiteral<true>;
        toolName: z.ZodLiteral<"CTS_Bughunter">;
        result: z.ZodObject<{
            bugs: z.ZodArray<z.ZodObject<{
                file: z.ZodString;
                line: z.ZodNumber;
                severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
                category: z.ZodString;
                message: z.ZodString;
                suggestion: z.ZodOptional<z.ZodString>;
                codeSnippet: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                line: number;
                message: string;
                category: string;
                severity: "low" | "medium" | "high" | "critical";
                file: string;
                suggestion?: string | undefined;
                codeSnippet?: string | undefined;
            }, {
                line: number;
                message: string;
                category: string;
                severity: "low" | "medium" | "high" | "critical";
                file: string;
                suggestion?: string | undefined;
                codeSnippet?: string | undefined;
            }>, "many">;
            stats: z.ZodObject<{
                totalBugs: z.ZodNumber;
                bySeverity: z.ZodRecord<z.ZodString, z.ZodNumber>;
                byCategory: z.ZodRecord<z.ZodString, z.ZodNumber>;
                filesScanned: z.ZodNumber;
                duration_ms: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                duration_ms: number;
                totalBugs: number;
                bySeverity: Record<string, number>;
                byCategory: Record<string, number>;
                filesScanned: number;
            }, {
                duration_ms: number;
                totalBugs: number;
                bySeverity: Record<string, number>;
                byCategory: Record<string, number>;
                filesScanned: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            bugs: {
                line: number;
                message: string;
                category: string;
                severity: "low" | "medium" | "high" | "critical";
                file: string;
                suggestion?: string | undefined;
                codeSnippet?: string | undefined;
            }[];
            stats: {
                duration_ms: number;
                totalBugs: number;
                bySeverity: Record<string, number>;
                byCategory: Record<string, number>;
                filesScanned: number;
            };
        }, {
            bugs: {
                line: number;
                message: string;
                category: string;
                severity: "low" | "medium" | "high" | "critical";
                file: string;
                suggestion?: string | undefined;
                codeSnippet?: string | undefined;
            }[];
            stats: {
                duration_ms: number;
                totalBugs: number;
                bySeverity: Record<string, number>;
                byCategory: Record<string, number>;
                filesScanned: number;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        success: true;
        timestamp: string;
        toolName: "CTS_Bughunter";
        result: {
            bugs: {
                line: number;
                message: string;
                category: string;
                severity: "low" | "medium" | "high" | "critical";
                file: string;
                suggestion?: string | undefined;
                codeSnippet?: string | undefined;
            }[];
            stats: {
                duration_ms: number;
                totalBugs: number;
                bySeverity: Record<string, number>;
                byCategory: Record<string, number>;
                filesScanned: number;
            };
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        success: true;
        timestamp: string;
        toolName: "CTS_Bughunter";
        result: {
            bugs: {
                line: number;
                message: string;
                category: string;
                severity: "low" | "medium" | "high" | "critical";
                file: string;
                suggestion?: string | undefined;
                codeSnippet?: string | undefined;
            }[];
            stats: {
                duration_ms: number;
                totalBugs: number;
                bySeverity: Record<string, number>;
                byCategory: Record<string, number>;
                filesScanned: number;
            };
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
    readonly cts_audit: z.ZodObject<{
        timestamp: z.ZodString;
        duration_ms: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    } & {
        toolName: z.ZodLiteral<"cts_audit">;
        success: z.ZodLiteral<true>;
        result: z.ZodObject<{
            report: z.ZodObject<{
                overallScore: z.ZodNumber;
                categoryScores: z.ZodObject<{
                    cts: z.ZodNumber;
                    code_quality: z.ZodNumber;
                    project_structure: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    cts: number;
                    code_quality: number;
                    project_structure: number;
                }, {
                    cts: number;
                    code_quality: number;
                    project_structure: number;
                }>;
                violations: z.ZodArray<z.ZodObject<{
                    file: z.ZodString;
                    line: z.ZodNumber;
                    severity: z.ZodEnum<["error", "warning", "info"]>;
                    message: z.ZodString;
                    ruleId: z.ZodString;
                    category: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    line: number;
                    message: string;
                    category: string;
                    severity: "error" | "warning" | "info";
                    file: string;
                    ruleId: string;
                }, {
                    line: number;
                    message: string;
                    category: string;
                    severity: "error" | "warning" | "info";
                    file: string;
                    ruleId: string;
                }>, "many">;
                violationsByRule: z.ZodRecord<z.ZodString, z.ZodNumber>;
                recommendations: z.ZodArray<z.ZodObject<{
                    priority: z.ZodEnum<["critical", "high", "medium", "low"]>;
                    action: z.ZodString;
                    affectedFiles: z.ZodArray<z.ZodString, "many">;
                    estimatedEffort: z.ZodEnum<["low", "medium", "high"]>;
                    ruleId: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    action: string;
                    ruleId: string;
                    priority: "low" | "medium" | "high" | "critical";
                    affectedFiles: string[];
                    estimatedEffort: "low" | "medium" | "high";
                }, {
                    action: string;
                    ruleId: string;
                    priority: "low" | "medium" | "high" | "critical";
                    affectedFiles: string[];
                    estimatedEffort: "low" | "medium" | "high";
                }>, "many">;
                metrics: z.ZodObject<{
                    loc: z.ZodObject<{
                        total: z.ZodNumber;
                        byFile: z.ZodRecord<z.ZodString, z.ZodNumber>;
                        average: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    }, {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    }>;
                    complexity: z.ZodObject<{
                        total: z.ZodNumber;
                        byFile: z.ZodRecord<z.ZodString, z.ZodNumber>;
                        average: z.ZodNumber;
                    }, "strip", z.ZodTypeAny, {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    }, {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    }>;
                    testCoverage: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    loc: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    complexity: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    testCoverage?: number | undefined;
                }, {
                    loc: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    complexity: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    testCoverage?: number | undefined;
                }>;
                summary: z.ZodObject<{
                    totalViolations: z.ZodNumber;
                    errorCount: z.ZodNumber;
                    warningCount: z.ZodNumber;
                    infoCount: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    totalViolations: number;
                    errorCount: number;
                    warningCount: number;
                    infoCount: number;
                }, {
                    totalViolations: number;
                    errorCount: number;
                    warningCount: number;
                    infoCount: number;
                }>;
            }, "strip", z.ZodTypeAny, {
                summary: {
                    totalViolations: number;
                    errorCount: number;
                    warningCount: number;
                    infoCount: number;
                };
                overallScore: number;
                categoryScores: {
                    cts: number;
                    code_quality: number;
                    project_structure: number;
                };
                violations: {
                    line: number;
                    message: string;
                    category: string;
                    severity: "error" | "warning" | "info";
                    file: string;
                    ruleId: string;
                }[];
                violationsByRule: Record<string, number>;
                recommendations: {
                    action: string;
                    ruleId: string;
                    priority: "low" | "medium" | "high" | "critical";
                    affectedFiles: string[];
                    estimatedEffort: "low" | "medium" | "high";
                }[];
                metrics: {
                    loc: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    complexity: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    testCoverage?: number | undefined;
                };
            }, {
                summary: {
                    totalViolations: number;
                    errorCount: number;
                    warningCount: number;
                    infoCount: number;
                };
                overallScore: number;
                categoryScores: {
                    cts: number;
                    code_quality: number;
                    project_structure: number;
                };
                violations: {
                    line: number;
                    message: string;
                    category: string;
                    severity: "error" | "warning" | "info";
                    file: string;
                    ruleId: string;
                }[];
                violationsByRule: Record<string, number>;
                recommendations: {
                    action: string;
                    ruleId: string;
                    priority: "low" | "medium" | "high" | "critical";
                    affectedFiles: string[];
                    estimatedEffort: "low" | "medium" | "high";
                }[];
                metrics: {
                    loc: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    complexity: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    testCoverage?: number | undefined;
                };
            }>;
            performance: z.ZodObject<{
                durationMs: z.ZodNumber;
                rulesChecked: z.ZodNumber;
                metricsCollected: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                durationMs: number;
                rulesChecked: number;
                metricsCollected: boolean;
            }, {
                durationMs: number;
                rulesChecked: number;
                metricsCollected: boolean;
            }>;
            format: z.ZodEnum<["json", "markdown"]>;
            markdown: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            report: {
                summary: {
                    totalViolations: number;
                    errorCount: number;
                    warningCount: number;
                    infoCount: number;
                };
                overallScore: number;
                categoryScores: {
                    cts: number;
                    code_quality: number;
                    project_structure: number;
                };
                violations: {
                    line: number;
                    message: string;
                    category: string;
                    severity: "error" | "warning" | "info";
                    file: string;
                    ruleId: string;
                }[];
                violationsByRule: Record<string, number>;
                recommendations: {
                    action: string;
                    ruleId: string;
                    priority: "low" | "medium" | "high" | "critical";
                    affectedFiles: string[];
                    estimatedEffort: "low" | "medium" | "high";
                }[];
                metrics: {
                    loc: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    complexity: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    testCoverage?: number | undefined;
                };
            };
            performance: {
                durationMs: number;
                rulesChecked: number;
                metricsCollected: boolean;
            };
            format: "json" | "markdown";
            markdown?: string | undefined;
        }, {
            report: {
                summary: {
                    totalViolations: number;
                    errorCount: number;
                    warningCount: number;
                    infoCount: number;
                };
                overallScore: number;
                categoryScores: {
                    cts: number;
                    code_quality: number;
                    project_structure: number;
                };
                violations: {
                    line: number;
                    message: string;
                    category: string;
                    severity: "error" | "warning" | "info";
                    file: string;
                    ruleId: string;
                }[];
                violationsByRule: Record<string, number>;
                recommendations: {
                    action: string;
                    ruleId: string;
                    priority: "low" | "medium" | "high" | "critical";
                    affectedFiles: string[];
                    estimatedEffort: "low" | "medium" | "high";
                }[];
                metrics: {
                    loc: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    complexity: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    testCoverage?: number | undefined;
                };
            };
            performance: {
                durationMs: number;
                rulesChecked: number;
                metricsCollected: boolean;
            };
            format: "json" | "markdown";
            markdown?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        success: true;
        timestamp: string;
        toolName: "cts_audit";
        result: {
            report: {
                summary: {
                    totalViolations: number;
                    errorCount: number;
                    warningCount: number;
                    infoCount: number;
                };
                overallScore: number;
                categoryScores: {
                    cts: number;
                    code_quality: number;
                    project_structure: number;
                };
                violations: {
                    line: number;
                    message: string;
                    category: string;
                    severity: "error" | "warning" | "info";
                    file: string;
                    ruleId: string;
                }[];
                violationsByRule: Record<string, number>;
                recommendations: {
                    action: string;
                    ruleId: string;
                    priority: "low" | "medium" | "high" | "critical";
                    affectedFiles: string[];
                    estimatedEffort: "low" | "medium" | "high";
                }[];
                metrics: {
                    loc: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    complexity: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    testCoverage?: number | undefined;
                };
            };
            performance: {
                durationMs: number;
                rulesChecked: number;
                metricsCollected: boolean;
            };
            format: "json" | "markdown";
            markdown?: string | undefined;
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        success: true;
        timestamp: string;
        toolName: "cts_audit";
        result: {
            report: {
                summary: {
                    totalViolations: number;
                    errorCount: number;
                    warningCount: number;
                    infoCount: number;
                };
                overallScore: number;
                categoryScores: {
                    cts: number;
                    code_quality: number;
                    project_structure: number;
                };
                violations: {
                    line: number;
                    message: string;
                    category: string;
                    severity: "error" | "warning" | "info";
                    file: string;
                    ruleId: string;
                }[];
                violationsByRule: Record<string, number>;
                recommendations: {
                    action: string;
                    ruleId: string;
                    priority: "low" | "medium" | "high" | "critical";
                    affectedFiles: string[];
                    estimatedEffort: "low" | "medium" | "high";
                }[];
                metrics: {
                    loc: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    complexity: {
                        total: number;
                        byFile: Record<string, number>;
                        average: number;
                    };
                    testCoverage?: number | undefined;
                };
            };
            performance: {
                durationMs: number;
                rulesChecked: number;
                metricsCollected: boolean;
            };
            format: "json" | "markdown";
            markdown?: string | undefined;
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
    readonly CTS_Analyze_Project: z.ZodObject<{
        timestamp: z.ZodString;
        duration_ms: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    } & {
        toolName: z.ZodLiteral<"CTS_Analyze_Project">;
        success: z.ZodLiteral<true>;
        result: z.ZodObject<{
            projectPath: z.ZodString;
            scanStats: z.ZodObject<{
                filesScanned: z.ZodNumber;
                totalSignals: z.ZodNumber;
                totalEmissions: z.ZodNumber;
                totalConnections: z.ZodNumber;
                scanTime: z.ZodNumber;
                graphBuildTime: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                totalSignals: number;
                filesScanned: number;
                totalEmissions: number;
                totalConnections: number;
                scanTime: number;
                graphBuildTime: number;
            }, {
                totalSignals: number;
                filesScanned: number;
                totalEmissions: number;
                totalConnections: number;
                scanTime: number;
                graphBuildTime: number;
            }>;
            unused: z.ZodOptional<z.ZodObject<{
                orphanSignals: z.ZodArray<z.ZodObject<{
                    signal: z.ZodString;
                    file: z.ZodString;
                    confidence: z.ZodNumber;
                    reason: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }, {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }>, "many">;
                deadEmitters: z.ZodArray<z.ZodObject<{
                    signal: z.ZodString;
                    file: z.ZodString;
                    confidence: z.ZodNumber;
                    reason: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }, {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }>, "many">;
                isolatedSignals: z.ZodArray<z.ZodObject<{
                    signal: z.ZodString;
                    file: z.ZodString;
                    confidence: z.ZodNumber;
                    reason: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }, {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }>, "many">;
                summary: z.ZodObject<{
                    totalOrphans: z.ZodNumber;
                    totalDeadEmitters: z.ZodNumber;
                    totalIsolated: z.ZodNumber;
                    highConfidenceCount: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    totalOrphans: number;
                    totalDeadEmitters: number;
                    totalIsolated: number;
                    highConfidenceCount: number;
                }, {
                    totalOrphans: number;
                    totalDeadEmitters: number;
                    totalIsolated: number;
                    highConfidenceCount: number;
                }>;
            }, "strip", z.ZodTypeAny, {
                summary: {
                    totalOrphans: number;
                    totalDeadEmitters: number;
                    totalIsolated: number;
                    highConfidenceCount: number;
                };
                orphanSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                deadEmitters: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                isolatedSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
            }, {
                summary: {
                    totalOrphans: number;
                    totalDeadEmitters: number;
                    totalIsolated: number;
                    highConfidenceCount: number;
                };
                orphanSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                deadEmitters: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                isolatedSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
            }>>;
            clusters: z.ZodOptional<z.ZodObject<{
                topLevel: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    label: z.ZodString;
                    size: z.ZodNumber;
                    subclusters: z.ZodOptional<z.ZodArray<z.ZodObject<{
                        id: z.ZodString;
                        label: z.ZodString;
                        size: z.ZodNumber;
                        signals: z.ZodArray<z.ZodString, "many">;
                    }, "strip", z.ZodTypeAny, {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }, {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    label: string;
                    size: number;
                    subclusters?: {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }[] | undefined;
                }, {
                    id: string;
                    label: string;
                    size: number;
                    subclusters?: {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }[] | undefined;
                }>, "many">;
                summary: z.ZodObject<{
                    totalClusters: z.ZodNumber;
                    totalSubclusters: z.ZodNumber;
                    avgClusterSize: z.ZodNumber;
                    labelingMethod: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    totalClusters: number;
                    totalSubclusters: number;
                    avgClusterSize: number;
                    labelingMethod: string;
                }, {
                    totalClusters: number;
                    totalSubclusters: number;
                    avgClusterSize: number;
                    labelingMethod: string;
                }>;
            }, "strip", z.ZodTypeAny, {
                summary: {
                    totalClusters: number;
                    totalSubclusters: number;
                    avgClusterSize: number;
                    labelingMethod: string;
                };
                topLevel: {
                    id: string;
                    label: string;
                    size: number;
                    subclusters?: {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }[] | undefined;
                }[];
            }, {
                summary: {
                    totalClusters: number;
                    totalSubclusters: number;
                    avgClusterSize: number;
                    labelingMethod: string;
                };
                topLevel: {
                    id: string;
                    label: string;
                    size: number;
                    subclusters?: {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }[] | undefined;
                }[];
            }>>;
            performance: z.ZodObject<{
                overheadMs: z.ZodNumber;
                alertsGenerated: z.ZodNumber;
                baselineEstablished: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                overheadMs: number;
                alertsGenerated: number;
                baselineEstablished: boolean;
            }, {
                overheadMs: number;
                alertsGenerated: number;
                baselineEstablished: boolean;
            }>;
        }, "strip", z.ZodTypeAny, {
            projectPath: string;
            performance: {
                overheadMs: number;
                alertsGenerated: number;
                baselineEstablished: boolean;
            };
            scanStats: {
                totalSignals: number;
                filesScanned: number;
                totalEmissions: number;
                totalConnections: number;
                scanTime: number;
                graphBuildTime: number;
            };
            unused?: {
                summary: {
                    totalOrphans: number;
                    totalDeadEmitters: number;
                    totalIsolated: number;
                    highConfidenceCount: number;
                };
                orphanSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                deadEmitters: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                isolatedSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
            } | undefined;
            clusters?: {
                summary: {
                    totalClusters: number;
                    totalSubclusters: number;
                    avgClusterSize: number;
                    labelingMethod: string;
                };
                topLevel: {
                    id: string;
                    label: string;
                    size: number;
                    subclusters?: {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }[] | undefined;
                }[];
            } | undefined;
        }, {
            projectPath: string;
            performance: {
                overheadMs: number;
                alertsGenerated: number;
                baselineEstablished: boolean;
            };
            scanStats: {
                totalSignals: number;
                filesScanned: number;
                totalEmissions: number;
                totalConnections: number;
                scanTime: number;
                graphBuildTime: number;
            };
            unused?: {
                summary: {
                    totalOrphans: number;
                    totalDeadEmitters: number;
                    totalIsolated: number;
                    highConfidenceCount: number;
                };
                orphanSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                deadEmitters: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                isolatedSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
            } | undefined;
            clusters?: {
                summary: {
                    totalClusters: number;
                    totalSubclusters: number;
                    avgClusterSize: number;
                    labelingMethod: string;
                };
                topLevel: {
                    id: string;
                    label: string;
                    size: number;
                    subclusters?: {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }[] | undefined;
                }[];
            } | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        success: true;
        timestamp: string;
        toolName: "CTS_Analyze_Project";
        result: {
            projectPath: string;
            performance: {
                overheadMs: number;
                alertsGenerated: number;
                baselineEstablished: boolean;
            };
            scanStats: {
                totalSignals: number;
                filesScanned: number;
                totalEmissions: number;
                totalConnections: number;
                scanTime: number;
                graphBuildTime: number;
            };
            unused?: {
                summary: {
                    totalOrphans: number;
                    totalDeadEmitters: number;
                    totalIsolated: number;
                    highConfidenceCount: number;
                };
                orphanSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                deadEmitters: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                isolatedSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
            } | undefined;
            clusters?: {
                summary: {
                    totalClusters: number;
                    totalSubclusters: number;
                    avgClusterSize: number;
                    labelingMethod: string;
                };
                topLevel: {
                    id: string;
                    label: string;
                    size: number;
                    subclusters?: {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }[] | undefined;
                }[];
            } | undefined;
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        success: true;
        timestamp: string;
        toolName: "CTS_Analyze_Project";
        result: {
            projectPath: string;
            performance: {
                overheadMs: number;
                alertsGenerated: number;
                baselineEstablished: boolean;
            };
            scanStats: {
                totalSignals: number;
                filesScanned: number;
                totalEmissions: number;
                totalConnections: number;
                scanTime: number;
                graphBuildTime: number;
            };
            unused?: {
                summary: {
                    totalOrphans: number;
                    totalDeadEmitters: number;
                    totalIsolated: number;
                    highConfidenceCount: number;
                };
                orphanSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                deadEmitters: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
                isolatedSignals: {
                    file: string;
                    signal: string;
                    confidence: number;
                    reason: string;
                }[];
            } | undefined;
            clusters?: {
                summary: {
                    totalClusters: number;
                    totalSubclusters: number;
                    avgClusterSize: number;
                    labelingMethod: string;
                };
                topLevel: {
                    id: string;
                    label: string;
                    size: number;
                    subclusters?: {
                        signals: string[];
                        id: string;
                        label: string;
                        size: number;
                    }[] | undefined;
                }[];
            } | undefined;
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
    readonly CTS_Suggest_Refactoring: z.ZodObject<{
        timestamp: z.ZodString;
        duration_ms: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    } & {
        toolName: z.ZodLiteral<"CTS_Suggest_Refactoring">;
        success: z.ZodLiteral<true>;
        result: z.ZodObject<{
            projectPath: z.ZodString;
            suggestions: z.ZodArray<z.ZodObject<{
                type: z.ZodEnum<["rename", "merge", "deprecate"]>;
                target: z.ZodString;
                replacement: z.ZodString;
                confidence: z.ZodNumber;
                reason: z.ZodString;
                affectedFiles: z.ZodArray<z.ZodString, "many">;
                estimatedImpact: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "rename" | "merge" | "deprecate";
                affectedFiles: string[];
                confidence: number;
                reason: string;
                target: string;
                replacement: string;
                estimatedImpact: string;
            }, {
                type: "rename" | "merge" | "deprecate";
                affectedFiles: string[];
                confidence: number;
                reason: string;
                target: string;
                replacement: string;
                estimatedImpact: string;
            }>, "many">;
            summary: z.ZodObject<{
                totalGenerated: z.ZodNumber;
                afterFiltering: z.ZodNumber;
                returned: z.ZodNumber;
                byType: z.ZodObject<{
                    merge: z.ZodNumber;
                    rename: z.ZodNumber;
                    deprecate: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    rename: number;
                    merge: number;
                    deprecate: number;
                }, {
                    rename: number;
                    merge: number;
                    deprecate: number;
                }>;
                avgConfidence: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                totalGenerated: number;
                afterFiltering: number;
                returned: number;
                byType: {
                    rename: number;
                    merge: number;
                    deprecate: number;
                };
                avgConfidence: number;
            }, {
                totalGenerated: number;
                afterFiltering: number;
                returned: number;
                byType: {
                    rename: number;
                    merge: number;
                    deprecate: number;
                };
                avgConfidence: number;
            }>;
            performance: z.ZodObject<{
                scanTime: z.ZodNumber;
                graphTime: z.ZodNumber;
                suggestionTime: z.ZodNumber;
                cacheHit: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                scanTime: number;
                graphTime: number;
                suggestionTime: number;
                cacheHit: boolean;
            }, {
                scanTime: number;
                graphTime: number;
                suggestionTime: number;
                cacheHit: boolean;
            }>;
        }, "strip", z.ZodTypeAny, {
            suggestions: {
                type: "rename" | "merge" | "deprecate";
                affectedFiles: string[];
                confidence: number;
                reason: string;
                target: string;
                replacement: string;
                estimatedImpact: string;
            }[];
            summary: {
                totalGenerated: number;
                afterFiltering: number;
                returned: number;
                byType: {
                    rename: number;
                    merge: number;
                    deprecate: number;
                };
                avgConfidence: number;
            };
            projectPath: string;
            performance: {
                scanTime: number;
                graphTime: number;
                suggestionTime: number;
                cacheHit: boolean;
            };
        }, {
            suggestions: {
                type: "rename" | "merge" | "deprecate";
                affectedFiles: string[];
                confidence: number;
                reason: string;
                target: string;
                replacement: string;
                estimatedImpact: string;
            }[];
            summary: {
                totalGenerated: number;
                afterFiltering: number;
                returned: number;
                byType: {
                    rename: number;
                    merge: number;
                    deprecate: number;
                };
                avgConfidence: number;
            };
            projectPath: string;
            performance: {
                scanTime: number;
                graphTime: number;
                suggestionTime: number;
                cacheHit: boolean;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        success: true;
        timestamp: string;
        toolName: "CTS_Suggest_Refactoring";
        result: {
            suggestions: {
                type: "rename" | "merge" | "deprecate";
                affectedFiles: string[];
                confidence: number;
                reason: string;
                target: string;
                replacement: string;
                estimatedImpact: string;
            }[];
            summary: {
                totalGenerated: number;
                afterFiltering: number;
                returned: number;
                byType: {
                    rename: number;
                    merge: number;
                    deprecate: number;
                };
                avgConfidence: number;
            };
            projectPath: string;
            performance: {
                scanTime: number;
                graphTime: number;
                suggestionTime: number;
                cacheHit: boolean;
            };
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        success: true;
        timestamp: string;
        toolName: "CTS_Suggest_Refactoring";
        result: {
            suggestions: {
                type: "rename" | "merge" | "deprecate";
                affectedFiles: string[];
                confidence: number;
                reason: string;
                target: string;
                replacement: string;
                estimatedImpact: string;
            }[];
            summary: {
                totalGenerated: number;
                afterFiltering: number;
                returned: number;
                byType: {
                    rename: number;
                    merge: number;
                    deprecate: number;
                };
                avgConfidence: number;
            };
            projectPath: string;
            performance: {
                scanTime: number;
                graphTime: number;
                suggestionTime: number;
                cacheHit: boolean;
            };
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
    readonly CTS_Render_Artifact: z.ZodObject<{
        timestamp: z.ZodString;
        duration_ms: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    } & {
        success: z.ZodLiteral<true>;
        toolName: z.ZodLiteral<"CTS_Render_Artifact">;
        result: z.ZodObject<{
            html: z.ZodString;
            artifactType: z.ZodString;
            renderer: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            html: string;
            artifactType: string;
            renderer: string;
        }, {
            html: string;
            artifactType: string;
            renderer: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        success: true;
        timestamp: string;
        toolName: "CTS_Render_Artifact";
        result: {
            html: string;
            artifactType: string;
            renderer: string;
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        success: true;
        timestamp: string;
        toolName: "CTS_Render_Artifact";
        result: {
            html: string;
            artifactType: string;
            renderer: string;
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
    readonly CTS_Export_to_Shrimp: z.ZodObject<{
        timestamp: z.ZodString;
        duration_ms: z.ZodOptional<z.ZodNumber>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    } & {
        toolName: z.ZodLiteral<"CTS_Export_to_Shrimp">;
        success: z.ZodLiteral<true>;
        result: z.ZodObject<{
            message: z.ZodString;
            conversionTime: z.ZodString;
            taskCount: z.ZodNumber;
            updateMode: z.ZodEnum<["append", "overwrite", "selective", "clearAllTasks"]>;
            shrimpTasksFormat: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodString;
                implementationGuide: z.ZodString;
                notes: z.ZodOptional<z.ZodString>;
                dependencies: z.ZodArray<z.ZodString, "many">;
                relatedFiles: z.ZodArray<z.ZodObject<{
                    path: z.ZodString;
                    type: z.ZodEnum<["TO_MODIFY", "REFERENCE", "CREATE", "DEPENDENCY", "OTHER"]>;
                    description: z.ZodString;
                    lineStart: z.ZodOptional<z.ZodNumber>;
                    lineEnd: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    path: string;
                    type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                    description: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                }, {
                    path: string;
                    type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                    description: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                }>, "many">;
                verificationCriteria: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                description: string;
                implementationGuide: string;
                dependencies: string[];
                relatedFiles: {
                    path: string;
                    type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                    description: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                }[];
                verificationCriteria: string;
                notes?: string | undefined;
            }, {
                name: string;
                description: string;
                implementationGuide: string;
                dependencies: string[];
                relatedFiles: {
                    path: string;
                    type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                    description: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                }[];
                verificationCriteria: string;
                notes?: string | undefined;
            }>, "many">;
            instructions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            message: string;
            conversionTime: string;
            taskCount: number;
            updateMode: "append" | "overwrite" | "selective" | "clearAllTasks";
            shrimpTasksFormat: {
                name: string;
                description: string;
                implementationGuide: string;
                dependencies: string[];
                relatedFiles: {
                    path: string;
                    type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                    description: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                }[];
                verificationCriteria: string;
                notes?: string | undefined;
            }[];
            instructions: string[];
        }, {
            message: string;
            conversionTime: string;
            taskCount: number;
            updateMode: "append" | "overwrite" | "selective" | "clearAllTasks";
            shrimpTasksFormat: {
                name: string;
                description: string;
                implementationGuide: string;
                dependencies: string[];
                relatedFiles: {
                    path: string;
                    type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                    description: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                }[];
                verificationCriteria: string;
                notes?: string | undefined;
            }[];
            instructions: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        success: true;
        timestamp: string;
        toolName: "CTS_Export_to_Shrimp";
        result: {
            message: string;
            conversionTime: string;
            taskCount: number;
            updateMode: "append" | "overwrite" | "selective" | "clearAllTasks";
            shrimpTasksFormat: {
                name: string;
                description: string;
                implementationGuide: string;
                dependencies: string[];
                relatedFiles: {
                    path: string;
                    type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                    description: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                }[];
                verificationCriteria: string;
                notes?: string | undefined;
            }[];
            instructions: string[];
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        success: true;
        timestamp: string;
        toolName: "CTS_Export_to_Shrimp";
        result: {
            message: string;
            conversionTime: string;
            taskCount: number;
            updateMode: "append" | "overwrite" | "selective" | "clearAllTasks";
            shrimpTasksFormat: {
                name: string;
                description: string;
                implementationGuide: string;
                dependencies: string[];
                relatedFiles: {
                    path: string;
                    type: "TO_MODIFY" | "REFERENCE" | "CREATE" | "DEPENDENCY" | "OTHER";
                    description: string;
                    lineStart?: number | undefined;
                    lineEnd?: number | undefined;
                }[];
                verificationCriteria: string;
                notes?: string | undefined;
            }[];
            instructions: string[];
        };
        duration_ms?: number | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
};
/**
 * Validate tool response against schema
 */
export declare function validateToolResponse(toolName: keyof typeof ToolSchemas, response: unknown): {
    valid: boolean;
    errors?: z.ZodError;
};
/**
 * Type exports for TypeScript
 */
export type BaseToolResponse = z.infer<typeof BaseToolResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ReasoningResponse = z.infer<typeof ReasoningResponseSchema>;
export type ScanSignalsResponse = z.infer<typeof ScanSignalsResponseSchema>;
export type BughunterResponse = z.infer<typeof BughunterResponseSchema>;
export type AuditResponse = z.infer<typeof AuditResponseSchema>;
export type AnalyzeProjectResponse = z.infer<typeof AnalyzeProjectResponseSchema>;
export type SuggestRefactoringResponse = z.infer<typeof SuggestRefactoringResponseSchema>;
export type RenderArtifactResponse = z.infer<typeof RenderArtifactResponseSchema>;
export type ExportToShrimpResponse = z.infer<typeof ExportToShrimpResponseSchema>;
//# sourceMappingURL=schemas.d.ts.map