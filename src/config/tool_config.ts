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

// ==========================================
// Schema: Bughunter Configuration
// ==========================================
export const BughunterConfigSchema = z.object({
  minSeverity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  maxFiles: z.number().min(1).max(10000).default(1000),
  excludePatterns: z.array(z.string()).default(['**/addons/**', '**/.godot/**']),
  enableCache: z.boolean().default(true),
  cacheTTL: z.number().min(0).default(3600000), // 1 hour
});

export type BughunterConfig = z.infer<typeof BughunterConfigSchema>;

/**
 * Audit configuration
 */
export const AuditConfigSchema = z.object({
  categories: z.array(z.enum(['cts', 'code_quality', 'project_structure'])).default(['cts', 'code_quality', 'project_structure']),
  minScore: z.number().min(0).max(100).default(0),
  format: z.enum(['json', 'markdown']).default('json'),
  maxViolations: z.number().min(10).max(1000).default(100),
  enableCache: z.boolean().default(true),
});

export type AuditConfig = z.infer<typeof AuditConfigSchema>;

/**
 * Signal scanning configuration
 */
export const SignalScanConfigSchema = z.object({
  renderMap: z.boolean().default(true),
  excludePatterns: z.array(z.string()).default(['**/addons/**', '**/.godot/**']),
  includePrivate: z.boolean().default(false),
  maxSignals: z.number().min(10).max(10000).default(1000),
  enableCache: z.boolean().default(true),
});

export type SignalScanConfig = z.infer<typeof SignalScanConfigSchema>;

/**
 * Analysis configuration
 */
export const AnalysisConfigSchema = z.object({
  detectUnused: z.boolean().default(true),
  buildHierarchy: z.boolean().default(true),
  minClusterSize: z.number().min(2).max(10).default(5),
  performanceBaseline: z.boolean().default(false),
  enableCache: z.boolean().default(true),
});

export type AnalysisConfig = z.infer<typeof AnalysisConfigSchema>;

/**
 * Refactoring configuration
 */
export const RefactoringConfigSchema = z.object({
  includeRename: z.boolean().default(true),
  includeMerge: z.boolean().default(true),
  includeDeprecate: z.boolean().default(false),
  minConfidence: z.number().min(0).max(1).default(0.95),
  maxSuggestions: z.number().min(1).max(100).default(20),
});

export type RefactoringConfig = z.infer<typeof RefactoringConfigSchema>;

/**
 * Reasoning configuration
 */
export const ReasoningConfigSchema = z.object({
  maxIterations: z.number().min(1).max(50).default(10),
  initialStage: z.enum(['Problem Definition', 'Information Gathering', 'Analysis', 'Synthesis', 'Conclusion', 'Critical Questioning']).default('Problem Definition'),
  enableCache: z.boolean().default(false), // Reasoning should be fresh
});

export type ReasoningConfig = z.infer<typeof ReasoningConfigSchema>;

/**
 * Deep partial type for nested configuration updates
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? Partial<T[P]> : T[P];
};

/**
 * Partial schemas for user input (allow partial nested objects)
 */
const PartialBughunterConfigSchema = BughunterConfigSchema.partial();
const PartialAuditConfigSchema = AuditConfigSchema.partial();
const PartialSignalScanConfigSchema = SignalScanConfigSchema.partial();
const PartialAnalysisConfigSchema = AnalysisConfigSchema.partial();
const PartialRefactoringConfigSchema = RefactoringConfigSchema.partial();
const PartialReasoningConfigSchema = ReasoningConfigSchema.partial();

/**
 * Global tool configuration
 */
export const ToolConfigSchema = z.object({
  bughunter: PartialBughunterConfigSchema.optional(),
  audit: PartialAuditConfigSchema.optional(),
  signalScan: PartialSignalScanConfigSchema.optional(),
  analysis: PartialAnalysisConfigSchema.optional(),
  refactoring: PartialRefactoringConfigSchema.optional(),
  reasoning: PartialReasoningConfigSchema.optional(),
});

export type ToolConfig = z.infer<typeof ToolConfigSchema>;

/**
 * Configuration manager with validation and defaults
 */
export class ConfigManager {
  private config: {
    bughunter: BughunterConfig;
    audit: AuditConfig;
    signalScan: SignalScanConfig;
    analysis: AnalysisConfig;
    refactoring: RefactoringConfig;
    reasoning: ReasoningConfig;
  };
  
  constructor(userConfig: ToolConfig = {}) {
    // Validate user input and merge with defaults
    const validated = ToolConfigSchema.parse(userConfig);
    this.config = {
      bughunter: BughunterConfigSchema.parse(validated.bughunter || {}),
      audit: AuditConfigSchema.parse(validated.audit || {}),
      signalScan: SignalScanConfigSchema.parse(validated.signalScan || {}),
      analysis: AnalysisConfigSchema.parse(validated.analysis || {}),
      refactoring: RefactoringConfigSchema.parse(validated.refactoring || {}),
      reasoning: ReasoningConfigSchema.parse(validated.reasoning || {}),
    };
  }
  
  /**
   * Get configuration for specific tool
   */
  getBughunterConfig(): BughunterConfig {
    return this.config.bughunter;
  }
  
  getAuditConfig(): AuditConfig {
    return this.config.audit;
  }
  
  getSignalScanConfig(): SignalScanConfig {
    return this.config.signalScan;
  }
  
  getAnalysisConfig(): AnalysisConfig {
    return this.config.analysis;
  }
  
  getRefactoringConfig(): RefactoringConfig {
    return this.config.refactoring;
  }
  
  getReasoningConfig(): ReasoningConfig {
    return this.config.reasoning;
  }
  
  /**
   * Update configuration (hot-reload)
   */
  updateConfig(updates: ToolConfig): void {
    const validated = ToolConfigSchema.parse(updates);
    this.config = {
      bughunter: BughunterConfigSchema.parse({ ...this.config.bughunter, ...validated.bughunter }),
      audit: AuditConfigSchema.parse({ ...this.config.audit, ...validated.audit }),
      signalScan: SignalScanConfigSchema.parse({ ...this.config.signalScan, ...validated.signalScan }),
      analysis: AnalysisConfigSchema.parse({ ...this.config.analysis, ...validated.analysis }),
      refactoring: RefactoringConfigSchema.parse({ ...this.config.refactoring, ...validated.refactoring }),
      reasoning: ReasoningConfigSchema.parse({ ...this.config.reasoning, ...validated.reasoning }),
    };
  }
  
  /**
   * Reset to defaults
   */
  resetToDefaults(): void {
    this.config = {
      bughunter: BughunterConfigSchema.parse({}),
      audit: AuditConfigSchema.parse({}),
      signalScan: SignalScanConfigSchema.parse({}),
      analysis: AnalysisConfigSchema.parse({}),
      refactoring: RefactoringConfigSchema.parse({}),
      reasoning: ReasoningConfigSchema.parse({}),
    };
  }
  
  /**
   * Get full configuration
   */
  getFullConfig(): ToolConfig {
    return { ...this.config };
  }
  
  /**
   * Validate user configuration
   */
  static validate(userConfig: unknown): { valid: boolean; errors?: string[] } {
    const result = ToolConfigSchema.safeParse(userConfig);
    if (result.success) {
      return { valid: true };
    }
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }
}

/**
 * Global configuration instance
 */
export const globalConfig = new ConfigManager();
