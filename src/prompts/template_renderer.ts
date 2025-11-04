/**
 * TemplateRenderer
 * Simple Mustache-style template rendering without external dependencies
 */

export class TemplateRenderer {
  /**
   * Render a template with variables
   * Supports {{variable}} syntax and {{#if condition}}...{{/if}} conditionals
   */
  render(template: string, variables: Record<string, unknown>): string {
    let result = template;

    // Handle conditionals first: {{#if variable}}...{{/if}}
    result = this.processConditionals(result, variables);

    // Handle variable substitution: {{variable}}
    result = this.substituteVariables(result, variables);

    return result;
  }

  /**
   * Process conditional blocks
   */
  private processConditionals(template: string, variables: Record<string, unknown>): string {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return template.replace(conditionalRegex, (match, varName, content) => {
      const value = variables[varName];
      // Show content if variable is truthy
      if (value) {
        return content;
      }
      return '';
    });
  }

  /**
   * Substitute variables in template
   */
  private substituteVariables(template: string, variables: Record<string, unknown>): string {
    const variableRegex = /\{\{(\w+)\}\}/g;
    
    return template.replace(variableRegex, (match, varName) => {
      const value = variables[varName];
      
      if (value === undefined || value === null) {
        return match; // Keep placeholder if variable not found
      }
      
      // Convert to string and escape special characters
      return this.escapeValue(String(value));
    });
  }

  /**
   * Escape special characters for safe output
   */
  private escapeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Validate template syntax
   */
  validateTemplate(template: string): boolean {
    try {
      // Check for balanced conditional blocks
      const openIfs = (template.match(/\{\{#if\s+\w+\}\}/g) || []).length;
      const closeIfs = (template.match(/\{\{\/if\}\}/g) || []).length;
      
      if (openIfs !== closeIfs) {
        return false;
      }

      // Check for valid variable syntax
      const variables = template.match(/\{\{(\w+)\}\}/g) || [];
      for (const variable of variables) {
        if (!/^\{\{\w+\}\}$/.test(variable)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract variable names from template
   */
  extractVariables(template: string): string[] {
    const variables = new Set<string>();
    
    // Extract from {{variable}}
    const variableMatches = template.matchAll(/\{\{(\w+)\}\}/g);
    for (const match of variableMatches) {
      variables.add(match[1]);
    }
    
    // Extract from {{#if variable}}
    const conditionalMatches = template.matchAll(/\{\{#if\s+(\w+)\}\}/g);
    for (const match of conditionalMatches) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }
}
