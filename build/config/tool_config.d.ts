/**
 * Tool Configuration Management
 * User-configurable settings for CTS MCP tools
 *
 * Following Quinn's testing methodology:
 * - Comprehensive validation
 * - Type-safe defaults
 * - Hot-reload support
 */
import { z } from 'zod';
export declare const BughunterConfigSchema: z.ZodObject<{
    minSeverity: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    maxFiles: z.ZodDefault<z.ZodNumber>;
    excludePatterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    enableCache: z.ZodDefault<z.ZodBoolean>;
    cacheTTL: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    excludePatterns: string[];
    minSeverity: "low" | "medium" | "high" | "critical";
    maxFiles: number;
    enableCache: boolean;
    cacheTTL: number;
}, {
    excludePatterns?: string[] | undefined;
    minSeverity?: "low" | "medium" | "high" | "critical" | undefined;
    maxFiles?: number | undefined;
    enableCache?: boolean | undefined;
    cacheTTL?: number | undefined;
}>;
export type BughunterConfig = z.infer<typeof BughunterConfigSchema>;
/**
 * Audit configuration
 */
export declare const AuditConfigSchema: z.ZodObject<{
    categories: z.ZodDefault<z.ZodArray<z.ZodEnum<["cts", "code_quality", "project_structure"]>, "many">>;
    minScore: z.ZodDefault<z.ZodNumber>;
    format: z.ZodDefault<z.ZodEnum<["json", "markdown"]>>;
    maxViolations: z.ZodDefault<z.ZodNumber>;
    enableCache: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    format: "json" | "markdown";
    enableCache: boolean;
    categories: ("cts" | "code_quality" | "project_structure")[];
    minScore: number;
    maxViolations: number;
}, {
    format?: "json" | "markdown" | undefined;
    enableCache?: boolean | undefined;
    categories?: ("cts" | "code_quality" | "project_structure")[] | undefined;
    minScore?: number | undefined;
    maxViolations?: number | undefined;
}>;
export type AuditConfig = z.infer<typeof AuditConfigSchema>;
/**
 * Signal scanning configuration
 */
export declare const SignalScanConfigSchema: z.ZodObject<{
    renderMap: z.ZodDefault<z.ZodBoolean>;
    excludePatterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    includePrivate: z.ZodDefault<z.ZodBoolean>;
    maxSignals: z.ZodDefault<z.ZodNumber>;
    enableCache: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    excludePatterns: string[];
    enableCache: boolean;
    renderMap: boolean;
    includePrivate: boolean;
    maxSignals: number;
}, {
    excludePatterns?: string[] | undefined;
    enableCache?: boolean | undefined;
    renderMap?: boolean | undefined;
    includePrivate?: boolean | undefined;
    maxSignals?: number | undefined;
}>;
export type SignalScanConfig = z.infer<typeof SignalScanConfigSchema>;
/**
 * Analysis configuration
 */
export declare const AnalysisConfigSchema: z.ZodObject<{
    detectUnused: z.ZodDefault<z.ZodBoolean>;
    buildHierarchy: z.ZodDefault<z.ZodBoolean>;
    minClusterSize: z.ZodDefault<z.ZodNumber>;
    performanceBaseline: z.ZodDefault<z.ZodBoolean>;
    enableCache: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enableCache: boolean;
    detectUnused: boolean;
    buildHierarchy: boolean;
    minClusterSize: number;
    performanceBaseline: boolean;
}, {
    enableCache?: boolean | undefined;
    detectUnused?: boolean | undefined;
    buildHierarchy?: boolean | undefined;
    minClusterSize?: number | undefined;
    performanceBaseline?: boolean | undefined;
}>;
export type AnalysisConfig = z.infer<typeof AnalysisConfigSchema>;
/**
 * Refactoring configuration
 */
export declare const RefactoringConfigSchema: z.ZodObject<{
    includeRename: z.ZodDefault<z.ZodBoolean>;
    includeMerge: z.ZodDefault<z.ZodBoolean>;
    includeDeprecate: z.ZodDefault<z.ZodBoolean>;
    minConfidence: z.ZodDefault<z.ZodNumber>;
    maxSuggestions: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    includeRename: boolean;
    includeMerge: boolean;
    includeDeprecate: boolean;
    minConfidence: number;
    maxSuggestions: number;
}, {
    includeRename?: boolean | undefined;
    includeMerge?: boolean | undefined;
    includeDeprecate?: boolean | undefined;
    minConfidence?: number | undefined;
    maxSuggestions?: number | undefined;
}>;
export type RefactoringConfig = z.infer<typeof RefactoringConfigSchema>;
/**
 * Reasoning configuration
 */
export declare const ReasoningConfigSchema: z.ZodObject<{
    maxIterations: z.ZodDefault<z.ZodNumber>;
    initialStage: z.ZodDefault<z.ZodEnum<["Problem Definition", "Information Gathering", "Analysis", "Synthesis", "Conclusion", "Critical Questioning"]>>;
    enableCache: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    maxIterations: number;
    initialStage: "Problem Definition" | "Information Gathering" | "Analysis" | "Synthesis" | "Conclusion" | "Critical Questioning";
    enableCache: boolean;
}, {
    maxIterations?: number | undefined;
    initialStage?: "Problem Definition" | "Information Gathering" | "Analysis" | "Synthesis" | "Conclusion" | "Critical Questioning" | undefined;
    enableCache?: boolean | undefined;
}>;
export type ReasoningConfig = z.infer<typeof ReasoningConfigSchema>;
/**
 * Global tool configuration
 */
export declare const ToolConfigSchema: z.ZodObject<{
    bughunter: z.ZodOptional<z.ZodObject<{
        minSeverity: z.ZodOptional<z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>>;
        maxFiles: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        excludePatterns: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        enableCache: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        cacheTTL: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        excludePatterns?: string[] | undefined;
        minSeverity?: "low" | "medium" | "high" | "critical" | undefined;
        maxFiles?: number | undefined;
        enableCache?: boolean | undefined;
        cacheTTL?: number | undefined;
    }, {
        excludePatterns?: string[] | undefined;
        minSeverity?: "low" | "medium" | "high" | "critical" | undefined;
        maxFiles?: number | undefined;
        enableCache?: boolean | undefined;
        cacheTTL?: number | undefined;
    }>>;
    audit: z.ZodOptional<z.ZodObject<{
        categories: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodEnum<["cts", "code_quality", "project_structure"]>, "many">>>;
        minScore: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        format: z.ZodOptional<z.ZodDefault<z.ZodEnum<["json", "markdown"]>>>;
        maxViolations: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        enableCache: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        format?: "json" | "markdown" | undefined;
        enableCache?: boolean | undefined;
        categories?: ("cts" | "code_quality" | "project_structure")[] | undefined;
        minScore?: number | undefined;
        maxViolations?: number | undefined;
    }, {
        format?: "json" | "markdown" | undefined;
        enableCache?: boolean | undefined;
        categories?: ("cts" | "code_quality" | "project_structure")[] | undefined;
        minScore?: number | undefined;
        maxViolations?: number | undefined;
    }>>;
    signalScan: z.ZodOptional<z.ZodObject<{
        renderMap: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        excludePatterns: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        includePrivate: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        maxSignals: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        enableCache: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        excludePatterns?: string[] | undefined;
        enableCache?: boolean | undefined;
        renderMap?: boolean | undefined;
        includePrivate?: boolean | undefined;
        maxSignals?: number | undefined;
    }, {
        excludePatterns?: string[] | undefined;
        enableCache?: boolean | undefined;
        renderMap?: boolean | undefined;
        includePrivate?: boolean | undefined;
        maxSignals?: number | undefined;
    }>>;
    analysis: z.ZodOptional<z.ZodObject<{
        detectUnused: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        buildHierarchy: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        minClusterSize: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        performanceBaseline: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        enableCache: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        enableCache?: boolean | undefined;
        detectUnused?: boolean | undefined;
        buildHierarchy?: boolean | undefined;
        minClusterSize?: number | undefined;
        performanceBaseline?: boolean | undefined;
    }, {
        enableCache?: boolean | undefined;
        detectUnused?: boolean | undefined;
        buildHierarchy?: boolean | undefined;
        minClusterSize?: number | undefined;
        performanceBaseline?: boolean | undefined;
    }>>;
    refactoring: z.ZodOptional<z.ZodObject<{
        includeRename: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        includeMerge: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        includeDeprecate: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        minConfidence: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        maxSuggestions: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        includeRename?: boolean | undefined;
        includeMerge?: boolean | undefined;
        includeDeprecate?: boolean | undefined;
        minConfidence?: number | undefined;
        maxSuggestions?: number | undefined;
    }, {
        includeRename?: boolean | undefined;
        includeMerge?: boolean | undefined;
        includeDeprecate?: boolean | undefined;
        minConfidence?: number | undefined;
        maxSuggestions?: number | undefined;
    }>>;
    reasoning: z.ZodOptional<z.ZodObject<{
        maxIterations: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        initialStage: z.ZodOptional<z.ZodDefault<z.ZodEnum<["Problem Definition", "Information Gathering", "Analysis", "Synthesis", "Conclusion", "Critical Questioning"]>>>;
        enableCache: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        maxIterations?: number | undefined;
        initialStage?: "Problem Definition" | "Information Gathering" | "Analysis" | "Synthesis" | "Conclusion" | "Critical Questioning" | undefined;
        enableCache?: boolean | undefined;
    }, {
        maxIterations?: number | undefined;
        initialStage?: "Problem Definition" | "Information Gathering" | "Analysis" | "Synthesis" | "Conclusion" | "Critical Questioning" | undefined;
        enableCache?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    bughunter?: {
        excludePatterns?: string[] | undefined;
        minSeverity?: "low" | "medium" | "high" | "critical" | undefined;
        maxFiles?: number | undefined;
        enableCache?: boolean | undefined;
        cacheTTL?: number | undefined;
    } | undefined;
    audit?: {
        format?: "json" | "markdown" | undefined;
        enableCache?: boolean | undefined;
        categories?: ("cts" | "code_quality" | "project_structure")[] | undefined;
        minScore?: number | undefined;
        maxViolations?: number | undefined;
    } | undefined;
    signalScan?: {
        excludePatterns?: string[] | undefined;
        enableCache?: boolean | undefined;
        renderMap?: boolean | undefined;
        includePrivate?: boolean | undefined;
        maxSignals?: number | undefined;
    } | undefined;
    analysis?: {
        enableCache?: boolean | undefined;
        detectUnused?: boolean | undefined;
        buildHierarchy?: boolean | undefined;
        minClusterSize?: number | undefined;
        performanceBaseline?: boolean | undefined;
    } | undefined;
    refactoring?: {
        includeRename?: boolean | undefined;
        includeMerge?: boolean | undefined;
        includeDeprecate?: boolean | undefined;
        minConfidence?: number | undefined;
        maxSuggestions?: number | undefined;
    } | undefined;
    reasoning?: {
        maxIterations?: number | undefined;
        initialStage?: "Problem Definition" | "Information Gathering" | "Analysis" | "Synthesis" | "Conclusion" | "Critical Questioning" | undefined;
        enableCache?: boolean | undefined;
    } | undefined;
}, {
    bughunter?: {
        excludePatterns?: string[] | undefined;
        minSeverity?: "low" | "medium" | "high" | "critical" | undefined;
        maxFiles?: number | undefined;
        enableCache?: boolean | undefined;
        cacheTTL?: number | undefined;
    } | undefined;
    audit?: {
        format?: "json" | "markdown" | undefined;
        enableCache?: boolean | undefined;
        categories?: ("cts" | "code_quality" | "project_structure")[] | undefined;
        minScore?: number | undefined;
        maxViolations?: number | undefined;
    } | undefined;
    signalScan?: {
        excludePatterns?: string[] | undefined;
        enableCache?: boolean | undefined;
        renderMap?: boolean | undefined;
        includePrivate?: boolean | undefined;
        maxSignals?: number | undefined;
    } | undefined;
    analysis?: {
        enableCache?: boolean | undefined;
        detectUnused?: boolean | undefined;
        buildHierarchy?: boolean | undefined;
        minClusterSize?: number | undefined;
        performanceBaseline?: boolean | undefined;
    } | undefined;
    refactoring?: {
        includeRename?: boolean | undefined;
        includeMerge?: boolean | undefined;
        includeDeprecate?: boolean | undefined;
        minConfidence?: number | undefined;
        maxSuggestions?: number | undefined;
    } | undefined;
    reasoning?: {
        maxIterations?: number | undefined;
        initialStage?: "Problem Definition" | "Information Gathering" | "Analysis" | "Synthesis" | "Conclusion" | "Critical Questioning" | undefined;
        enableCache?: boolean | undefined;
    } | undefined;
}>;
export type ToolConfig = z.infer<typeof ToolConfigSchema>;
/**
 * Configuration manager with validation and defaults
 */
export declare class ConfigManager {
    private config;
    constructor(userConfig?: ToolConfig);
    /**
     * Get configuration for specific tool
     */
    getBughunterConfig(): BughunterConfig;
    getAuditConfig(): AuditConfig;
    getSignalScanConfig(): SignalScanConfig;
    getAnalysisConfig(): AnalysisConfig;
    getRefactoringConfig(): RefactoringConfig;
    getReasoningConfig(): ReasoningConfig;
    /**
     * Update configuration (hot-reload)
     */
    updateConfig(updates: ToolConfig): void;
    /**
     * Reset to defaults
     */
    resetToDefaults(): void;
    /**
     * Get full configuration
     */
    getFullConfig(): ToolConfig;
    /**
     * Validate user configuration
     */
    static validate(userConfig: unknown): {
        valid: boolean;
        errors?: string[];
    };
}
/**
 * Global configuration instance
 */
export declare const globalConfig: ConfigManager;
//# sourceMappingURL=tool_config.d.ts.map