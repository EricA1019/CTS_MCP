/**
 * Tool Response Schemas
 * Standardized response formats for all CTS MCP tools
 */
import { z } from 'zod';
/**
 * Base response schema for all tools
 */
export const BaseToolResponseSchema = z.object({
    success: z.boolean(),
    timestamp: z.string().datetime(),
    duration_ms: z.number().optional(),
    metadata: z.record(z.unknown()).optional(),
});
/**
 * Error response schema
 */
export const ErrorResponseSchema = BaseToolResponseSchema.extend({
    success: z.literal(false),
    error: z.object({
        category: z.enum(['VALIDATION', 'PARSING', 'EXECUTION', 'FILESYSTEM', 'CONFIGURATION', 'NETWORK', 'INTERNAL', 'RESOURCE']),
        severity: z.enum(['ERROR', 'WARNING', 'INFO']),
        message: z.string(),
        details: z.record(z.unknown()).optional(),
        suggestions: z.array(z.object({
            action: z.string(),
            details: z.string(),
            example: z.string().optional(),
            documentationUrl: z.string().url().optional(),
        })),
        errorCode: z.string().optional(),
    }),
});
/**
 * CTS_Reasoning response schema
 */
export const ReasoningResponseSchema = BaseToolResponseSchema.extend({
    toolName: z.literal('CTS_Reasoning'),
    success: z.literal(true),
    result: z.object({
        reasoning_chain: z.array(z.object({
            iteration: z.number(),
            stage: z.string(),
            thought: z.string(),
            assumptions_challenged: z.array(z.string()),
            axioms_used: z.array(z.string()),
            tags: z.array(z.string()),
            next_thought_needed: z.boolean(),
            prompt_used: z.string().nullable(),
        })),
        summary: z.object({
            topic: z.string(),
            total_iterations: z.number(),
            converged: z.boolean(),
            final_stage: z.string(),
            total_assumptions_challenged: z.number(),
            total_axioms_used: z.number(),
            unique_tags: z.array(z.string()),
        }),
        final_state: z.object({
            thought: z.string(),
            thought_number: z.number(),
            total_thoughts: z.number(),
            next_thought_needed: z.boolean(),
            stage: z.string(),
            assumptions_challenged: z.array(z.string()),
            axioms_used: z.array(z.string()),
            tags: z.array(z.string()),
        }),
    }),
});
/**
 * CTS_Scan_Project_Signals response schema
 */
export const ScanSignalsResponseSchema = BaseToolResponseSchema.extend({
    success: z.literal(true),
    toolName: z.literal('CTS_Scan_Project_Signals'),
    result: z.object({
        projectPath: z.string(),
        totalSignals: z.number(),
        eventBusSignals: z.number(),
        signalBusSignals: z.number(),
        signals: z.array(z.object({
            name: z.string(),
            file: z.string(),
            line: z.number(),
            source: z.string(),
            params: z.array(z.string()),
        })),
        rendered: z.boolean(),
        html: z.string().optional(),
        cached: z.boolean().optional(),
    }),
});
/**
 * CTS_Bughunter response schema
 */
export const BughunterResponseSchema = BaseToolResponseSchema.extend({
    success: z.literal(true),
    toolName: z.literal('CTS_Bughunter'),
    result: z.object({
        bugs: z.array(z.object({
            file: z.string(),
            line: z.number(),
            severity: z.enum(['low', 'medium', 'high', 'critical']),
            category: z.string(),
            message: z.string(),
            suggestion: z.string().optional(),
            codeSnippet: z.string().optional(),
        })),
        stats: z.object({
            totalBugs: z.number(),
            bySeverity: z.record(z.number()),
            byCategory: z.record(z.number()),
            filesScanned: z.number(),
            duration_ms: z.number(),
        }),
    }),
});
/**
 * cts_audit response schema
 */
export const AuditResponseSchema = BaseToolResponseSchema.extend({
    toolName: z.literal('cts_audit'),
    success: z.literal(true),
    result: z.object({
        report: z.object({
            overallScore: z.number().min(0).max(100),
            categoryScores: z.object({
                cts: z.number(),
                code_quality: z.number(),
                project_structure: z.number(),
            }),
            violations: z.array(z.object({
                file: z.string(),
                line: z.number(),
                severity: z.enum(['error', 'warning', 'info']),
                message: z.string(),
                ruleId: z.string(),
                category: z.string(),
            })),
            violationsByRule: z.record(z.number()),
            recommendations: z.array(z.object({
                priority: z.enum(['critical', 'high', 'medium', 'low']),
                action: z.string(),
                affectedFiles: z.array(z.string()),
                estimatedEffort: z.enum(['low', 'medium', 'high']),
                ruleId: z.string(),
            })),
            metrics: z.object({
                loc: z.object({
                    total: z.number(),
                    byFile: z.record(z.number()),
                    average: z.number(),
                }),
                complexity: z.object({
                    total: z.number(),
                    byFile: z.record(z.number()),
                    average: z.number(),
                }),
                testCoverage: z.number().optional(),
            }),
            summary: z.object({
                totalViolations: z.number(),
                errorCount: z.number(),
                warningCount: z.number(),
                infoCount: z.number(),
            }),
        }),
        performance: z.object({
            durationMs: z.number(),
            rulesChecked: z.number(),
            metricsCollected: z.boolean(),
        }),
        format: z.enum(['json', 'markdown']),
        markdown: z.string().optional(),
    }),
});
/**
 * CTS_Analyze_Project response schema
 */
export const AnalyzeProjectResponseSchema = BaseToolResponseSchema.extend({
    toolName: z.literal('CTS_Analyze_Project'),
    success: z.literal(true),
    result: z.object({
        projectPath: z.string(),
        scanStats: z.object({
            filesScanned: z.number(),
            totalSignals: z.number(),
            totalEmissions: z.number(),
            totalConnections: z.number(),
            scanTime: z.number(),
            graphBuildTime: z.number(),
        }),
        unused: z.object({
            orphanSignals: z.array(z.object({
                signal: z.string(),
                file: z.string(),
                confidence: z.number(),
                reason: z.string(),
            })),
            deadEmitters: z.array(z.object({
                signal: z.string(),
                file: z.string(),
                confidence: z.number(),
                reason: z.string(),
            })),
            isolatedSignals: z.array(z.object({
                signal: z.string(),
                file: z.string(),
                confidence: z.number(),
                reason: z.string(),
            })),
            summary: z.object({
                totalOrphans: z.number(),
                totalDeadEmitters: z.number(),
                totalIsolated: z.number(),
                highConfidenceCount: z.number(),
            }),
        }).optional(),
        clusters: z.object({
            topLevel: z.array(z.object({
                id: z.string(),
                label: z.string(),
                size: z.number(),
                subclusters: z.array(z.object({
                    id: z.string(),
                    label: z.string(),
                    size: z.number(),
                    signals: z.array(z.string()),
                })).optional(),
            })),
            summary: z.object({
                totalClusters: z.number(),
                totalSubclusters: z.number(),
                avgClusterSize: z.number(),
                labelingMethod: z.string(),
            }),
        }).optional(),
        performance: z.object({
            overheadMs: z.number(),
            alertsGenerated: z.number(),
            baselineEstablished: z.boolean(),
        }),
    }),
});
/**
 * CTS_Suggest_Refactoring response schema
 */
export const SuggestRefactoringResponseSchema = BaseToolResponseSchema.extend({
    toolName: z.literal('CTS_Suggest_Refactoring'),
    success: z.literal(true),
    result: z.object({
        projectPath: z.string(),
        suggestions: z.array(z.object({
            type: z.enum(['rename', 'merge', 'deprecate']),
            target: z.string(),
            replacement: z.string(),
            confidence: z.number().min(0).max(1),
            reason: z.string(),
            affectedFiles: z.array(z.string()),
            estimatedImpact: z.string(),
        })),
        summary: z.object({
            totalGenerated: z.number(),
            afterFiltering: z.number(),
            returned: z.number(),
            byType: z.object({
                merge: z.number(),
                rename: z.number(),
                deprecate: z.number(),
            }),
            avgConfidence: z.number(),
        }),
        performance: z.object({
            scanTime: z.number(),
            graphTime: z.number(),
            suggestionTime: z.number(),
            cacheHit: z.boolean(),
        }),
    }),
});
/**
 * CTS_Render_Artifact response schema
 */
export const RenderArtifactResponseSchema = BaseToolResponseSchema.extend({
    success: z.literal(true),
    toolName: z.literal('CTS_Render_Artifact'),
    result: z.object({
        html: z.string(),
        artifactType: z.string(),
        renderer: z.string(),
    }),
});
/**
 * CTS_Export_to_Shrimp response schema
 */
export const ExportToShrimpResponseSchema = BaseToolResponseSchema.extend({
    toolName: z.literal('CTS_Export_to_Shrimp'),
    success: z.literal(true),
    result: z.object({
        message: z.string(),
        conversionTime: z.string(),
        taskCount: z.number(),
        updateMode: z.enum(['append', 'overwrite', 'selective', 'clearAllTasks']),
        shrimpTasksFormat: z.array(z.object({
            name: z.string(),
            description: z.string(),
            implementationGuide: z.string(),
            notes: z.string().optional(),
            dependencies: z.array(z.string()),
            relatedFiles: z.array(z.object({
                path: z.string(),
                type: z.enum(['TO_MODIFY', 'REFERENCE', 'CREATE', 'DEPENDENCY', 'OTHER']),
                description: z.string(),
                lineStart: z.number().optional(),
                lineEnd: z.number().optional(),
            })),
            verificationCriteria: z.string(),
        })),
        instructions: z.array(z.string()),
    }),
});
/**
 * Schema registry for validation
 */
export const ToolSchemas = {
    CTS_Reasoning: ReasoningResponseSchema,
    CTS_Scan_Project_Signals: ScanSignalsResponseSchema,
    CTS_Bughunter: BughunterResponseSchema,
    cts_audit: AuditResponseSchema,
    CTS_Analyze_Project: AnalyzeProjectResponseSchema,
    CTS_Suggest_Refactoring: SuggestRefactoringResponseSchema,
    CTS_Render_Artifact: RenderArtifactResponseSchema,
    CTS_Export_to_Shrimp: ExportToShrimpResponseSchema,
};
/**
 * Validate tool response against schema
 */
export function validateToolResponse(toolName, response) {
    const schema = ToolSchemas[toolName];
    if (!schema) {
        return { valid: false, errors: undefined };
    }
    const result = schema.safeParse(response);
    return {
        valid: result.success,
        errors: result.success ? undefined : result.error,
    };
}
//# sourceMappingURL=schemas.js.map