/**
 * CTS Bughunter Tool - MCP Integration
 *
 * Heuristic-based bug detection for Godot projects with pattern matching.
 * Identifies common coding errors and GDScript-specific antipatterns.
 */
import { z } from 'zod';
import { scanForBugs, filterBySeverity } from './scanner.js';
import { formatReport } from './reporter.js';
import { validateToolResponse } from '../../schemas.js';
import { Errors } from '../../errors.js';
/**
 * Zod schema for bughunter parameters
 */
const BughunterParamsSchema = z.object({
    projectPath: z.string().describe('Path to Godot project directory'),
    excludePatterns: z.array(z.string()).default(['**/addons/**', '**/.godot/**']).describe('File patterns to exclude from scan'),
    minSeverity: z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('Minimum severity level to report'),
    exportFormat: z.enum(['json', 'markdown', 'cts_plan']).default('json').describe('Output format for bug report'),
    maxFiles: z.number().min(1).max(10000).optional().describe('Maximum files to scan (for large projects)'),
});
/**
 * Tool definition for MCP protocol
 */
export const bughunterTool = {
    name: 'CTS_Bughunter',
    description: 'Scan Godot project for potential bugs using heuristic pattern detection. Identifies common errors (null checks, error handling, type mismatches) and GDScript-specific issues (signal leaks, unfreed nodes, ready checks). Returns severity-scored bug report with line numbers and fix suggestions.',
    inputSchema: {
        type: 'object',
        properties: {
            projectPath: {
                type: 'string',
                description: 'Path to Godot project directory',
            },
            excludePatterns: {
                type: 'array',
                description: 'File patterns to exclude from scan (e.g., **/addons/**, **/.godot/**)',
                items: { type: 'string' },
                default: ['**/addons/**', '**/.godot/**'],
            },
            minSeverity: {
                type: 'string',
                description: 'Minimum severity level to include in report',
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'medium',
            },
            exportFormat: {
                type: 'string',
                description: 'Output format for bug report',
                enum: ['json', 'markdown', 'cts_plan'],
                default: 'json',
            },
            maxFiles: {
                type: 'number',
                description: 'Maximum files to scan (useful for large projects)',
                minimum: 1,
                maximum: 10000,
            },
        },
        required: ['projectPath'],
    },
};
/**
 * Create tool handler for bughunter
 */
export function createBughunterHandler() {
    return async (args) => {
        try {
            // Validate input parameters
            const params = BughunterParamsSchema.parse(args);
            console.error(`[CTS Bughunter] Starting scan of ${params.projectPath}`);
            console.error(`[CTS Bughunter] Min severity: ${params.minSeverity}, Format: ${params.exportFormat}`);
            const startTime = Date.now();
            // Scan project for bugs
            const report = await scanForBugs(params.projectPath, {
                maxFiles: params.maxFiles,
            });
            const scanDuration = Date.now() - startTime;
            console.error(`[CTS Bughunter] Scan complete: ${report.totalBugs} bugs found in ${report.totalFiles} files`);
            console.error(`[CTS Bughunter] Severity breakdown: ${report.severityBreakdown.critical} critical, ${report.severityBreakdown.high} high, ${report.severityBreakdown.medium} medium, ${report.severityBreakdown.low} low`);
            console.error(`[CTS Bughunter] Quality score: ${report.overallScore}/100`);
            console.error(`[CTS Bughunter] Scan took ${scanDuration}ms`);
            // Filter by minimum severity
            const filteredBugs = filterBySeverity(report, params.minSeverity);
            // Create filtered report
            const filteredReport = {
                ...report,
                totalBugs: filteredBugs.length,
                severityBreakdown: {
                    critical: filteredBugs.filter(b => b.severity === 'critical').length,
                    high: filteredBugs.filter(b => b.severity === 'high').length,
                    medium: filteredBugs.filter(b => b.severity === 'medium').length,
                    low: filteredBugs.filter(b => b.severity === 'low').length,
                },
                byFile: report.byFile.map(fileReport => ({
                    ...fileReport,
                    bugs: fileReport.bugs.filter(bug => {
                        const severityLevels = ['low', 'medium', 'high', 'critical'];
                        const minLevel = severityLevels.indexOf(params.minSeverity);
                        const bugLevel = severityLevels.indexOf(bug.severity);
                        return bugLevel >= minLevel;
                    }),
                })).filter(fileReport => fileReport.bugs.length > 0),
            };
            // Format report
            const formattedReport = formatReport(filteredReport, params.exportFormat);
            // Check performance target (<3s for reasonable project size)
            if (scanDuration > 3000 && report.totalFiles < 1000) {
                console.error(`[CTS Bughunter] WARNING: Scan exceeded 3s target (${scanDuration}ms for ${report.totalFiles} files)`);
            }
            // Build response in BaseToolResponse format
            const response = {
                success: true,
                timestamp: new Date().toISOString(),
                toolName: 'CTS_Bughunter',
                duration_ms: scanDuration,
                result: {
                    bugs: filteredBugs.map(bug => ({
                        file: bug.file || '',
                        line: bug.line,
                        severity: bug.severity,
                        category: bug.pattern,
                        message: bug.message,
                        suggestion: bug.suggestion,
                    })),
                    stats: {
                        totalBugs: filteredBugs.length,
                        bySeverity: filteredReport.severityBreakdown,
                        byCategory: {}, // TODO: Add category breakdown from scanner
                        filesScanned: report.totalFiles,
                        duration_ms: scanDuration,
                    },
                },
            };
            // Validate response schema before returning
            const { valid, errors } = validateToolResponse('CTS_Bughunter', response);
            if (!valid) {
                throw Errors.validationError('response', 'BughunterResponse', errors?.errors[0]?.message || 'Invalid response structure');
            }
            return response;
        }
        catch (error) {
            console.error('[CTS Bughunter] Error during scan:', error);
            // Return MCP-compliant error format
            const errorData = error instanceof z.ZodError
                ? {
                    code: -32602, // Invalid params
                    message: 'Invalid bughunter parameters',
                    validationErrors: error.errors,
                }
                : {
                    code: -32603, // Internal error
                    message: error instanceof Error ? error.message : 'Unknown error during bug scan',
                    errorType: error?.constructor?.name,
                };
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ error: errorData }, null, 2),
                    },
                ],
            };
        }
    };
}
//# sourceMappingURL=index.js.map