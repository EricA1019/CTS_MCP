/**
 * CTS Suggest Refactoring Tool
 * AI-powered refactoring suggestions for signal names
 *
 * NOTE: This tool currently uses TreeSitterBridge (native bindings).
 * Migration to WASM parser (utils/tree_sitter.ts) is planned for future releases.
 * See: docs/mcp_upgrade_plan.md Tier 1 Task 3
 */
import { z } from 'zod';
import { validateToolResponse } from '../schemas.js';
import { Errors } from '../errors.js';
import { TreeSitterBridge } from '../artifacts/parsers/tree_sitter_bridge.js';
import { ProjectScanner } from '../artifacts/scanner/index.js';
import { SignalGraphBuilder } from '../artifacts/graph/index.js';
import { SignalExtractor } from '../artifacts/parsers/signal_extractor.js';
import { RefactoringEngine } from '../artifacts/refactoring/index.js';
import { PerformanceMonitor } from '../artifacts/monitoring/index.js';
const SuggestRefactoringParamsSchema = z.object({
    projectPath: z.string().describe('Path to Godot project directory'),
    minConfidence: z.number().min(0).max(1).default(0.95).describe('Minimum confidence threshold for suggestions'),
    maxSuggestions: z.number().min(1).max(100).default(20).describe('Maximum number of suggestions to return'),
    includeRename: z.boolean().default(true).describe('Include naming convention rename suggestions'),
    includeMerge: z.boolean().default(true).describe('Include signal merge suggestions'),
    includeDeprecate: z.boolean().default(false).describe('Include deprecation suggestions'),
});
export const suggestRefactoringTool = {
    name: 'CTS_Suggest_Refactoring',
    description: 'Generate AI-powered refactoring suggestions for signal names using Levenshtein similarity detection and GDScript naming validation',
    inputSchema: {
        type: 'object',
        properties: {
            projectPath: {
                type: 'string',
                description: 'Path to Godot project directory',
            },
            minConfidence: {
                type: 'number',
                description: 'Minimum confidence threshold (0.0-1.0) for suggestions',
                default: 0.95,
                minimum: 0.0,
                maximum: 1.0,
            },
            maxSuggestions: {
                type: 'number',
                description: 'Maximum number of suggestions to return',
                default: 20,
                minimum: 1,
                maximum: 100,
            },
            includeRename: {
                type: 'boolean',
                description: 'Include naming convention rename suggestions',
                default: true,
            },
            includeMerge: {
                type: 'boolean',
                description: 'Include signal merge suggestions for similar names',
                default: true,
            },
            includeDeprecate: {
                type: 'boolean',
                description: 'Include deprecation suggestions',
                default: false,
            },
        },
        required: ['projectPath'],
    },
};
/**
 * Create tool handler
 */
export function createSuggestRefactoringHandler() {
    const monitor = new PerformanceMonitor();
    // Simple cache: projectPath → { graph, timestamp }
    const graphCache = new Map();
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    return async (args) => {
        const startTime = Date.now();
        const params = SuggestRefactoringParamsSchema.parse(args);
        console.error(`[CTS Refactor] Generating suggestions for ${params.projectPath}`);
        console.error(`[CTS Refactor] Min confidence: ${params.minConfidence}, Max suggestions: ${params.maxSuggestions}`);
        // Check cache
        const cached = graphCache.get(params.projectPath);
        const now = Date.now();
        let graph;
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            console.error('[CTS Refactor] Using cached signal graph');
            graph = cached.graph;
        }
        else {
            // Build graph
            console.error('[CTS Refactor] Building signal graph...');
            const bridge = new TreeSitterBridge();
            const extractor = new SignalExtractor();
            const scanner = new ProjectScanner(bridge);
            const builder = new SignalGraphBuilder(extractor);
            const scanResult = await monitor.monitorOperation('refactor_scan', async () => {
                return await scanner.scanProject(params.projectPath);
            });
            graph = await monitor.monitorOperation('refactor_graph', async () => {
                return await builder.buildFullGraph(scanResult);
            });
            // Update cache
            graphCache.set(params.projectPath, { graph, timestamp: now });
            console.error(`[CTS Refactor] Graph cached for ${params.projectPath}`);
        }
        // Generate suggestions
        console.error('[CTS Refactor] Generating refactoring suggestions...');
        const engine = new RefactoringEngine();
        const allSuggestions = await monitor.monitorOperation('generate_suggestions', async () => {
            return await engine.generateSuggestions(graph);
        });
        // Filter by type and confidence
        let filteredSuggestions = allSuggestions.filter(s => s.confidence >= params.minConfidence);
        if (!params.includeRename) {
            filteredSuggestions = filteredSuggestions.filter(s => s.type !== 'rename');
        }
        if (!params.includeMerge) {
            filteredSuggestions = filteredSuggestions.filter(s => s.type !== 'merge');
        }
        if (!params.includeDeprecate) {
            filteredSuggestions = filteredSuggestions.filter(s => s.type !== 'deprecate');
        }
        // Sort by confidence (descending) and limit
        const topSuggestions = filteredSuggestions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, params.maxSuggestions);
        console.error(`[CTS Refactor] Generated ${topSuggestions.length} suggestions (filtered from ${allSuggestions.length})`);
        const totalDuration = Date.now() - startTime;
        // Format results using BaseToolResponse pattern
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            toolName: 'CTS_Suggest_Refactoring',
            duration_ms: totalDuration,
            result: {
                projectPath: params.projectPath,
                suggestions: topSuggestions.map((s) => ({
                    type: s.type,
                    target: s.target,
                    replacement: s.replacement,
                    confidence: s.confidence,
                    reason: s.reason,
                    affectedFiles: s.affectedFiles || [],
                    estimatedImpact: s.estimatedImpact || 'medium',
                })),
                summary: {
                    totalGenerated: allSuggestions.length,
                    afterFiltering: filteredSuggestions.length,
                    returned: topSuggestions.length,
                    byType: {
                        merge: allSuggestions.filter((s) => s.type === 'merge').length,
                        rename: allSuggestions.filter((s) => s.type === 'rename').length,
                        deprecate: allSuggestions.filter((s) => s.type === 'deprecate').length,
                    },
                    avgConfidence: topSuggestions.length > 0
                        ? topSuggestions.reduce((sum, s) => sum + s.confidence, 0) / topSuggestions.length
                        : 0,
                },
                performance: {
                    scanTime: monitor.getMetricsForOperation('refactor_scan')[0]?.duration || 0,
                    graphTime: monitor.getMetricsForOperation('refactor_graph')[0]?.duration || 0,
                    suggestionTime: monitor.getMetricsForOperation('generate_suggestions')[0]?.duration || 0,
                    cacheHit: !!cached,
                },
            },
        };
        // Validate response format
        const validation = validateToolResponse('CTS_Suggest_Refactoring', response);
        if (!validation.valid) {
            throw Errors.validationError('response', 'SuggestRefactoringResponse', validation.errors?.errors[0]?.message || 'Unknown validation error');
        }
        return response;
    };
}
//# sourceMappingURL=suggest_refactoring.js.map