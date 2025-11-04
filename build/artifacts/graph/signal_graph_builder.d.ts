/**
 * Signal Graph Builder - Phase 3 HOP 3.2a
 *
 * Constructs partial signal graph (definitions + emissions) from AST forest.
 *
 * Architecture:
 * - Aggregates signal definitions across all files (reuses Phase 2 SignalExtractor)
 * - Aggregates emission sites from tree-sitter AST (new extractEmissions)
 * - Builds bidirectional indices: signal → files, file → signals
 * - Generates metadata and statistics for graph consumers
 *
 * Performance:
 * - Target: <500ms for 300 signals across 500 files
 * - Parallel processing via ProjectScanner (HOP 3.1)
 * - Memory-efficient Map-based indices
 *
 * @module artifacts/graph
 */
import { SignalExtractor } from '../parsers/signal_extractor.js';
import type { SignalDefinition } from '../parsers/gdscript_parser.js';
import type { EmissionSite, ConnectionSite, PartialGraph, SignalGraph, GraphBuilderStats } from './types.js';
import type { ASTForest } from '../scanner/types.js';
/**
 * Builds partial signal graphs (definitions + emissions) from AST forests.
 *
 * HOP 3.2a delivers partial graph construction, HOP 3.2b adds connections.
 *
 * @example
 * ```typescript
 * const extractor = new SignalExtractor();
 * const builder = new SignalGraphBuilder(extractor);
 *
 * const scanner = new ProjectScanner();
 * const astForest = await scanner.scanProject('/path/to/project', 'full');
 *
 * const partialGraph = await builder.buildPartialGraph(astForest);
 *
 * console.log(partialGraph.metadata);
 * // { version: '3.0.0', signalCount: 42, emissionCount: 127, ... }
 * ```
 */
export declare class SignalGraphBuilder {
    private extractor;
    private stats;
    constructor(extractor: SignalExtractor);
    /**
     * Build partial signal graph from AST forest.
     *
     * Process:
     * 1. Extract signal definitions from all files (Phase 2 regex parser)
     * 2. Extract emission sites from all ASTs (Phase 3 tree-sitter queries)
     * 3. Build Map indices (signal → definitions/emissions)
     * 4. Generate metadata (version, counts, timestamp)
     *
     * @param {ASTForest} astForest - Parsed AST trees from ProjectScanner
     * @returns {Promise<PartialGraph>} Graph with definitions and emissions
     *
     * @throws {Error} If extraction fails catastrophically
     */
    buildPartialGraph(astForest: ASTForest): Promise<PartialGraph>;
    /**
     * Build complete signal graph from AST forest.
     *
     * NEW in Phase 3 HOP 3.2b: Extends partial graph with connection detection.
     *
     * Process:
     * 1. Build partial graph (definitions + emissions) via HOP 3.2a
     * 2. Extract connection sites from all ASTs (tree-sitter queries)
     * 3. Build Map indices (signal → connections)
     * 4. Generate complete metadata
     *
     * @param {ASTForest} astForest - Parsed AST trees from ProjectScanner
     * @returns {Promise<SignalGraph>} Complete graph with definitions, emissions, and connections
     *
     * @throws {Error} If extraction fails catastrophically
     *
     * @example
     * ```typescript
     * const graph = await builder.buildFullGraph(astForest);
     * console.log(graph.metadata.connectionCount); // 42
     * ```
     */
    buildFullGraph(astForest: ASTForest): Promise<SignalGraph>;
    /**
     * Process single file: extract definitions and emissions.
     *
     * @private
     */
    private processFile;
    /**
     * Count total emissions across all signals.
     *
     * @private
     */
    private countEmissions;
    /**
     * Count total connections across all signals.
     *
     * @private
     */
    private countConnections;
    /**
     * Get builder statistics from last build operation.
     *
  ```  /**
     * Get builder statistics from last build operation.
     *
     * @returns {GraphBuilderStats} Build metrics
     */
    getStats(): GraphBuilderStats;
    /**
     * Reset statistics counters.
     */
    resetStats(): void;
    /**
     * Get definition sites for a specific signal.
     *
     * Convenience method for graph consumers.
     *
     * @param {PartialGraph} graph - The partial graph
     * @param {string} signalName - Signal to lookup
     * @returns {SignalDefinition[]} Definition sites (may be empty)
     */
    getDefinitions(graph: PartialGraph, signalName: string): SignalDefinition[];
    /**
     * Get emission sites for a specific signal.
     *
     * Convenience method for graph consumers.
     *
     * @param {PartialGraph} graph - The partial graph
     * @param {string} signalName - Signal to lookup
     * @returns {EmissionSite[]} Emission sites (may be empty)
     */
    getEmissions(graph: PartialGraph, signalName: string): EmissionSite[];
    /**
     * Get connection sites for a specific signal.
     *
     * Convenience method for graph consumers.
     * Works with both PartialGraph and SignalGraph.
     *
     * @param {SignalGraph} graph - The signal graph
     * @param {string} signalName - Signal to lookup
     * @returns {ConnectionSite[]} Connection sites (may be empty)
     */
    getConnections(graph: SignalGraph, signalName: string): ConnectionSite[];
    /**
     * Get all signal names in the graph.
     *
     * Works with both PartialGraph and SignalGraph.
     *
     * @param {PartialGraph | SignalGraph} graph - The graph
     * @returns {string[]} Unique signal names (sorted)
     */
    getAllSignalNames(graph: PartialGraph | SignalGraph): string[];
    /**
     * Find signals with emissions but no definitions (potential errors).
     *
     * Useful for unused signal detection (HOP 3.3).
  ```  /**
     * Find signals with emissions but no definitions (potential errors).
     *
     * Useful for unused signal detection (HOP 3.3).
     *
     * @param {PartialGraph} graph - The partial graph
     * @returns {string[]} Signal names emitted but never defined
     */
    findUndefinedSignals(graph: PartialGraph): string[];
    /**
     * Find signals with definitions but no emissions (potential dead code).
     *
     * Useful for unused signal detection (HOP 3.3).
     *
     * @param {PartialGraph} graph - The partial graph
     * @returns {string[]} Signal names defined but never emitted
     */
    findUnemittedSignals(graph: PartialGraph): string[];
}
//# sourceMappingURL=signal_graph_builder.d.ts.map