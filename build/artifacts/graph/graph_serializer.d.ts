/**
 * Signal Graph Serializer - Phase 3 HOP 3.2b
 *
 * Handles JSON serialization/deserialization of signal graphs for caching.
 *
 * Features:
 * - Map<K,V> → Object serialization for JSON compatibility
 * - Zod schema validation on deserialization
 * - Version checking to prevent stale cache loading
 * - Compression-friendly format (nested objects, no redundancy)
 *
 * Performance:
 * - Target: <100ms serialize/deserialize for 300-signal graph
 * - Memory-efficient: Single-pass conversion
 *
 * @module artifacts/graph
 */
import type { SignalGraph, PartialGraph } from './types.js';
/**
 * Signal graph serialization utilities.
 *
 * @example
 * ```typescript
 * const serializer = new GraphSerializer();
 *
 * // Save graph to cache
 * await serializer.save(graph, '/tmp/signal_graph.json');
 *
 * // Load graph from cache
 * const loaded = await serializer.load('/tmp/signal_graph.json');
 *
 * if (loaded) {
 *   console.log('Loaded graph with', loaded.metadata.signalCount, 'signals');
 * }
 * ```
 */
export declare class GraphSerializer {
    private readonly CURRENT_VERSION;
    /**
     * Serialize signal graph to JSON file.
     *
     * Process:
     * 1. Convert Map<K,V> to Object for JSON compatibility
     * 2. Add version metadata
     * 3. Write to file with pretty-printing
     *
     * @param {SignalGraph | PartialGraph} graph - Graph to serialize
     * @param {string} filePath - Output file path
     *
     * @throws {Error} If file write fails
     */
    save(graph: SignalGraph | PartialGraph, filePath: string): Promise<void>;
    /**
     * Deserialize signal graph from JSON file.
     *
     * Process:
     * 1. Read and parse JSON
     * 2. Validate with Zod schema
     * 3. Check version compatibility
     * 4. Convert Object to Map<K,V>
     *
     * @param {string} filePath - Input file path
     * @returns {Promise<SignalGraph | null>} Deserialized graph, or null if file doesn't exist or version mismatch
     *
     * @throws {Error} If file read fails or validation fails
     */
    load(filePath: string): Promise<SignalGraph | null>;
    /**
     * Check if cached graph is stale compared to source files.
     *
     * @param {string} cachePath - Path to cached graph JSON
     * @param {number} latestSourceMtime - Latest modification time of source files
     * @returns {Promise<boolean>} True if cache is stale (should rebuild)
     */
    isStale(cachePath: string, latestSourceMtime: number): Promise<boolean>;
    /**
     * Convert Map to plain Object for JSON serialization.
     *
     * @private
     */
    private mapToObject;
    /**
     * Convert plain Object to Map for deserialization.
     *
     * @private
     */
    private objectToMap;
    /**
     * Get cache file stats (size, timestamp).
     *
     * @param {string} filePath - Cache file path
     * @returns {Promise<{ sizeBytes: number; timestamp: number } | null>} Stats or null if file doesn't exist
     */
    getStats(filePath: string): Promise<{
        sizeBytes: number;
        timestamp: number;
    } | null>;
}
//# sourceMappingURL=graph_serializer.d.ts.map