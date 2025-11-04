/**
 * CTS Audit Tool - MCP Wrapper
 *
 * Audits GDScript projects for CTS compliance, code quality, and project structure.
 * Returns comprehensive reports with scoring and actionable recommendations.
 */
import { z } from 'zod';
import type { ToolDefinition } from '../../types.js';
export declare const AuditInputSchema: z.ZodObject<{
    projectPath: z.ZodString;
    categories: z.ZodOptional<z.ZodArray<z.ZodEnum<["cts", "code_quality", "project_structure"]>, "many">>;
    minScore: z.ZodOptional<z.ZodNumber>;
    format: z.ZodOptional<z.ZodEnum<["json", "markdown"]>>;
    noCache: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    projectPath: string;
    format?: "json" | "markdown" | undefined;
    categories?: ("cts" | "code_quality" | "project_structure")[] | undefined;
    minScore?: number | undefined;
    noCache?: boolean | undefined;
}, {
    projectPath: string;
    format?: "json" | "markdown" | undefined;
    categories?: ("cts" | "code_quality" | "project_structure")[] | undefined;
    minScore?: number | undefined;
    noCache?: boolean | undefined;
}>;
export type AuditInput = z.infer<typeof AuditInputSchema>;
export declare const auditTool: ToolDefinition;
/**
 * Create MCP audit handler
 */
export declare function createAuditHandler(): (input: unknown) => Promise<{
    success: true;
    timestamp: string;
    toolName: "cts_audit";
    duration_ms: number;
    result: {
        report: Record<string, unknown> & {
            _truncated?: string[];
        };
        performance: {
            durationMs: number;
            rulesChecked: number;
            metricsCollected: boolean;
        };
        format: "json" | "markdown";
        markdown: string | undefined;
        _sizeInfo: {
            truncated: boolean;
            originalSize: number;
            truncatedFields: string[] | undefined;
        } | undefined;
    };
}>;
//# sourceMappingURL=index.d.ts.map