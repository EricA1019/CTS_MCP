/**
 * Tree-sitter WASM Bridge for GDScript AST Parsing
 *
 * Provides production-grade AST parsing via tree-sitter-gdscript WASM runtime.
 * Replaces regex-based parser with accurate, fault-tolerant AST extraction.
 *
 * Performance targets:
 * - WASM initialization: <500ms
 * - Parsing throughput: >4000 LOC/second (250ms for 1000 LOC)
 *
 * @module tree_sitter_bridge
 */
import Parser from 'tree-sitter';
/**
 * WASM-backed GDScript parser using tree-sitter runtime.
 *
 * Initialization is async due to WASM loading. Call init() before parseFile().
 *
 * @example
 * ```typescript
 * const bridge = new TreeSitterBridge();
 * await bridge.init();
 * const tree = await bridge.parseFile('path/to/script.gd');
 * ```
 */
export declare class TreeSitterBridge {
    private parser;
    private initialized;
    private initStartTime;
    /**
     * Initialize tree-sitter WASM runtime and load GDScript grammar.
     *
     * @throws {Error} If WASM fails to load or grammar is unavailable
     * @returns {Promise<void>}
     */
    init(): Promise<void>;
    /**
     * Load GDScript language grammar using dynamic import or require.
     * This helper handles the complexity of loading native modules in ESM context.
     */
    private loadGDScriptLanguage;
    /**
     * Parse GDScript file into AST tree structure.
     *
     * @param {string} filePath - Absolute or relative path to .gd file
     * @returns {Promise<Parser.Tree>} AST tree for traversal
     * @throws {Error} If parser not initialized or file read fails
     *
     * @example
     * ```typescript
     * const tree = await bridge.parseFile('EventBus.gd');
     * const rootNode = tree.rootNode;
     * console.log(rootNode.type); // 'source_file'
     * ```
     */
    parseFile(filePath: string): Promise<Parser.Tree>;
    /**
     * Parse GDScript source code string into AST tree.
     *
     * @param {string} sourceCode - GDScript source code
     * @returns {Parser.Tree} AST tree for traversal
     * @throws {Error} If parser not initialized
     */
    parseString(sourceCode: string): Parser.Tree;
    /**
     * Check if bridge is initialized and ready for parsing.
     *
     * @returns {boolean} True if init() completed successfully
     */
    isInitialized(): boolean;
}
//# sourceMappingURL=tree_sitter_bridge.d.ts.map