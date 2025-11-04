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
import GDScript from 'tree-sitter-gdscript';
import { readFileSync } from 'fs';
/**
 * Singleton parser instance (lazy-initialized)
 */
let parser = null;
let initPromise = null;
/**
 * AST cache for performance optimization
 * Key: file path or cache key
 * Value: parsed tree
 */
const astCache = new Map();
const metrics = {
    initTime: 0,
    parseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    filesProcessed: 0,
};
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
export async function initTreeSitter() {
    // Return immediately if already initialized
    if (parser) {
        return;
    }
    // Wait for ongoing initialization if one exists
    if (initPromise) {
        return initPromise;
    }
    // Start new initialization
    initPromise = (async () => {
        const startTime = Date.now();
        try {
            // Create parser instance
            parser = new Parser();
            // Load GDScript language grammar (native binding)
            parser.setLanguage(GDScript);
            metrics.initTime = Date.now() - startTime;
            if (metrics.initTime > 50) {
                console.warn(`⚠️ Tree-sitter init took ${metrics.initTime}ms (target: <50ms)`);
            }
        }
        catch (error) {
            // Reset state on error
            parser = null;
            initPromise = null;
            throw new Error(`Failed to initialize tree-sitter: ${error instanceof Error ? error.message : String(error)}`);
        }
    })();
    return initPromise;
}
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
export async function parseGDScript(code, cacheKey) {
    await initTreeSitter();
    if (!parser) {
        throw new Error('Parser not initialized');
    }
    // Check cache
    if (cacheKey && astCache.has(cacheKey)) {
        metrics.cacheHits++;
        return astCache.get(cacheKey);
    }
    metrics.cacheMisses++;
    // Parse code
    const parseStart = Date.now();
    const tree = parser.parse(code);
    metrics.parseTime += Date.now() - parseStart;
    metrics.filesProcessed++;
    // Store in cache if key provided
    if (cacheKey) {
        astCache.set(cacheKey, tree);
    }
    return tree;
}
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
export async function parseGDScriptFile(filePath, useCache = true) {
    const code = readFileSync(filePath, 'utf-8');
    const cacheKey = useCache ? filePath : undefined;
    return parseGDScript(code, cacheKey);
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
export function findSignalDefinitions(tree) {
    const signals = [];
    // Use tree traversal instead of queries (native tree-sitter doesn't have query API)
    function visitNode(node) {
        // Look for signal_statement nodes
        if (node.type === 'signal_statement') {
            // Extract signal name from first identifier child
            const nameNode = node.childForFieldName('name');
            if (nameNode) {
                const signalName = nameNode.text;
                const line = nameNode.startPosition.row + 1;
                // Extract parameters if present
                const paramsNode = node.childForFieldName('parameters');
                const params = [];
                const paramTypes = {};
                if (paramsNode) {
                    // Traverse parameter nodes
                    for (let i = 0; i < paramsNode.namedChildCount; i++) {
                        const paramNode = paramsNode.namedChild(i);
                        if (paramNode && paramNode.type === 'parameter') {
                            const paramName = paramNode.childForFieldName('name')?.text;
                            const paramType = paramNode.childForFieldName('type')?.text;
                            if (paramName) {
                                params.push(paramName);
                                if (paramType) {
                                    paramTypes[paramName] = paramType;
                                }
                            }
                        }
                    }
                }
                signals.push({ name: signalName, line, params, paramTypes });
            }
        }
        // Recursively visit children
        for (let i = 0; i < node.namedChildCount; i++) {
            const child = node.namedChild(i);
            if (child)
                visitNode(child);
        }
    }
    visitNode(tree.rootNode);
    return signals;
}
/**
 * Find class definitions in parsed AST tree.
 *
 * @param tree - Parsed AST tree
 * @returns Array of class names
 */
export function findClassDefinitions(tree) {
    const classes = [];
    function visitNode(node) {
        if (node.type === 'class_definition') {
            const nameNode = node.childForFieldName('name');
            if (nameNode) {
                classes.push(nameNode.text);
            }
        }
        for (let i = 0; i < node.namedChildCount; i++) {
            const child = node.namedChild(i);
            if (child)
                visitNode(child);
        }
    }
    visitNode(tree.rootNode);
    return classes;
}
export function findFunctionDefinitions(tree) {
    const functions = [];
    const cursor = tree.walk();
    function visitNode(node) {
        if (node.type === 'function_definition') {
            const nameNode = node.childForFieldName('name');
            const paramsNode = node.childForFieldName('parameters');
            const returnTypeNode = node.childForFieldName('return_type');
            if (nameNode) {
                const params = [];
                if (paramsNode) {
                    for (let i = 0; i < paramsNode.namedChildCount; i++) {
                        const paramNode = paramsNode.namedChild(i);
                        if (paramNode && paramNode.type === 'parameter') {
                            const paramName = paramNode.childForFieldName('name');
                            if (paramName) {
                                params.push(paramName.text);
                            }
                        }
                    }
                }
                functions.push({
                    name: nameNode.text,
                    line: nameNode.startPosition.row + 1,
                    params,
                    returnType: returnTypeNode ? returnTypeNode.text : undefined,
                });
            }
        }
        for (let i = 0; i < node.namedChildCount; i++) {
            const child = node.namedChild(i);
            if (child)
                visitNode(child);
        }
    }
    visitNode(tree.rootNode);
    return functions;
}
/**
 * Clear AST cache to free memory.
 *
 * Call this periodically when processing large projects.
 */
export function clearCache() {
    astCache.clear();
    metrics.cacheHits = 0;
    metrics.cacheMisses = 0;
}
/**
 * Get parser performance metrics.
 *
 * @returns Performance metrics object
 */
export function getMetrics() {
    return { ...metrics };
}
/**
 * Reset performance metrics.
 */
export function resetMetrics() {
    metrics.initTime = 0;
    metrics.parseTime = 0;
    metrics.cacheHits = 0;
    metrics.cacheMisses = 0;
    metrics.filesProcessed = 0;
}
//# sourceMappingURL=tree_sitter.js.map