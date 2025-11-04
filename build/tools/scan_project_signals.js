/**
 * CTS Scan Project Signals Tool
 * Scans Godot project for signal definitions and renders signal map
 */
import { z } from 'zod';
import { parseProjectSignals } from '../artifacts/parsers/gdscript_parser.js';
import { validateToolResponse } from '../schemas.js';
import { Errors } from '../errors.js';
const ScanSignalsParamsSchema = z.object({
    projectPath: z.string(),
    renderMap: z.boolean().default(true),
});
/**
 * Create tool handler with ArtifactEngine instance
 */
export function createScanSignalsHandler(engine) {
    return async (args) => {
        const params = ScanSignalsParamsSchema.parse(args);
        // Parse project signals (now async with WASM parser)
        const parsed = await parseProjectSignals(params.projectPath);
        const allSignals = [
            ...parsed.eventBusSignals,
            ...parsed.signalBusSignals,
        ];
        // Optionally render signal map
        let html;
        let cached = false;
        if (params.renderMap) {
            const renderResult = await engine.renderArtifact('signal_map', {
                signals: allSignals,
                projectPath: params.projectPath,
                metadata: {
                    eventBusCount: parsed.eventBusSignals.length,
                    signalBusCount: parsed.signalBusSignals.length,
                },
            }, {
                title: `Signal Map - ${parsed.totalCount} signals`,
                description: `EventBus: ${parsed.eventBusSignals.length}, SignalBus: ${parsed.signalBusSignals.length}`,
            });
            html = renderResult.html;
            cached = renderResult.cached;
        }
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            toolName: 'CTS_Scan_Project_Signals',
            result: {
                projectPath: params.projectPath,
                totalSignals: parsed.totalCount,
                eventBusSignals: parsed.eventBusSignals.length,
                signalBusSignals: parsed.signalBusSignals.length,
                signals: allSignals.map(s => ({
                    name: s.name,
                    source: s.source,
                    params: s.params,
                    file: s.filePath,
                    line: s.line,
                })),
                rendered: params.renderMap,
                html: html,
                cached,
            },
        };
        // Validate response schema before returning
        const { valid, errors } = validateToolResponse('CTS_Scan_Project_Signals', response);
        if (!valid) {
            throw Errors.validationError('response', 'ScanSignalsResponse', errors?.errors[0]?.message || 'Invalid response structure');
        }
        return response;
    };
}
/**
 * Tool definition for CTS_Scan_Project_Signals
 */
export const scanProjectSignalsTool = {
    name: 'CTS_Scan_Project_Signals',
    description: 'Scan Godot project for EventBus/SignalBus signal definitions and render D3.js signal map visualization',
    inputSchema: {
        type: 'object',
        properties: {
            projectPath: {
                type: 'string',
                description: 'Absolute path to Godot project directory',
            },
            renderMap: {
                type: 'boolean',
                description: 'Generate D3.js signal map visualization',
                default: true,
            },
        },
        required: ['projectPath'],
    },
};
//# sourceMappingURL=scan_project_signals.js.map