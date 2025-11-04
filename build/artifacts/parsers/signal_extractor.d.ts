/**
 * Signal Extraction Service
 *
 * Provides unified signal extraction using regex-based parser (Phase 1)
 * with architecture prepared for tree-sitter AST integration (Phase 2 future).
 *
 * Design Pattern: Adapter/Facade
 * - Wraps gdscript_parser.ts in extensible interface
 * - Maintains SignalDefinition schema compatibility
 * - Enables future tree-sitter drop-in replacement
 *
 * @module signal_extractor
 */
import { SignalDefinition } from './gdscript_parser.js';
import type { Tree } from 'tree-sitter';
import type { EmissionSite } from '../graph/types.js';
import { z } from 'zod';
/**
 * Zod schema for validating SignalDefinition structures.
 * Ensures type safety and runtime validation of extracted signals.
 */
export declare const SignalDefinitionSchema: z.ZodObject<{
    name: z.ZodString;
    params: z.ZodArray<z.ZodString, "many">;
    filePath: z.ZodString;
    line: z.ZodNumber;
    source: z.ZodString;
    paramTypes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    line: number;
    params: string[];
    name: string;
    source: string;
    paramTypes?: Record<string, string> | undefined;
}, {
    filePath: string;
    line: number;
    params: string[];
    name: string;
    source: string;
    paramTypes?: Record<string, string> | undefined;
}>;
/**
 * Extraction statistics for diagnostics and performance monitoring.
 */
export interface ExtractionStats {
    /** Total signals extracted */
    signalCount: number;
    /** Files processed */
    filesProcessed: number;
    /** Extraction duration in milliseconds */
    durationMs: number;
    /** EventBus global signals */
    eventBusSignals: number;
    /** SignalBus global signals */
    signalBusSignals: number;
    /** Local (component) signals */
    localSignals: number;
}
/**
 * Signal extraction service providing high-level API for parsing GDScript signals.
 *
 * Current Implementation: Uses Phase 1 regex parser for proven accuracy
 * Future Integration: Architected for tree-sitter AST drop-in replacement
 *
 * @example
 * ```typescript
 * const extractor = new SignalExtractor();
 * const signals = await extractor.extractSignals('path/to/EventBus.gd');
 * console.log(`Found ${signals.length} signals`);
 * ```
 */
export declare class SignalExtractor {
    private stats;
    /**
     * Extract all signal definitions from a GDScript file.
     *
     * @param {string} filePath - Absolute or relative path to .gd file
     * @returns {Promise<SignalDefinition[]>} Array of signal definitions with metadata
     * @throws {Error} If file doesn't exist or parsing fails
     *
     * @example
     * ```typescript
     * const signals = await extractor.extractSignals('autoload/EventBus.gd');
     * signals.forEach(sig => console.log(`${sig.name}: ${sig.params.join(', ')}`));
     * ```
     */
    extractSignals(filePath: string): Promise<SignalDefinition[]>;
    /**
     * Extract signals from multiple GDScript files in batch.
     *
     * @param {string[]} filePaths - Array of file paths to process
     * @returns {Promise<SignalDefinition[]>} Aggregated signals from all files
     *
     * @example
     * ```typescript
     * const files = ['EventBus.gd', 'Player.gd', 'Enemy.gd'];
     * const allSignals = await extractor.extractFromFiles(files);
     * console.log(`Total: ${allSignals.length} signals`);
     * ```
     */
    extractFromFiles(filePaths: string[]): Promise<SignalDefinition[]>;
    /**
     * Extract signals from all .gd files in a directory (recursive).
     *
     * @param {string} directoryPath - Root directory to scan
     * @param {string[]} excludePatterns - Glob patterns to exclude (e.g., ['addons/*', 'test/*'])
     * @returns {Promise<SignalDefinition[]>} All signals found in directory tree
     */
    extractFromDirectory(directoryPath: string, excludePatterns?: string[]): Promise<SignalDefinition[]>;
    /**
     * Get extraction statistics for performance monitoring and diagnostics.
     *
     * @returns {ExtractionStats} Statistics from last extraction operation
     */
    getStats(): ExtractionStats;
    /**
     * Reset statistics counters.
     */
    resetStats(): void;
    /**
     * Extract signal emission sites from AST tree.
     *
     * NEW in Phase 3: Tree-sitter based emission detection for global graph construction.
     *
     * Detects patterns:
     * - signal_name.emit()
     * - EventBus.signal_name.emit(args)
     * - self.signal_name.emit()
     *
     * @param {Tree} tree - Tree-sitter AST from TreeSitterBridge
     * @param {string} filePath - Source file path for context
     * @returns {Promise<EmissionSite[]>} Array of emission sites with context
     *
     * @example
     * ```typescript
     * const bridge = new TreeSitterBridge();
     * await bridge.init();
     * const tree = await bridge.parseFile('Player.gd');
     * const emissions = await extractor.extractEmissions(tree, 'Player.gd');
     * ```
     */
    extractEmissions(tree: Tree, filePath: string): Promise<EmissionSite[]>;
    /**
     * Recursively find .emit() calls in AST node tree.
     *
     * @private
     */
    private findEmitCalls;
    /**
     * Extract signal name from emit object node.
     *
     * Handles patterns:
     * - signal_name.emit() → "signal_name"
     * - EventBus.signal_name.emit() → "signal_name"
     * - self.signal_name.emit() → "signal_name"
     *
     * @private
     */
    private extractSignalName;
    /**
     * Extract emitter object from emit call.
     *
     * @private
     */
    private extractEmitter;
    /**
     * Extract arguments from call expression.
     *
     * @private
     */
    private extractCallArguments;
    /**
     * Get source code context around a node (2 lines before/after).
     *
     * @private
     */
    private getNodeContext;
    /**
     * Extract signal connection sites from AST tree.
     *
     * NEW in Phase 3 HOP 3.2b: Connection detection for complete signal graph.
     *
     * Detects patterns:
     * - signal_name.connect(target, method)
     * - signal_name.connect(method)
     * - signal_name.connect(lambda: code)
     * - signal_name.connect(Callable(target, method))
     * - EventBus.signal_name.connect(...)
     *
     * @param {Tree} tree - Tree-sitter AST from TreeSitterBridge
     * @param {string} filePath - Source file path for context
     * @returns {Promise<ConnectionSite[]>} Array of connection sites with handlers
     *
     * @example
     * ```typescript
     * const tree = await bridge.parseFile('Player.gd');
     * const connections = await extractor.extractConnections(tree, 'Player.gd');
     * ```
     */
    extractConnections(tree: Tree, filePath: string): Promise<import('../graph/types.js').ConnectionSite[]>;
    /**
     * Recursively find .connect() calls in AST node tree.
     *
     * @private
     */
    private findConnectCalls;
    /**
     * Extract connection target from signal object.
     *
     * @private
     */
    private extractConnectionTarget;
    /**
     * Extract connection handler details from .connect() call.
     *
     * Handles:
     * - .connect(target, "method_name") → { handler: "method_name", isLambda: false }
     * - .connect(method) → { handler: "method", isLambda: false }
     * - .connect(lambda: ...) → { handler: "<lambda>", isLambda: true }
     * - .connect(Callable(obj, "method")) → { handler: "method", isLambda: false }
     * - .connect(..., flags) → { handler: "...", flags: [flags] }
     *
     * @private
     */
    private extractConnectionHandler;
    /**
     * Find all .gd files in a directory tree (helper method).
     *
     * @private
     */
    private findGDScriptFiles;
}
//# sourceMappingURL=signal_extractor.d.ts.map