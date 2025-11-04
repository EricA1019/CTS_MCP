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
import { readFileSync } from 'fs';
// Tree-sitter language grammars are typically loaded dynamically
let GDScript;
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
export class TreeSitterBridge {
    parser = null;
    initialized = false;
    initStartTime = 0;
    /**
     * Initialize tree-sitter WASM runtime and load GDScript grammar.
     *
     * @throws {Error} If WASM fails to load or grammar is unavailable
     * @returns {Promise<void>}
     */
    async init() {
        if (this.initialized) {
            return;
        }
        this.initStartTime = Date.now();
        try {
            // Import tree-sitter-gdscript native bindings
            // For Node.js environments, we need to use dynamic require for native modules
            // We'll use a helper function to load the module
            GDScript = await this.loadGDScriptLanguage();
            this.parser = new Parser();
            this.parser.setLanguage(GDScript);
            this.initialized = true;
            const initDuration = Date.now() - this.initStartTime;
            if (initDuration > 500) {
                console.warn(`Tree-sitter WASM initialization took ${initDuration}ms (target: <500ms)`);
            }
        }
        catch (error) {
            throw new Error(`Failed to initialize tree-sitter WASM: ${error instanceof Error ? error.message : String(error)}. ` +
                `Ensure tree-sitter-gdscript is installed and compiled via: cd node_modules/tree-sitter-gdscript && node-gyp rebuild`);
        }
    }
    /**
     * Load GDScript language grammar using dynamic import or require.
     * This helper handles the complexity of loading native modules in ESM context.
     */
    async loadGDScriptLanguage() {
        try {
            // Try using Node's native require for CommonJS native modules
            // Using eval to avoid static analysis issues
            const req = (typeof require !== 'undefined')
                ? require
                : eval('require'); // Fallback for environments without global require
            // First try direct path to compiled binding (for newly compiled versions)
            try {
                const { resolve: resolvePath } = await import('path');
                const bindingPath = resolvePath(process.cwd(), 'node_modules/tree-sitter-gdscript/build/Release/tree_sitter_gdscript_binding.node');
                return req(bindingPath);
            }
            catch (directError) {
                // Fall back to package name (will use prebuilt bindings if available)
                return req('tree-sitter-gdscript');
            }
        }
        catch (error) {
            // If require doesn't work, try dynamic import as fallback
            const module = await import('tree-sitter-gdscript');
            return module.default || module;
        }
    }
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
    async parseFile(filePath) {
        if (!this.initialized || !this.parser) {
            throw new Error('TreeSitterBridge not initialized. Call init() before parseFile().');
        }
        const parseStartTime = Date.now();
        try {
            const sourceCode = readFileSync(filePath, 'utf-8');
            const tree = this.parser.parse(sourceCode);
            const parseDuration = Date.now() - parseStartTime;
            const lineCount = sourceCode.split('\n').length;
            // Performance validation: 1000 LOC should parse in <250ms
            if (lineCount >= 1000 && parseDuration > 250) {
                console.warn(`Performance target missed: ${lineCount} LOC parsed in ${parseDuration}ms (target: <250ms for 1000 LOC)`);
            }
            return tree;
        }
        catch (error) {
            throw new Error(`Failed to parse file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Parse GDScript source code string into AST tree.
     *
     * @param {string} sourceCode - GDScript source code
     * @returns {Parser.Tree} AST tree for traversal
     * @throws {Error} If parser not initialized
     */
    parseString(sourceCode) {
        if (!this.initialized || !this.parser) {
            throw new Error('TreeSitterBridge not initialized. Call init() before parseString().');
        }
        return this.parser.parse(sourceCode);
    }
    /**
     * Check if bridge is initialized and ready for parsing.
     *
     * @returns {boolean} True if init() completed successfully
     */
    isInitialized() {
        return this.initialized;
    }
}
//# sourceMappingURL=tree_sitter_bridge.js.map