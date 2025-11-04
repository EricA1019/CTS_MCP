/**
 * Signal Graph Types
 * 
 * Type definitions for project-wide signal graph with definitions, emissions, and connections.
 * 
 * @module graph/types
 */

import type { Tree } from 'tree-sitter';
import type { SignalDefinition } from '../parsers/gdscript_parser.js';

/**
 * Signal emission site in source code.
 * 
 * Represents a location where a signal is emitted via .emit() call.
 */
export interface EmissionSite {
  /** Signal name being emitted */
  signalName: string;
  /** Absolute file path */
  filePath: string;
  /** Line number (1-indexed) */
  line: number;
  /** Source code context (2 lines before/after) */
  context: string;
  /** Emitter object/class (e.g., 'self', 'EventBus', 'player') */
  emitter?: string;
  /** Emission arguments (if any) */
  args?: string[];
}

/**
 * Signal connection site in source code.
 * 
 * Represents a location where a signal is connected to a handler via .connect() call.
 */
export interface ConnectionSite {
  /** Signal name being connected */
  signalName: string;
  /** Absolute file path */
  filePath: string;
  /** Line number (1-indexed) */
  line: number;
  /** Source code context */
  context: string;
  /** Target object/receiver */
  target?: string;
  /** Handler method name or lambda */
  handler: string;
  /** Connection flags (CONNECT_ONE_SHOT, etc.) */
  flags?: string[];
  /** Whether this is a lambda connection */
  isLambda: boolean;
}

/**
 * Partial signal graph (definitions + emissions only).
 * 
 * Built in HOP 3.2a before connection extraction (HOP 3.2b).
 */
export interface PartialGraph {
  /** Map: signal name → array of definition sites */
  definitions: Map<string, SignalDefinition[]>;
  /** Map: signal name → array of emission sites */
  emissions: Map<string, EmissionSite[]>;
  /** Graph metadata */
  metadata: GraphMetadata;
}

/**
 * Complete signal graph (definitions + emissions + connections).
 * 
 * Built in HOP 3.2b after all extraction complete.
 */
export interface SignalGraph extends PartialGraph {
  /** Map: signal name → array of connection sites */
  connections: Map<string, ConnectionSite[]>;
}

/**
 * Signal graph metadata for versioning and caching.
 */
export interface GraphMetadata {
  /** Schema version (3.0.0 for Phase 3) */
  version: string;
  /** Build timestamp (Unix ms) */
  timestamp: number;
  /** Total files scanned */
  fileCount: number;
  /** Total signals found */
  signalCount: number;
  /** Total emission sites */
  emissionCount: number;
  /** Total connection sites (0 in PartialGraph) */
  connectionCount?: number;
}

/**
 * Graph builder statistics for observability.
 */
export interface GraphBuilderStats {
  /** Files processed */
  filesProcessed: number;
  /** Signals discovered */
  signalsDiscovered: number;
  /** Emission sites found */
  emissionsFound: number;
  /** Connection sites found */
  connectionsFound: number;
  /** Build duration in milliseconds */
  durationMs: number;
  /** Peak memory usage in bytes */
  peakMemoryBytes: number;
}

/**
 * AST node context for emission/connection extraction.
 * 
 * Helper structure for tree-sitter query processing.
 */
export interface ASTNodeContext {
  /** Tree-sitter node */
  node: any;
  /** Parent node */
  parent?: any;
  /** Grandparent node (for deep context) */
  grandparent?: any;
  /** Node source text */
  text: string;
  /** Start position */
  startPosition: { row: number; column: number };
  /** End position */
  endPosition: { row: number; column: number };
}
