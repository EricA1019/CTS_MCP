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

import { writeFileSync, readFileSync, existsSync, statSync } from 'fs';
import { z } from 'zod';
import type { SignalGraph, PartialGraph, GraphMetadata } from './types.js';
import type { SignalDefinition } from '../parsers/gdscript_parser.js';

/**
 * JSON-serializable representation of SignalGraph.
 * 
 * Maps are converted to objects for JSON compatibility:
 * - Map<string, T[]> → { [key: string]: T[] }
 */
interface SerializedGraph {
  version: string;
  metadata: GraphMetadata;
  definitions: { [signalName: string]: SignalDefinition[] };
  emissions: { [signalName: string]: any[] };
  connections?: { [signalName: string]: any[] };
}

/**
 * Zod schema for validating deserialized graphs.
 */
const SerializedGraphSchema = z.object({
  version: z.string(),
  metadata: z.object({
    version: z.string(),
    timestamp: z.number(),
    fileCount: z.number(),
    signalCount: z.number(),
    emissionCount: z.number(),
    connectionCount: z.number().optional(),
  }),
  definitions: z.record(z.array(z.any())),
  emissions: z.record(z.array(z.any())),
  connections: z.record(z.array(z.any())).optional(),
});

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
export class GraphSerializer {
  private readonly CURRENT_VERSION = '3.0.0';

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
  async save(graph: SignalGraph | PartialGraph, filePath: string): Promise<void> {
    const startTime = Date.now();

    try {
      // Convert Maps to Objects
      const serialized: SerializedGraph = {
        version: this.CURRENT_VERSION,
        metadata: graph.metadata,
        definitions: this.mapToObject(graph.definitions),
        emissions: this.mapToObject(graph.emissions),
      };

      // Add connections if present (SignalGraph)
      if ('connections' in graph) {
        serialized.connections = this.mapToObject(graph.connections);
      }

      // Write to file
      const json = JSON.stringify(serialized, null, 2);
      writeFileSync(filePath, json, 'utf-8');

      const durationMs = Date.now() - startTime;
      console.log(`Serialized graph to ${filePath} in ${durationMs}ms`);
    } catch (error) {
      console.error(`Failed to serialize graph to ${filePath}:`, error);
      throw error;
    }
  }

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
  async load(filePath: string): Promise<SignalGraph | null> {
    const startTime = Date.now();

    try {
      // Check if file exists
      try {
        existsSync(filePath);
      } catch {
        return null; // File doesn't exist
      }

      // Read file
      const json = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(json);

      // Validate schema
      const validated = SerializedGraphSchema.parse(data);

      // Check version
      if (validated.version !== this.CURRENT_VERSION) {
        console.warn(
          `Cache version mismatch: expected ${this.CURRENT_VERSION}, got ${validated.version}. Ignoring cache.`
        );
        return null;
      }

      // Convert Objects to Maps
      const graph: SignalGraph = {
        metadata: validated.metadata,
        definitions: this.objectToMap(validated.definitions),
        emissions: this.objectToMap(validated.emissions),
        connections: validated.connections
          ? this.objectToMap(validated.connections)
          : new Map(),
      };

      const durationMs = Date.now() - startTime;
      console.log(`Deserialized graph from ${filePath} in ${durationMs}ms`);

      return graph;
    } catch (error) {
      console.error(`Failed to deserialize graph from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Check if cached graph is stale compared to source files.
   * 
   * @param {string} cachePath - Path to cached graph JSON
   * @param {number} latestSourceMtime - Latest modification time of source files
   * @returns {Promise<boolean>} True if cache is stale (should rebuild)
   */
  async isStale(cachePath: string, latestSourceMtime: number): Promise<boolean> {
    try {
      const graph = await this.load(cachePath);
      if (!graph) return true; // Cache doesn't exist

      // Check if cache timestamp is older than latest source file
      return graph.metadata.timestamp < latestSourceMtime;
    } catch {
      return true; // Error reading cache
    }
  }

  /**
   * Convert Map to plain Object for JSON serialization.
   * 
   * @private
   */
  private mapToObject<V>(map: Map<string, V>): { [key: string]: V } {
    const obj: { [key: string]: V } = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  /**
   * Convert plain Object to Map for deserialization.
   * 
   * @private
   */
  private objectToMap<V>(obj: { [key: string]: V }): Map<string, V> {
    const map = new Map<string, V>();
    for (const [key, value] of Object.entries(obj)) {
      map.set(key, value);
    }
    return map;
  }

  /**
   * Get cache file stats (size, timestamp).
   * 
   * @param {string} filePath - Cache file path
   * @returns {Promise<{ sizeBytes: number; timestamp: number } | null>} Stats or null if file doesn't exist
   */
  async getStats(filePath: string): Promise<{ sizeBytes: number; timestamp: number } | null> {
    try {
      const { stat } = await import('fs/promises');
      const stats = statSync(filePath);
      return {
        sizeBytes: stats.size,
        timestamp: stats.mtimeMs,
      };
    } catch {
      return null;
    }
  }
}
