/**
 * Tool-specific prompt templates
 * Provides dynamic prompts after tool execution
 */
import { TemplateRenderer } from './template_renderer.js';
const renderer = new TemplateRenderer();
/**
 * Prompt after scanning project signals
 */
export const SCAN_SIGNALS_PROMPT = {
    name: 'cts_scan_signals_result',
    description: 'Guidance after scanning project signals',
    arguments: [
        { name: 'signalCount', description: 'Total number of signals found', required: true },
        { name: 'fileCount', description: 'Number of files scanned', required: true },
        { name: 'hasIssues', description: 'Whether issues were detected', required: false },
    ],
    render(args) {
        const signalCount = Number(args.signalCount || 0);
        const fileCount = Number(args.fileCount || 0);
        const hasIssues = Boolean(args.hasIssues || false);
        const template = `Found {{signalCount}} signals across {{fileCount}} files.{{#if hasIssues}} Issues detected - review recommendations below.{{/if}}`;
        const description = renderer.render(template, args);
        const messages = [
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: `I've scanned the project and found ${signalCount} signals. ${hasIssues
                        ? 'There are some CTS compliance issues that need attention. Review the signal map artifact for visualization and follow the recommendations to improve signal architecture.'
                        : 'The signal architecture looks good! You can visualize the signal map using the CTS_Render_Artifact tool.'}`,
                },
            },
        ];
        return { description, messages };
    },
};
/**
 * Prompt after analyzing project
 */
export const ANALYZE_PROJECT_PROMPT = {
    name: 'cts_analyze_project_result',
    description: 'Guidance after project analysis',
    arguments: [
        { name: 'analysisType', description: 'Type of analysis performed', required: true },
        { name: 'issueCount', description: 'Number of issues found', required: true },
        { name: 'complianceScore', description: 'CTS compliance percentage', required: false },
    ],
    render(args) {
        const analysisType = String(args.analysisType || 'general');
        const issueCount = Number(args.issueCount || 0);
        const complianceScore = Number(args.complianceScore || 100);
        const template = `{{analysisType}} analysis complete: {{issueCount}} issues found. Compliance: {{complianceScore}}%`;
        const description = renderer.render(template, args);
        const messages = [
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: `Project analysis (${analysisType}) is complete. ${issueCount > 0
                        ? `Found ${issueCount} issues requiring attention. CTS compliance score: ${complianceScore}%. Review the analysis report and apply suggested refactorings using CTS_Suggest_Refactoring.`
                        : `Great! No issues found. Your project maintains ${complianceScore}% CTS compliance.`}`,
                },
            },
        ];
        return { description, messages };
    },
};
/**
 * Prompt after suggesting refactorings
 */
export const SUGGEST_REFACTORING_PROMPT = {
    name: 'cts_suggest_refactoring_result',
    description: 'Guidance after generating refactoring suggestions',
    arguments: [
        { name: 'targetFile', description: 'File being refactored', required: true },
        { name: 'suggestionCount', description: 'Number of suggestions', required: true },
        { name: 'priority', description: 'Priority level (high/medium/low)', required: false },
    ],
    render(args) {
        const targetFile = String(args.targetFile || 'unknown');
        const suggestionCount = Number(args.suggestionCount || 0);
        const priority = String(args.priority || 'medium');
        const template = `{{suggestionCount}} refactoring suggestions for {{targetFile}} ({{priority}} priority)`;
        const description = renderer.render(template, args);
        const messages = [
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: `Generated ${suggestionCount} refactoring suggestions for ${targetFile}. Priority: ${priority}. Review each suggestion carefully and apply them incrementally. Test after each change to ensure functionality is preserved.`,
                },
            },
        ];
        return { description, messages };
    },
};
/**
 * Prompt after rendering artifact
 */
export const RENDER_ARTIFACT_PROMPT = {
    name: 'cts_render_artifact_result',
    description: 'Guidance after rendering visualization artifact',
    arguments: [
        { name: 'artifactType', description: 'Type of artifact rendered', required: true },
        { name: 'dataPoints', description: 'Number of data points visualized', required: false },
        { name: 'renderTime', description: 'Rendering time in ms', required: false },
    ],
    render(args) {
        const artifactType = String(args.artifactType || 'unknown');
        const dataPoints = args.dataPoints ? Number(args.dataPoints) : undefined;
        const renderTime = args.renderTime ? Number(args.renderTime) : undefined;
        const template = `Rendered {{artifactType}} artifact{{#if dataPoints}} with {{dataPoints}} data points{{/if}}`;
        const description = renderer.render(template, args);
        const messages = [
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: `Artifact rendered successfully: ${artifactType}.${dataPoints ? ` Visualizing ${dataPoints} data points.` : ''}${renderTime ? ` Render time: ${renderTime}ms.` : ''} The artifact should now be visible in the editor. Use it to identify patterns and optimization opportunities.`,
                },
            },
        ];
        return { description, messages };
    },
};
/**
 * Prompt after exporting to Shrimp
 */
export const EXPORT_TO_SHRIMP_PROMPT = {
    name: 'cts_export_to_shrimp_result',
    description: 'Guidance after exporting tasks to Shrimp',
    arguments: [
        { name: 'taskCount', description: 'Number of tasks exported', required: true },
        { name: 'exportPath', description: 'Export file path', required: false },
        { name: 'success', description: 'Whether export succeeded', required: true },
    ],
    render(args) {
        const taskCount = Number(args.taskCount || 0);
        const exportPath = String(args.exportPath || 'shrimp_tasks.json');
        const success = Boolean(args.success || false);
        const template = `{{#if success}}Exported {{taskCount}} tasks to {{exportPath}}{{/if}}`;
        const description = renderer.render(template, args);
        const messages = [
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: success
                        ? `Successfully exported ${taskCount} tasks to ${exportPath}. You can now use Shrimp MCP to manage and execute these tasks. Run 'shrimp list' to view all tasks.`
                        : 'Export failed. Check the error message and ensure the target directory is writable.',
                },
            },
        ];
        return { description, messages };
    },
};
/**
 * Error recovery prompt
 */
export const ERROR_RECOVERY_PROMPT = {
    name: 'cts_error_recovery',
    description: 'Guidance after tool execution error',
    arguments: [
        { name: 'toolName', description: 'Tool that encountered error', required: true },
        { name: 'errorType', description: 'Type of error', required: true },
        { name: 'suggestion', description: 'Recovery suggestion', required: false },
    ],
    render(args) {
        const toolName = String(args.toolName || 'unknown');
        const errorType = String(args.errorType || 'unknown');
        const suggestion = String(args.suggestion || 'Check tool parameters and try again');
        const template = `Error in {{toolName}}: {{errorType}}`;
        const description = renderer.render(template, args);
        const messages = [
            {
                role: 'assistant',
                content: {
                    type: 'text',
                    text: `The ${toolName} tool encountered an error (${errorType}). ${suggestion}. If the issue persists, check the server logs for detailed error information.`,
                },
            },
        ];
        return { description, messages };
    },
};
// Export all prompts as a collection
export const ALL_TOOL_PROMPTS = [
    SCAN_SIGNALS_PROMPT,
    ANALYZE_PROJECT_PROMPT,
    SUGGEST_REFACTORING_PROMPT,
    RENDER_ARTIFACT_PROMPT,
    EXPORT_TO_SHRIMP_PROMPT,
    ERROR_RECOVERY_PROMPT,
];
//# sourceMappingURL=tool_prompts.js.map