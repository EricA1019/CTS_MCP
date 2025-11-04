/**
 * Zod Schemas for Dependency Graph Data Validation
 * Validates DAG structure for hop/task/file dependency visualization
 */
import { z } from 'zod';
/**
 * Node types in dependency graph
 */
export const NodeTypeSchema = z.enum(['hop', 'task', 'file']);
/**
 * Node in dependency graph
 */
export const NodeSchema = z.object({
    id: z.string().min(1, 'Node ID cannot be empty'),
    label: z.string().min(1, 'Node label cannot be empty'),
    type: NodeTypeSchema,
    metadata: z.record(z.unknown()).optional(),
});
/**
 * Edge connecting nodes in dependency graph
 */
export const EdgeSchema = z.object({
    source: z.string().min(1, 'Source node ID cannot be empty'),
    target: z.string().min(1, 'Target node ID cannot be empty'),
    weight: z.number().min(0).optional(),
});
/**
 * Complete dependency graph data structure
 */
export const DependencyGraphDataSchema = z.object({
    nodes: z.array(NodeSchema).min(1, 'At least one node is required'),
    edges: z.array(EdgeSchema).default([]),
});
//# sourceMappingURL=dependency_graph_schema.js.map