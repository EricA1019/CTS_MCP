/**
 * CTS Audit Tool - MCP Wrapper
 *
 * Audits GDScript projects for CTS compliance, code quality, and project structure.
 * Returns comprehensive reports with scoring and actionable recommendations.
 */
import { z } from 'zod';
import { ALL_RULES } from './checkers.js';
import { collectMetrics } from './metrics.js';
import { generateReport, formatMarkdown } from './reporter.js';
import { validateToolResponse } from '../../schemas.js';
import { Errors } from '../../errors.js';
import { truncateLargeArrays, checkResponseSize } from '../../sampling/index.js';
import { executeRulesParallel, shouldUseParallel } from '../../parallel/rule_executor.js';
import { join, relative } from 'path';
import { globalConfigLoader } from '../../config/config_loader.js';
export const AuditInputSchema = z.object({
    projectPath: z.string().describe('Path to the Godot project to audit'),
    categories: z
        .array(z.enum(['cts', 'code_quality', 'project_structure']))
        .optional()
        .describe('Categories to audit (default: all)'),
    minScore: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe('Minimum score threshold (0-100, default: 0)'),
    format: z
        .enum(['json', 'markdown'])
        .optional()
        .describe('Output format (default: json)'),
    noCache: z
        .boolean()
        .optional()
        .describe('Disable file hash cache for this run (default: false)'),
});
export const auditTool = {
    name: 'cts_audit',
    description: `Audit a Godot GDScript project for CTS compliance, code quality, and project structure.

Returns a comprehensive report with:
- Overall score (0-100) and category scores
- Violations with file locations and severity
- Actionable recommendations with effort estimates
- Project metrics (LOC, complexity, test coverage)

Categories:
- cts: CTS standards (file size, signal-first, hop size, templates)
- code_quality: Type hints, error handling, complexity, naming
- project_structure: Addon integration, directory organization

Usage:
{
  "projectPath": "/path/to/godot/project",
  "categories": ["cts", "code_quality"],
  "minScore": 75,
  "format": "markdown"
}`,
    inputSchema: {
        type: 'object',
        properties: {
            projectPath: {
                type: 'string',
                description: 'Path to the Godot project to audit',
            },
            categories: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['cts', 'code_quality', 'project_structure'],
                },
                description: 'Categories to audit (default: all)',
            },
            minScore: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Minimum score threshold (0-100, default: 0)',
            },
            format: {
                type: 'string',
                enum: ['json', 'markdown'],
                description: 'Output format (default: json)',
            },
        },
        required: ['projectPath'],
    },
};
/**
 * Create MCP audit handler
 */
export function createAuditHandler() {
    return async (input) => {
        const startTime = performance.now();
        try {
            // Validate input
            const validationResult = AuditInputSchema.safeParse(input);
            if (!validationResult.success) {
                throw Errors.validationError('input', 'AuditInputSchema', validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
            }
            const validInput = validationResult.data;
            // Load project configuration
            const projectConfig = globalConfigLoader.loadConfig(validInput.projectPath);
            console.log(`[cts_audit] Loaded config from: ${JSON.stringify(projectConfig.sources)}`);
            console.log(`[cts_audit] File size limit: ${projectConfig.rules.maxFileLines} lines`);
            // Recursively collect all files
            const allFiles = [];
            async function collectFiles(dir, basePath) {
                const entries = await readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = join(dir, entry.name);
                    if (entry.isDirectory()) {
                        // Skip hidden and generated directories
                        if (!entry.name.startsWith('.') && entry.name !== 'addons') {
                            await collectFiles(fullPath, basePath);
                        }
                    }
                    else {
                        allFiles.push(relative(basePath, fullPath));
                    }
                }
            }
            await collectFiles(validInput.projectPath, validInput.projectPath);
            // Filter by categories
            const selectedCategories = validInput.categories || ['cts', 'code_quality', 'project_structure'];
            const rules = ALL_RULES.filter((rule) => selectedCategories.includes(rule.category));
            if (rules.length === 0) {
                throw Errors.invalidInput('categories', `No rules found for selected categories: ${selectedCategories.join(', ')}`);
            }
            // Create audit context
            const context = {
                projectPath: validInput.projectPath,
                files: allFiles,
                config: projectConfig.rules, // Pass config to checkers
            };
            // Collect project metrics
            const metrics = await collectMetrics(validInput.projectPath, allFiles);
            // Run compliance checks (parallel or sequential based on project size)
            let results;
            const useParallel = shouldUseParallel(rules.length, allFiles.length);
            if (useParallel) {
                console.log(`⚡ Running ${rules.length} rules in parallel (4 workers max)...`);
                results = await executeRulesParallel(rules, context, 4, // max workers
                (completed, total, ruleId) => {
                    console.log(`Progress: ${completed}/${total} rules complete (${ruleId})`);
                });
            }
            else {
                console.log(`🔄 Running ${rules.length} rules sequentially (project too small for parallel execution)...`);
                results = [];
                for (const rule of rules) {
                    const result = await rule.check(context);
                    results.push({ ...result, rule });
                }
            }
            // Generate report
            const report = generateReport(results, metrics);
            // Check minimum score threshold
            const minScore = validInput.minScore ?? 0;
            if (report.overallScore < minScore) {
                throw Errors.mcpError('AUDIT_THRESHOLD_FAILED', `Overall score ${report.overallScore.toFixed(1)}/100 is below threshold ${minScore}/100`, { report, threshold: minScore });
            }
            const endTime = performance.now();
            const duration = endTime - startTime;
            // Check performance target (<5s)
            if (duration > 5000) {
                console.warn(`⚠️ Audit took ${Math.round(duration)}ms (target: <5000ms)`);
            }
            // Format response using BaseToolResponse pattern
            // Check if response is too large and truncate if needed
            const truncatedReport = truncateLargeArrays(report, 100);
            const sizeCheck = checkResponseSize(truncatedReport, 60000);
            if (sizeCheck.truncated) {
                console.warn(`⚠️ Audit report truncated from ${Math.round(sizeCheck.originalSize / 1024)}KB to prevent buffer overflow`);
            }
            const response = {
                success: true,
                timestamp: new Date().toISOString(),
                toolName: 'cts_audit',
                duration_ms: Math.round(duration),
                result: {
                    report: truncatedReport,
                    performance: {
                        durationMs: Math.round(duration),
                        rulesChecked: rules.length,
                        metricsCollected: true,
                    },
                    format: validInput.format || 'json',
                    markdown: validInput.format === 'markdown' ? formatMarkdown(truncatedReport) : undefined,
                    _sizeInfo: sizeCheck.truncated ? {
                        truncated: true,
                        originalSize: sizeCheck.originalSize,
                        truncatedFields: truncatedReport._truncated,
                    } : undefined,
                },
            };
            // Validate response format
            const validation = validateToolResponse('cts_audit', response);
            if (!validation.valid) {
                throw Errors.validationError('response', 'AuditResponse', validation.errors?.errors[0]?.message || 'Unknown validation error');
            }
            return response;
        }
        catch (error) {
            // Re-throw enhanced errors
            throw error;
        }
    };
}
//# sourceMappingURL=index.js.map