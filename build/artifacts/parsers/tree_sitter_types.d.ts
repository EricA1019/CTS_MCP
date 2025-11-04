/**
 * TypeScript interfaces for tree-sitter GDScript AST nodes
 *
 * Provides type-safe representations of signal definitions, parameters,
 * and other AST structures extracted from GDScript files.
 *
 * @module tree_sitter_types
 */
import { z } from 'zod';
import type Parser from 'tree-sitter';
/**
 * Represents a signal parameter with optional type annotation.
 *
 * @example
 * ```gdscript
 * signal health_changed(new_value: int, old_value: int)
 * # Produces: [{name: 'new_value', type: 'int'}, {name: 'old_value', type: 'int'}]
 * ```
 */
export interface ParameterNode {
    /** Parameter name */
    name: string;
    /** Type annotation (e.g., 'int', 'String', 'Node') or null if untyped */
    type: string | null;
}
/**
 * Represents a signal definition extracted from AST.
 *
 * Includes metadata for differentiating EventBus globals from local signals.
 */
export interface SignalNode {
    /** Signal identifier */
    name: string;
    /** Ordered list of parameters */
    parameters: ParameterNode[];
    /** Line number where signal is defined (1-indexed) */
    line: number;
    /** True if signal is defined in EventBus.gd or SignalBus.gd */
    isGlobalBus: boolean;
    /** Source file path (relative to project root) */
    sourceFile: string;
}
/**
 * Top-level AST representation for a GDScript file.
 *
 * Provides convenient access to extracted signals and metadata.
 */
export interface GDScriptAST {
    /** All signal definitions found in the file */
    signals: SignalNode[];
    /** Source file path */
    filePath: string;
    /** Total lines of code */
    lineCount: number;
    /** Raw tree-sitter syntax tree (for advanced traversal) */
    rawTree: Parser.Tree;
}
/**
 * Zod schema for validating ParameterNode structures.
 */
export declare const ParameterNodeSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string | null;
    name: string;
}, {
    type: string | null;
    name: string;
}>;
/**
 * Zod schema for validating SignalNode structures.
 */
export declare const SignalNodeSchema: z.ZodObject<{
    name: z.ZodString;
    parameters: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string | null;
        name: string;
    }, {
        type: string | null;
        name: string;
    }>, "many">;
    line: z.ZodNumber;
    isGlobalBus: z.ZodBoolean;
    sourceFile: z.ZodString;
}, "strip", z.ZodTypeAny, {
    line: number;
    name: string;
    parameters: {
        type: string | null;
        name: string;
    }[];
    isGlobalBus: boolean;
    sourceFile: string;
}, {
    line: number;
    name: string;
    parameters: {
        type: string | null;
        name: string;
    }[];
    isGlobalBus: boolean;
    sourceFile: string;
}>;
/**
 * Zod schema for validating GDScriptAST structures.
 */
export declare const GDScriptASTSchema: z.ZodObject<{
    signals: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        parameters: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string | null;
            name: string;
        }, {
            type: string | null;
            name: string;
        }>, "many">;
        line: z.ZodNumber;
        isGlobalBus: z.ZodBoolean;
        sourceFile: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        line: number;
        name: string;
        parameters: {
            type: string | null;
            name: string;
        }[];
        isGlobalBus: boolean;
        sourceFile: string;
    }, {
        line: number;
        name: string;
        parameters: {
            type: string | null;
            name: string;
        }[];
        isGlobalBus: boolean;
        sourceFile: string;
    }>, "many">;
    filePath: z.ZodString;
    lineCount: z.ZodNumber;
    rawTree: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    signals: {
        line: number;
        name: string;
        parameters: {
            type: string | null;
            name: string;
        }[];
        isGlobalBus: boolean;
        sourceFile: string;
    }[];
    lineCount: number;
    rawTree?: any;
}, {
    filePath: string;
    signals: {
        line: number;
        name: string;
        parameters: {
            type: string | null;
            name: string;
        }[];
        isGlobalBus: boolean;
        sourceFile: string;
    }[];
    lineCount: number;
    rawTree?: any;
}>;
/**
 * Utility: Find all signal declaration nodes in an AST tree.
 *
 * @param {Parser.Tree} tree - Tree-sitter syntax tree
 * @returns {Parser.SyntaxNode[]} Array of signal declaration nodes
 *
 * @example
 * ```typescript
 * const signalNodes = findSignalNodes(tree);
 * signalNodes.forEach(node => {
 *   console.log(node.text); // 'signal health_changed(new_value: int)'
 * });
 * ```
 */
export declare function findSignalNodes(tree: Parser.Tree): Parser.SyntaxNode[];
/**
 * Utility: Extract parameter name and type from a signal parameter node.
 *
 * @param {Parser.SyntaxNode} paramNode - Parameter node from signal_statement
 * @returns {ParameterNode} Extracted parameter with name and optional type
 *
 * @example
 * ```typescript
 * const param = extractParameter(paramNode);
 * // { name: 'health', type: 'int' }
 * ```
 */
export declare function extractParameter(paramNode: Parser.SyntaxNode): ParameterNode;
//# sourceMappingURL=tree_sitter_types.d.ts.map