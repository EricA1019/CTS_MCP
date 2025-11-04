/**
 * Reasoning Prompt Templates
 *
 * Stage-specific prompt templates for guided reasoning iteration.
 * Supports variable substitution for contextualized prompts.
 *
 * @module tools/reasoning/prompts
 */
/**
 * Prompt template structure
 */
export interface PromptTemplate {
    stage: string;
    prompt: string;
    variables: string[];
    description: string;
}
/**
 * Stage-specific reasoning prompt templates
 */
export declare const STAGE_TEMPLATES: PromptTemplate[];
/**
 * Get template for a specific stage
 *
 * @param stage - Reasoning stage name
 * @returns Template for the stage, or undefined if not found
 */
export declare function getStageTemplate(stage: string): PromptTemplate | undefined;
/**
 * Substitute variables in template prompt
 *
 * @param template - Template with {{variable}} placeholders
 * @param data - Data object with variable values
 * @returns Prompt with substituted values
 */
export declare function substituteVariables(template: string, data: Record<string, unknown>): string;
/**
 * Get all available stage names
 *
 * @returns Array of stage names
 */
export declare function getAvailableStages(): string[];
/**
 * Render a complete prompt for a stage with context
 *
 * @param stage - Reasoning stage
 * @param context - Context data
 * @returns Rendered prompt, or null if stage not found
 */
export declare function renderPrompt(stage: string, context: Record<string, unknown>): string | null;
//# sourceMappingURL=prompts.d.ts.map