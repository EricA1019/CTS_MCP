/**
 * TemplateRenderer
 * Simple Mustache-style template rendering without external dependencies
 */
export declare class TemplateRenderer {
    /**
     * Render a template with variables
     * Supports {{variable}} syntax and {{#if condition}}...{{/if}} conditionals
     */
    render(template: string, variables: Record<string, unknown>): string;
    /**
     * Process conditional blocks
     */
    private processConditionals;
    /**
     * Substitute variables in template
     */
    private substituteVariables;
    /**
     * Escape special characters for safe output
     */
    private escapeValue;
    /**
     * Validate template syntax
     */
    validateTemplate(template: string): boolean;
    /**
     * Extract variable names from template
     */
    extractVariables(template: string): string[];
}
//# sourceMappingURL=template_renderer.d.ts.map