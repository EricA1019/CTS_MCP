/**
 * Tool-specific prompt templates
 * Provides dynamic prompts after tool execution
 */
import { PromptTemplate } from '../types.js';
/**
 * Prompt after scanning project signals
 */
export declare const SCAN_SIGNALS_PROMPT: PromptTemplate;
/**
 * Prompt after analyzing project
 */
export declare const ANALYZE_PROJECT_PROMPT: PromptTemplate;
/**
 * Prompt after suggesting refactorings
 */
export declare const SUGGEST_REFACTORING_PROMPT: PromptTemplate;
/**
 * Prompt after rendering artifact
 */
export declare const RENDER_ARTIFACT_PROMPT: PromptTemplate;
/**
 * Prompt after exporting to Shrimp
 */
export declare const EXPORT_TO_SHRIMP_PROMPT: PromptTemplate;
/**
 * Error recovery prompt
 */
export declare const ERROR_RECOVERY_PROMPT: PromptTemplate;
export declare const ALL_TOOL_PROMPTS: PromptTemplate[];
//# sourceMappingURL=tool_prompts.d.ts.map