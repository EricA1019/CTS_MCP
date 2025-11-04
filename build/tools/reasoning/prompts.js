/**
 * Reasoning Prompt Templates
 *
 * Stage-specific prompt templates for guided reasoning iteration.
 * Supports variable substitution for contextualized prompts.
 *
 * @module tools/reasoning/prompts
 */
/**
 * Stage-specific reasoning prompt templates
 */
export const STAGE_TEMPLATES = [
    {
        stage: 'Problem Definition',
        description: 'Define and clarify the problem space',
        variables: ['topic', 'context'],
        prompt: `**Problem Definition Stage**

Topic: {{topic}}
Context: {{context}}

Define the core problem:
- What is the central question or challenge?
- What are the boundaries of this problem?
- What constraints exist?
- What is the desired outcome?`,
    },
    {
        stage: 'Information Gathering',
        description: 'Collect relevant data and background information',
        variables: ['topic', 'sources'],
        prompt: `**Information Gathering Stage**

Topic: {{topic}}
Sources to consider: {{sources}}

Gather relevant information:
- What data is available?
- What are the known facts?
- What research has been done?
- What gaps in information exist?`,
    },
    {
        stage: 'Analysis',
        description: 'Examine patterns, relationships, and implications',
        variables: ['topic', 'data'],
        prompt: `**Analysis Stage**

Topic: {{topic}}
Data: {{data}}

Analyze the information:
- What patterns emerge?
- What relationships exist between elements?
- What are the implications?
- What cause-and-effect chains can be identified?`,
    },
    {
        stage: 'Synthesis',
        description: 'Combine insights into coherent understanding',
        variables: ['topic', 'insights'],
        prompt: `**Synthesis Stage**

Topic: {{topic}}
Key insights: {{insights}}

Synthesize understanding:
- How do the pieces fit together?
- What unified explanation emerges?
- What new perspective does this create?
- What is the integrated solution?`,
    },
    {
        stage: 'Conclusion',
        description: 'Draw final conclusions and recommendations',
        variables: ['topic', 'findings'],
        prompt: `**Conclusion Stage**

Topic: {{topic}}
Findings: {{findings}}

Draw conclusions:
- What is the final answer or solution?
- What recommendations can be made?
- What are the next steps?
- What confidence level exists in this conclusion?`,
    },
    {
        stage: 'Critical Questioning',
        description: 'Challenge assumptions and test validity',
        variables: ['topic', 'assumptions'],
        prompt: `**Critical Questioning Stage**

Topic: {{topic}}
Current assumptions: {{assumptions}}

Challenge the thinking:
- What assumptions might be wrong?
- What alternative explanations exist?
- What edge cases haven't been considered?
- What could invalidate this reasoning?`,
    },
];
/**
 * Get template for a specific stage
 *
 * @param stage - Reasoning stage name
 * @returns Template for the stage, or undefined if not found
 */
export function getStageTemplate(stage) {
    return STAGE_TEMPLATES.find((t) => t.stage === stage);
}
/**
 * Substitute variables in template prompt
 *
 * @param template - Template with {{variable}} placeholders
 * @param data - Data object with variable values
 * @returns Prompt with substituted values
 */
export function substituteVariables(template, data) {
    let result = template;
    // Replace all {{variable}} placeholders
    for (const [key, value] of Object.entries(data)) {
        const placeholder = `{{${key}}}`;
        const replacement = String(value ?? '(not provided)');
        result = result.replace(new RegExp(placeholder, 'g'), replacement);
    }
    // Replace any remaining unmatched placeholders with (not provided)
    result = result.replace(/\{\{(\w+)\}\}/g, '(not provided)');
    return result;
}
/**
 * Get all available stage names
 *
 * @returns Array of stage names
 */
export function getAvailableStages() {
    return STAGE_TEMPLATES.map((t) => t.stage);
}
/**
 * Render a complete prompt for a stage with context
 *
 * @param stage - Reasoning stage
 * @param context - Context data
 * @returns Rendered prompt, or null if stage not found
 */
export function renderPrompt(stage, context) {
    const template = getStageTemplate(stage);
    if (!template) {
        return null;
    }
    return substituteVariables(template.prompt, context);
}
//# sourceMappingURL=prompts.js.map