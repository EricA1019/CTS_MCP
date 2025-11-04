/**
 * Analysis Types
 * 
 * Type definitions for signal analysis (unused detection, refactoring suggestions, clustering).
 * 
 * @module analysis/types
 */

/**
 * Unused signal detection pattern.
 */
export enum UnusedPattern {
  /** Signal defined but never emitted */
  Orphan = 'orphan',
  /** Signal emitted but never connected */
  DeadEmitter = 'dead_emitter',
  /** Signal neither emitted nor connected */
  Isolated = 'isolated',
}

/**
 * Location of unused signal in source code.
 */
export interface UnusedLocation {
  /** Absolute file path */
  file: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (optional) */
  column?: number;
}

/**
 * Unused signal detection result.
 */
export interface UnusedSignal {
  /** Signal name */
  signalName: string;
  /** Detection pattern */
  pattern: UnusedPattern;
  /** Confidence score (0.0-1.0) */
  confidence: number;
  /** Locations where signal is defined/emitted */
  locations: UnusedLocation[];
  /** Optional reason for low confidence */
  reason?: string;
  /** Whether signal has documentation */
  hasDocumentation?: boolean;
  /** Whether signal is private (starts with _) */
  isPrivate?: boolean;
}

/**
 * Unused detector statistics.
 */
export interface UnusedDetectorStats {
  /** Total signals analyzed */
  signalsAnalyzed: number;
  /** Orphan signals found */
  orphansFound: number;
  /** Dead emitters found */
  deadEmittersFound: number;
  /** Isolated signals found */
  isolatedFound: number;
  /** Total unused signals */
  totalUnused: number;
  /** Detection duration in ms */
  durationMs: number;
  /** Average confidence score */
  avgConfidence: number;
}

/**
 * Confidence computation factors.
 */
export interface ConfidenceFactors {
  /** Base confidence before adjustments */
  baseScore: number;
  /** Documentation adjustment (-0.10 if documented) */
  documentationPenalty: number;
  /** Private signal adjustment (-0.15 if starts with _) */
  privatePenalty: number;
  /** Inheritance hint adjustment (-0.20 if likely from parent) */
  inheritancePenalty: number;
  /** Final computed confidence */
  finalScore: number;
}
