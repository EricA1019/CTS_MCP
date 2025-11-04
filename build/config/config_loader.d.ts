/**
 * Configuration Loader for CTS MCP
 *
 * Loads .ctsrc.json configuration files with cascading resolution:
 * 1. Project-level: <projectPath>/.ctsrc.json
 * 2. User-level: ~/.ctsrc.json
 * 3. Defaults: hardcoded in schemas
 *
 * Features:
 * - File-based configuration (JSON)
 * - Hot-reload with file watching
 * - Cascading config resolution
 * - CTS rule customization (file size, hop size, etc.)
 * - Team-specific standards
 *
 * Following Quinn's testing methodology:
 * - Comprehensive validation with Zod
 * - Type-safe configuration
 * - Error handling for missing/invalid files
 * - Observable config changes
 */
import { z } from 'zod';
import { ToolConfig, ConfigManager } from './tool_config.js';
/**
 * CTS Rule Thresholds
 * Customizable limits for CTS compliance rules
 */
export declare const CTSRuleThresholdsSchema: z.ZodObject<{
    maxFileLines: z.ZodDefault<z.ZodNumber>;
    maxFunctionLines: z.ZodDefault<z.ZodNumber>;
    maxClassLines: z.ZodDefault<z.ZodNumber>;
    maxHopLOC: z.ZodDefault<z.ZodNumber>;
    maxSubHops: z.ZodDefault<z.ZodNumber>;
    maxCyclomaticComplexity: z.ZodDefault<z.ZodNumber>;
    maxNestingDepth: z.ZodDefault<z.ZodNumber>;
    minSignalUsage: z.ZodDefault<z.ZodNumber>;
    maxDirectCalls: z.ZodDefault<z.ZodNumber>;
    requireTypeHints: z.ZodDefault<z.ZodBoolean>;
    requireDocstrings: z.ZodDefault<z.ZodBoolean>;
    minTestCoverage: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    maxFileLines: number;
    maxFunctionLines: number;
    maxClassLines: number;
    maxHopLOC: number;
    maxSubHops: number;
    maxCyclomaticComplexity: number;
    maxNestingDepth: number;
    minSignalUsage: number;
    maxDirectCalls: number;
    requireTypeHints: boolean;
    requireDocstrings: boolean;
    minTestCoverage: number;
}, {
    maxFileLines?: number | undefined;
    maxFunctionLines?: number | undefined;
    maxClassLines?: number | undefined;
    maxHopLOC?: number | undefined;
    maxSubHops?: number | undefined;
    maxCyclomaticComplexity?: number | undefined;
    maxNestingDepth?: number | undefined;
    minSignalUsage?: number | undefined;
    maxDirectCalls?: number | undefined;
    requireTypeHints?: boolean | undefined;
    requireDocstrings?: boolean | undefined;
    minTestCoverage?: number | undefined;
}>;
export type CTSRuleThresholds = z.infer<typeof CTSRuleThresholdsSchema>;
/**
 * Project-level .ctsrc.json schema
 *
 * Example:
 * ```json
 * {
 *   "rules": {
 *     "maxFileLines": 750,
 *     "requireTypeHints": false
 *   },
 *   "exclusions": ["..tests/..", "..examples/.."],
 *   "tools": {
 *     "audit": {
 *       "minScore": 75
 *     }
 *   }
 * }
 * ```
 */
export declare const ProjectConfigSchema: z.ZodObject<{
    rules: z.ZodOptional<z.ZodObject<{
        maxFileLines: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        maxFunctionLines: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        maxClassLines: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        maxHopLOC: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        maxSubHops: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        maxCyclomaticComplexity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        maxNestingDepth: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        minSignalUsage: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        maxDirectCalls: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        requireTypeHints: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        requireDocstrings: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        minTestCoverage: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        maxFileLines?: number | undefined;
        maxFunctionLines?: number | undefined;
        maxClassLines?: number | undefined;
        maxHopLOC?: number | undefined;
        maxSubHops?: number | undefined;
        maxCyclomaticComplexity?: number | undefined;
        maxNestingDepth?: number | undefined;
        minSignalUsage?: number | undefined;
        maxDirectCalls?: number | undefined;
        requireTypeHints?: boolean | undefined;
        requireDocstrings?: boolean | undefined;
        minTestCoverage?: number | undefined;
    }, {
        maxFileLines?: number | undefined;
        maxFunctionLines?: number | undefined;
        maxClassLines?: number | undefined;
        maxHopLOC?: number | undefined;
        maxSubHops?: number | undefined;
        maxCyclomaticComplexity?: number | undefined;
        maxNestingDepth?: number | undefined;
        minSignalUsage?: number | undefined;
        maxDirectCalls?: number | undefined;
        requireTypeHints?: boolean | undefined;
        requireDocstrings?: boolean | undefined;
        minTestCoverage?: number | undefined;
    }>>;
    exclusions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tools: z.ZodOptional<z.ZodObject<{
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
    }>>;
    team: z.ZodOptional<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        standards: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        standards?: string | undefined;
    }, {
        name?: string | undefined;
        standards?: string | undefined;
    }>>;
    version: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    version: string;
    rules?: {
        maxFileLines?: number | undefined;
        maxFunctionLines?: number | undefined;
        maxClassLines?: number | undefined;
        maxHopLOC?: number | undefined;
        maxSubHops?: number | undefined;
        maxCyclomaticComplexity?: number | undefined;
        maxNestingDepth?: number | undefined;
        minSignalUsage?: number | undefined;
        maxDirectCalls?: number | undefined;
        requireTypeHints?: boolean | undefined;
        requireDocstrings?: boolean | undefined;
        minTestCoverage?: number | undefined;
    } | undefined;
    exclusions?: string[] | undefined;
    tools?: {
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
    } | undefined;
    team?: {
        name?: string | undefined;
        standards?: string | undefined;
    } | undefined;
}, {
    version?: string | undefined;
    rules?: {
        maxFileLines?: number | undefined;
        maxFunctionLines?: number | undefined;
        maxClassLines?: number | undefined;
        maxHopLOC?: number | undefined;
        maxSubHops?: number | undefined;
        maxCyclomaticComplexity?: number | undefined;
        maxNestingDepth?: number | undefined;
        minSignalUsage?: number | undefined;
        maxDirectCalls?: number | undefined;
        requireTypeHints?: boolean | undefined;
        requireDocstrings?: boolean | undefined;
        minTestCoverage?: number | undefined;
    } | undefined;
    exclusions?: string[] | undefined;
    tools?: {
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
    } | undefined;
    team?: {
        name?: string | undefined;
        standards?: string | undefined;
    } | undefined;
}>;
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;
/**
 * Merged configuration after cascading resolution
 */
export interface MergedConfig {
    rules: CTSRuleThresholds;
    exclusions: string[];
    tools: ToolConfig;
    team?: {
        name?: string;
        standards?: string;
    };
    sources: {
        project?: string;
        user?: string;
        defaults: true;
    };
}
/**
 * Configuration change event
 */
export type ConfigChangeHandler = (config: MergedConfig) => void;
/**
 * Configuration Loader
 *
 * Manages cascading configuration loading and hot-reload
 */
export declare class ConfigLoader {
    private mergedConfig;
    private configManager;
    private projectConfigPath?;
    private userConfigPath;
    private watchers;
    private changeHandlers;
    constructor();
    /**
     * Load configuration for a specific project
     *
     * Cascading resolution:
     * 1. Load user config (~/.ctsrc.json)
     * 2. Load project config (<projectPath>/.ctsrc.json)
     * 3. Merge with defaults
     *
     * @param projectPath - Absolute path to project directory
     * @returns Merged configuration
     */
    loadConfig(projectPath: string): MergedConfig;
    /**
     * Enable hot-reload for configuration files
     *
     * Watches project and user config files for changes
     * and automatically reloads configuration
     *
     * @param projectPath - Project directory to watch
     */
    enableHotReload(projectPath: string): void;
    /**
     * Stop watching configuration files
     */
    stopWatching(): void;
    /**
     * Register a handler for configuration changes
     *
     * @param handler - Callback function called when config changes
     */
    onConfigChange(handler: ConfigChangeHandler): void;
    /**
     * Unregister a configuration change handler
     */
    offConfigChange(handler: ConfigChangeHandler): void;
    /**
     * Get current merged configuration
     */
    getConfig(): MergedConfig;
    /**
     * Get tool configuration manager
     */
    getToolConfigManager(): ConfigManager;
    /**
     * Load configuration from a file
     *
     * @param filePath - Path to .ctsrc.json file
     * @returns Parsed config or null if file doesn't exist/invalid
     */
    private loadConfigFile;
    /**
     * Merge two configurations (right overrides left)
     */
    private mergeConfigs;
    /**
     * Get default configuration
     */
    private getDefaultConfig;
    /**
     * Notify all handlers of configuration change
     */
    private notifyConfigChange;
    /**
     * Create example .ctsrc.json file content
     *
     * @returns JSON string with all configuration options documented
     */
    static generateExampleConfig(): string;
}
/**
 * Global config loader instance
 */
export declare const globalConfigLoader: ConfigLoader;
//# sourceMappingURL=config_loader.d.ts.map