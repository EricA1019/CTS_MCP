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
export class SignalGraphBuilder {
    extractor;
    stats = {
        filesProcessed: 0,
        signalsDiscovered: 0,
        emissionsFound: 0,
        connectionsFound: 0,
        durationMs: 0,
        peakMemoryBytes: 0,
    };
    constructor(extractor) {
        this.extractor = extractor;
    }
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
    async buildPartialGraph(astForest) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        this.resetStats();
        const definitions = new Map();
        const emissions = new Map();
        try {
            // Process each file in the AST forest
            for (const astMeta of astForest) {
                await this.processFile(astMeta, definitions, emissions);
                this.stats.filesProcessed++;
            }
            // Build metadata
            const metadata = {
                version: '3.0.0',
                timestamp: Date.now(),
                fileCount: astForest.length,
                signalCount: definitions.size,
                emissionCount: this.countEmissions(emissions),
            };
            // Update stats
            this.stats.durationMs = Date.now() - startTime;
            this.stats.peakMemoryBytes = Math.max(process.memoryUsage().heapUsed - startMemory, 0);
            return { definitions, emissions, metadata };
        }
        catch (error) {
            console.error('Failed to build partial graph:', error);
            throw error;
        }
    }
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
    async buildFullGraph(astForest) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        this.resetStats();
        // Build partial graph (definitions + emissions)
        const partialGraph = await this.buildPartialGraph(astForest);
        // Extract connections
        const connections = new Map();
        try {
            for (const astMeta of astForest) {
                const { tree, filePath } = astMeta;
                try {
                    // Extract connection sites (HOP 3.2b method)
                    const fileConnections = await this.extractor.extractConnections(tree, filePath);
                    for (const conn of fileConnections) {
                        const existing = connections.get(conn.signalName) || [];
                        connections.set(conn.signalName, [...existing, conn]);
                        this.stats.connectionsFound++;
                    }
                }
                catch (error) {
                    console.warn(`Failed to extract connections from ${filePath}:`, error);
                    // Continue processing other files
                }
            }
            // Build complete metadata
            const metadata = {
                version: '3.0.0',
                timestamp: Date.now(),
                fileCount: astForest.length,
                signalCount: partialGraph.definitions.size,
                emissionCount: this.countEmissions(partialGraph.emissions),
                connectionCount: this.countConnections(connections),
            };
            // Update stats
            this.stats.durationMs = Date.now() - startTime;
            this.stats.peakMemoryBytes = Math.max(process.memoryUsage().heapUsed - startMemory, 0);
            return {
                definitions: partialGraph.definitions,
                emissions: partialGraph.emissions,
                connections,
                metadata,
            };
        }
        catch (error) {
            console.error('Failed to build full graph:', error);
            throw error;
        }
    }
    /**
     * Process single file: extract definitions and emissions.
     *
     * @private
     */
    async processFile(astMeta, definitions, emissions) {
        const { tree, filePath } = astMeta;
        try {
            // Extract signal definitions (Phase 2 method)
            const fileDefs = await this.extractor.extractSignals(filePath);
            for (const def of fileDefs) {
                const existing = definitions.get(def.name) || [];
                definitions.set(def.name, [...existing, def]);
                this.stats.signalsDiscovered++;
            }
            // Extract emission sites (Phase 3 method)
            const fileEmissions = await this.extractor.extractEmissions(tree, filePath);
            for (const emission of fileEmissions) {
                const existing = emissions.get(emission.signalName) || [];
                emissions.set(emission.signalName, [...existing, emission]);
                this.stats.emissionsFound++;
            }
        }
        catch (error) {
            console.warn(`Failed to process file ${filePath}:`, error);
            // Continue processing other files
        }
    }
    /**
     * Count total emissions across all signals.
     *
     * @private
     */
    countEmissions(emissions) {
        let count = 0;
        for (const sites of emissions.values()) {
            count += sites.length;
        }
        return count;
    }
    /**
     * Count total connections across all signals.
     *
     * @private
     */
    countConnections(connections) {
        let count = 0;
        for (const sites of connections.values()) {
            count += sites.length;
        }
        return count;
    }
    /**
     * Get builder statistics from last build operation.
     *
  ```  /**
     * Get builder statistics from last build operation.
     *
     * @returns {GraphBuilderStats} Build metrics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Reset statistics counters.
     */
    resetStats() {
        this.stats = {
            filesProcessed: 0,
            signalsDiscovered: 0,
            emissionsFound: 0,
            connectionsFound: 0,
            durationMs: 0,
            peakMemoryBytes: 0,
        };
    }
    /**
     * Get definition sites for a specific signal.
     *
     * Convenience method for graph consumers.
     *
     * @param {PartialGraph} graph - The partial graph
     * @param {string} signalName - Signal to lookup
     * @returns {SignalDefinition[]} Definition sites (may be empty)
     */
    getDefinitions(graph, signalName) {
        return graph.definitions.get(signalName) || [];
    }
    /**
     * Get emission sites for a specific signal.
     *
     * Convenience method for graph consumers.
     *
     * @param {PartialGraph} graph - The partial graph
     * @param {string} signalName - Signal to lookup
     * @returns {EmissionSite[]} Emission sites (may be empty)
     */
    getEmissions(graph, signalName) {
        return graph.emissions.get(signalName) || [];
    }
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
    getConnections(graph, signalName) {
        return graph.connections.get(signalName) || [];
    }
    /**
     * Get all signal names in the graph.
     *
     * Works with both PartialGraph and SignalGraph.
     *
     * @param {PartialGraph | SignalGraph} graph - The graph
     * @returns {string[]} Unique signal names (sorted)
     */
    getAllSignalNames(graph) {
        const names = new Set();
        for (const name of graph.definitions.keys()) {
            names.add(name);
        }
        for (const name of graph.emissions.keys()) {
            names.add(name);
        }
        // Include connections if present (SignalGraph)
        if ('connections' in graph) {
            for (const name of graph.connections.keys()) {
                names.add(name);
            }
        }
        return Array.from(names).sort();
    }
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
    findUndefinedSignals(graph) {
        const undefined = [];
        for (const signalName of graph.emissions.keys()) {
            if (!graph.definitions.has(signalName)) {
                undefined.push(signalName);
            }
        }
        return undefined.sort();
    }
    /**
     * Find signals with definitions but no emissions (potential dead code).
     *
     * Useful for unused signal detection (HOP 3.3).
     *
     * @param {PartialGraph} graph - The partial graph
     * @returns {string[]} Signal names defined but never emitted
     */
    findUnemittedSignals(graph) {
        const unemitted = [];
        for (const signalName of graph.definitions.keys()) {
            if (!graph.emissions.has(signalName)) {
                unemitted.push(signalName);
            }
        }
        return unemitted.sort();
    }
}
//# sourceMappingURL=signal_graph_builder.js.map