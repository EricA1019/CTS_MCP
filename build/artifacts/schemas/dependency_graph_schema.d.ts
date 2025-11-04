/**
 * Zod Schemas for Dependency Graph Data Validation
 * Validates DAG structure for hop/task/file dependency visualization
 */
import { z } from 'zod';
/**
 * Node types in dependency graph
 */
export declare const NodeTypeSchema: z.ZodEnum<["hop", "task", "file"]>;
/**
 * Node in dependency graph
 */
export declare const NodeSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<["hop", "task", "file"]>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "file" | "hop" | "task";
    id: string;
    label: string;
    metadata?: Record<string, unknown> | undefined;
}, {
    type: "file" | "hop" | "task";
    id: string;
    label: string;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Edge connecting nodes in dependency graph
 */
export declare const EdgeSchema: z.ZodObject<{
    source: z.ZodString;
    target: z.ZodString;
    weight: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    source: string;
    target: string;
    weight?: number | undefined;
}, {
    source: string;
    target: string;
    weight?: number | undefined;
}>;
/**
 * Complete dependency graph data structure
 */
export declare const DependencyGraphDataSchema: z.ZodObject<{
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["hop", "task", "file"]>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        type: "file" | "hop" | "task";
        id: string;
        label: string;
        metadata?: Record<string, unknown> | undefined;
    }, {
        type: "file" | "hop" | "task";
        id: string;
        label: string;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
    edges: z.ZodDefault<z.ZodArray<z.ZodObject<{
        source: z.ZodString;
        target: z.ZodString;
        weight: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        source: string;
        target: string;
        weight?: number | undefined;
    }, {
        source: string;
        target: string;
        weight?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    nodes: {
        type: "file" | "hop" | "task";
        id: string;
        label: string;
        metadata?: Record<string, unknown> | undefined;
    }[];
    edges: {
        source: string;
        target: string;
        weight?: number | undefined;
    }[];
}, {
    nodes: {
        type: "file" | "hop" | "task";
        id: string;
        label: string;
        metadata?: Record<string, unknown> | undefined;
    }[];
    edges?: {
        source: string;
        target: string;
        weight?: number | undefined;
    }[] | undefined;
}>;
export type NodeType = z.infer<typeof NodeTypeSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type DependencyGraphData = z.infer<typeof DependencyGraphDataSchema>;
//# sourceMappingURL=dependency_graph_schema.d.ts.map