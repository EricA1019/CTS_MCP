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
export const ParameterNodeSchema = z.object({
  name: z.string().min(1),
  type: z.string().nullable(),
});

/**
 * Zod schema for validating SignalNode structures.
 */
export const SignalNodeSchema = z.object({
  name: z.string().min(1),
  parameters: z.array(ParameterNodeSchema),
  line: z.number().int().positive(),
  isGlobalBus: z.boolean(),
  sourceFile: z.string().min(1),
});

/**
 * Zod schema for validating GDScriptAST structures.
 */
export const GDScriptASTSchema = z.object({
  signals: z.array(SignalNodeSchema),
  filePath: z.string().min(1),
  lineCount: z.number().int().positive(),
  rawTree: z.any(), // tree-sitter Tree is complex, skip validation
});

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
export function findSignalNodes(tree: Parser.Tree): Parser.SyntaxNode[] {
  const signals: Parser.SyntaxNode[] = [];
  const cursor = tree.walk();

  function traverse(node: Parser.SyntaxNode): void {
    if (node.type === 'signal_statement') {
      signals.push(node);
    }
    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(cursor.currentNode);
  return signals;
}

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
export function extractParameter(paramNode: Parser.SyntaxNode): ParameterNode {
  // Navigate tree-sitter node structure to find identifier and type annotation
  // Structure varies by grammar, this is a simplified placeholder
  const nameNode = paramNode.childForFieldName('name') || paramNode.children.find(c => c.type === 'identifier');
  const typeNode = paramNode.childForFieldName('type') || paramNode.children.find(c => c.type === 'type');

  return {
    name: nameNode?.text || 'unknown',
    type: typeNode?.text || null,
  };
}
