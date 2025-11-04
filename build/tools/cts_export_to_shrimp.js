/**
 * CTS Export to Shrimp Tool
 * Converts hop plan JSON to Shrimp task format
 */
import { z } from 'zod';
import { validateToolResponse } from '../schemas.js';
import { Errors } from '../errors.js';
// Zod schemas for validation
const SubHopSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    estimatedLOC: z.number(),
    deliverables: z.array(z.string()).optional(),
});
const HopPlanSchema = z.object({
    hopId: z.string(),
    name: z.string(),
    description: z.string(),
    dependencies: z.array(z.string()).default([]),
    estimatedLOC: z.number(),
    deliverables: z.array(z.string()).optional(),
    acceptanceCriteria: z.array(z.string()).optional(),
    technicalNotes: z.string().optional(),
    subHops: z.array(SubHopSchema).optional(),
});
const ExportParamsSchema = z.object({
    hopPlan: HopPlanSchema,
    updateMode: z.enum(['append', 'overwrite', 'selective', 'clearAllTasks']).default('append'),
    generateSubTasks: z.boolean().default(true),
});
/**
 * Convert HOP plan to Shrimp task format
 */
export function convertHopToShrimpTask(hop) {
    const taskName = `HOP ${hop.hopId}: ${hop.name}`;
    const description = [
        hop.description,
        hop.deliverables && hop.deliverables.length > 0
            ? `\n\nDeliverables:\n${hop.deliverables.map(d => `- ${d}`).join('\n')}`
            : '',
    ].filter(Boolean).join('');
    const implementationGuide = [
        `Implementation guide for HOP ${hop.hopId}:`,
        '',
        '1. Review hop plan documentation',
        `2. Estimated LOC budget: ${hop.estimatedLOC} lines`,
        hop.technicalNotes ? `3. Technical notes: ${hop.technicalNotes}` : '',
        hop.subHops && hop.subHops.length > 0
            ? `4. Sub-hops to implement:\n${hop.subHops.map(sh => `   - ${sh.id}: ${sh.name} (~${sh.estimatedLOC} LOC)`).join('\n')}`
            : '',
        '',
        'Refer to hop plan document for detailed implementation steps.',
    ].filter(Boolean).join('\n');
    const verificationCriteria = [
        hop.acceptanceCriteria && hop.acceptanceCriteria.length > 0
            ? hop.acceptanceCriteria.join('\n')
            : `All deliverables complete and ${hop.hopId} requirements met`,
        `LOC budget: ${hop.estimatedLOC} lines (±10% acceptable)`,
        'Code compiles without errors',
        'All tests pass',
    ].join('\n');
    const relatedFiles = [
        {
            path: `docs/plans/active/HOP_${hop.hopId}.md`,
            type: 'REFERENCE',
            description: 'Hop plan documentation with detailed requirements',
        },
    ];
    return {
        name: taskName,
        description,
        implementationGuide,
        notes: hop.technicalNotes,
        dependencies: hop.dependencies.map(dep => `HOP ${dep}`),
        relatedFiles,
        verificationCriteria,
    };
}
/**
 * Convert sub-hop to Shrimp task
 */
export function convertSubHopToTask(subHop, parentHopId) {
    const taskName = `${parentHopId}.${subHop.id}: ${subHop.name}`;
    const description = [
        subHop.description,
        subHop.deliverables && subHop.deliverables.length > 0
            ? `\n\nDeliverables:\n${subHop.deliverables.map(d => `- ${d}`).join('\n')}`
            : '',
    ].filter(Boolean).join('');
    const implementationGuide = [
        `Sub-hop implementation for ${subHop.id}:`,
        '',
        '1. Review parent hop plan',
        `2. Estimated LOC budget: ${subHop.estimatedLOC} lines`,
        '3. Implement according to parent hop specifications',
        '',
        'Ensure integration with parent hop deliverables.',
    ].join('\n');
    const verificationCriteria = [
        subHop.deliverables && subHop.deliverables.length > 0
            ? `Deliverables complete:\n${subHop.deliverables.map(d => `- ${d}`).join('\n')}`
            : 'All sub-hop requirements met',
        `LOC budget: ${subHop.estimatedLOC} lines (±10% acceptable)`,
        'Integration with parent hop verified',
    ].join('\n');
    return {
        name: taskName,
        description,
        implementationGuide,
        dependencies: [`HOP ${parentHopId}`],
        relatedFiles: [
            {
                path: `docs/plans/active/HOP_${parentHopId}.md`,
                type: 'REFERENCE',
                description: 'Parent hop plan documentation',
            },
        ],
        verificationCriteria,
    };
}
/**
 * Tool handler for CTS_Export_to_Shrimp
 */
export const ctsExportToShrimpHandler = async (args) => {
    const startTime = Date.now();
    try {
        // Validate input
        const params = ExportParamsSchema.parse(args);
        const { hopPlan, updateMode, generateSubTasks } = params;
        // Convert hop to Shrimp task
        const tasks = [];
        // Main hop task
        tasks.push(convertHopToShrimpTask(hopPlan));
        // Sub-hop tasks (if requested)
        if (generateSubTasks && hopPlan.subHops && hopPlan.subHops.length > 0) {
            for (const subHop of hopPlan.subHops) {
                tasks.push(convertSubHopToTask(subHop, hopPlan.hopId));
            }
        }
        const conversionTime = Date.now() - startTime;
        // Format response using BaseToolResponse pattern
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            toolName: 'CTS_Export_to_Shrimp',
            duration_ms: conversionTime,
            result: {
                message: `Successfully converted HOP ${hopPlan.hopId} to ${tasks.length} Shrimp task(s)`,
                conversionTime: `${conversionTime}ms`,
                taskCount: tasks.length,
                updateMode,
                shrimpTasksFormat: tasks,
                instructions: [
                    'Copy the shrimpTasksFormat array to use with Shrimp MCP',
                    `Use update mode: ${updateMode}`,
                    'Call mcp_shrimp_split_tasks with the globalAnalysisResult and tasksRaw parameters',
                ],
            },
        };
        // Validate response format
        const validation = validateToolResponse('CTS_Export_to_Shrimp', response);
        if (!validation.valid) {
            throw Errors.validationError('response', 'ExportToShrimpResponse', validation.errors?.errors[0]?.message || 'Unknown validation error');
        }
        return response;
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw Errors.validationError('hopPlan', 'HopPlanSchema', error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
        }
        throw error;
    }
};
/**
 * Tool definition for CTS_Export_to_Shrimp
 */
export const ctsExportToShrimpTool = {
    name: 'CTS_Export_to_Shrimp',
    description: 'Convert CTS hop plan JSON to Shrimp task format for automated task creation. Converts hop plans into structured tasks with implementation guides, verification criteria, and dependencies.',
    inputSchema: {
        type: 'object',
        properties: {
            hopPlan: {
                type: 'object',
                description: 'Hop plan to convert',
                properties: {
                    hopId: { type: 'string', description: 'Hop identifier (e.g., "5.1a")' },
                    name: { type: 'string', description: 'Hop name' },
                    description: { type: 'string', description: 'Hop description' },
                    dependencies: { type: 'array', items: { type: 'string' }, description: 'Dependent hop IDs' },
                    estimatedLOC: { type: 'number', description: 'Estimated lines of code' },
                    deliverables: { type: 'array', items: { type: 'string' }, description: 'Expected deliverables' },
                    acceptanceCriteria: { type: 'array', items: { type: 'string' }, description: 'Acceptance criteria' },
                    technicalNotes: { type: 'string', description: 'Technical implementation notes' },
                    subHops: {
                        type: 'array',
                        description: 'Sub-hops to generate as separate tasks',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                description: { type: 'string' },
                                estimatedLOC: { type: 'number' },
                                deliverables: { type: 'array', items: { type: 'string' } },
                            },
                        },
                    },
                },
                required: ['hopId', 'name', 'description', 'estimatedLOC'],
            },
            updateMode: {
                type: 'string',
                description: 'Shrimp task update mode',
                enum: ['append', 'overwrite', 'selective', 'clearAllTasks'],
                default: 'append',
            },
            generateSubTasks: {
                type: 'boolean',
                description: 'Generate separate tasks for sub-hops',
                default: true,
            },
        },
        required: ['hopPlan'],
    },
};
//# sourceMappingURL=cts_export_to_shrimp.js.map