/**
 * Tree-Sitter Utilities
 *
 * Shared AST parsing utilities using tree-sitter native bindings.
 * Uses tree-sitter (native) for better performance than WASM.
 *
 * Performance Budget:
 * - Initialization: <50ms (one-time cost, native binding load)
 * - Parse time: <10ms per 500-line file
 * - Cached parse: <1ms
 * - Memory: <30MB for 100 files
 *
 * @module utils/tree_sitter
 */
import Parser from 'tree-sitter';
/**
 * Performance metrics
 */
interface ParserMetrics {
    initTime: number;
    parseTime: number;
    cacheHits: number;
    cacheMisses: number;
    filesProcessed: number;
}
/**
 * Initialize tree-sitter runtime with GDScript grammar.
 *
 * This is a lazy initialization function - it will only initialize once
 * and subsequent calls will return immediately.
 *
 * @throws {Error} If native binding fails to load
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * await initTreeSitter();
 * const tree = await parseGDScript(code);
 * ```
 */
export declare function initTreeSitter(): Promise<void>;
/**
 * Parse GDScript code and return AST tree.
 *
 * @param code - GDScript source code to parse
 * @param cacheKey - Optional cache key (e.g., file path) for performance
 * @returns Parsed AST tree
 *
 * @example
 * ```typescript
 * const tree = await parseGDScript(code, 'path/to/file.gd');
 * const signals = findSignalDefinitions(tree);
 * ```
 */
export declare function parseGDScript(code: string, cacheKey?: string): Promise<Parser.Tree>;
/**
 * Parse GDScript file and return AST tree.
 *
 * @param filePath - Absolute path to GDScript file
 * @param useCache - Whether to use cache (default: true)
 * @returns Parsed AST tree
 *
 * @example
 * ```typescript
 * const tree = await parseGDScriptFile('autoload/EventBus.gd');
 * ```
 */
export declare function parseGDScriptFile(filePath: string, useCache?: boolean): Promise<Parser.Tree>;
/**
 * Signal definition extracted from AST
 */
export interface SignalDefinition {
    name: string;
    line: number;
    params: string[];
    paramTypes: Record<string, string>;
}
/**
 * Find signal definitions in parsed AST tree.
 *
 * Uses tree-sitter query syntax for accurate extraction:
 * - (signal_statement name: (identifier) @signal.name)
 * - (parameter_list (parameter name: (identifier) type: (type) @param.type) @param)
 *
 * @param tree - Parsed AST tree
 * @returns Array of signal definitions with parameters
 *
 * @example
 * ```typescript
 * const tree = await parseGDScript(code);
 * const signals = findSignalDefinitions(tree);
 * // [{ name: "player_died", line: 5, params: ["reason"], paramTypes: { "reason": "String" } }]
 * ```
 */
export declare function findSignalDefinitions(tree: Parser.Tree): SignalDefinition[];
/**
 * Find class definitions in parsed AST tree.
 *
 * @param tree - Parsed AST tree
 * @returns Array of class names
 */
export declare function findClassDefinitions(tree: Parser.Tree): string[];
/**
 * Find function definitions in parsed AST tree.
 *
 * @param tree - Parsed AST tree
 * @returns Array of function signatures
 */
export interface FunctionSignature {
    name: string;
    line: number;
    params: string[];
    returnType?: string;
}
export declare function findFunctionDefinitions(tree: Parser.Tree): FunctionSignature[];
/**
 * Clear AST cache to free memory.
 *
 * Call this periodically when processing large projects.
 */
export declare function clearCache(): void;
/**
 * Get parser performance metrics.
 *
 * @returns Performance metrics object
 */
export declare function getMetrics(): Readonly<ParserMetrics>;
/**
 * Reset performance metrics.
 */
export declare function resetMetrics(): void;
export {};
//# sourceMappingURL=tree_sitter.d.ts.map