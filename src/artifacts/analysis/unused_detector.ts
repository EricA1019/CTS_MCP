/**
 * Unused Signal Detector - Phase 3 HOP 3.3
 * 
 * Detects unused signals by analyzing SignalGraph for zero-usage patterns.
 * 
 * Architecture:
 * - Pattern 1: Orphan signals (defined but never emitted)
 * - Pattern 2: Dead emitters (emitted but never connected)
 * - Pattern 3: Isolated signals (neither emitted nor connected)
 * 
 * Confidence Scoring:
 * - Isolated: 1.0 (highest confidence)
 * - Orphan: 0.95 baseline (reduced by heuristics)
 * - Dead Emitter: 0.90 baseline (reduced by heuristics)
 * 
 * Heuristics:
 * - Documentation: -0.10 (documented signals likely intentional)
 * - Private signals (_prefix): -0.15 (may be placeholders)
 * - Inheritance hints: -0.20 (may be used in parent/child classes)
 * 
 * Performance:
 * - Target: <500ms for 300 signals
 * - O(n) complexity where n = number of signals
 * - Single pass over graph indices
 * 
 * @module analysis/unused_detector
 */

import type { SignalGraph } from '../graph/types.js';
import type { SignalDefinition } from '../parsers/gdscript_parser.js';
import type { EmissionSite } from '../graph/types.js';
import {
  UnusedPattern,
  type UnusedSignal,
  type UnusedLocation,
  type UnusedDetectorStats,
  type ConfidenceFactors,
} from './types.js';

/**
 * Detects unused signals with confidence scoring.
 * 
 * @example
 * ```typescript
 * const detector = new UnusedDetector();
 * const unused = await detector.detectUnused(signalGraph);
 * 
 * console.log(`Found ${unused.length} unused signals`);
 * unused.forEach(u => {
 *   console.log(`${u.signalName}: ${u.pattern} (${u.confidence})`);
 * });
 * ```
 */
export class UnusedDetector {
  private stats: UnusedDetectorStats = {
    signalsAnalyzed: 0,
    orphansFound: 0,
    deadEmittersFound: 0,
    isolatedFound: 0,
    totalUnused: 0,
    durationMs: 0,
    avgConfidence: 0,
  };

  /**
   * Detect all unused signals in graph.
   * 
   * @param graph - Complete signal graph with definitions, emissions, connections
   * @returns Array of unused signals sorted by confidence (highest first)
   */
  async detectUnused(graph: SignalGraph): Promise<UnusedSignal[]> {
    const startTime = performance.now();
    const unused: UnusedSignal[] = [];

    // Reset stats
    this.stats = {
      signalsAnalyzed: 0,
      orphansFound: 0,
      deadEmittersFound: 0,
      isolatedFound: 0,
      totalUnused: 0,
      durationMs: 0,
      avgConfidence: 0,
    };

    // Pattern 1: Orphan signals (defined but never emitted)
    for (const [signalName, defs] of graph.definitions) {
      this.stats.signalsAnalyzed++;

      const hasEmissions = graph.emissions.has(signalName);
      const hasConnections = graph.connections.has(signalName);

      if (!hasEmissions && !hasConnections) {
        // Pattern 3: Isolated (neither emitted nor connected) - highest confidence
        const isolatedSignal = this.createIsolatedSignal(signalName, defs);
        unused.push(isolatedSignal);
        this.stats.isolatedFound++;
      } else if (!hasEmissions) {
        // Pattern 1: Orphan (defined but never emitted)
        const orphanSignal = this.createOrphanSignal(signalName, defs);
        if (orphanSignal.confidence >= 0.95) {
          unused.push(orphanSignal);
          this.stats.orphansFound++;
        }
      }
    }

    // Pattern 2: Dead emitters (emitted but never connected)
    for (const [signalName, emits] of graph.emissions) {
      const hasConnections = graph.connections.has(signalName);

      if (!hasConnections) {
        // Skip if emission without definition (error case)
        if (!graph.definitions.has(signalName)) {
          continue;
        }

        const deadEmitterSignal = this.createDeadEmitterSignal(signalName, emits);
        if (deadEmitterSignal.confidence >= 0.90) {
          // Only add if not already in unused (avoid duplicates with isolated)
          const alreadyDetected = unused.some(u => u.signalName === signalName);
          if (!alreadyDetected) {
            unused.push(deadEmitterSignal);
            this.stats.deadEmittersFound++;
          }
        }
      }
    }

    // Sort by confidence (highest first)
    unused.sort((a, b) => b.confidence - a.confidence);

    // Update stats
    this.stats.totalUnused = unused.length;
    this.stats.durationMs = performance.now() - startTime;
    if (unused.length > 0) {
      const totalConfidence = unused.reduce((sum, u) => sum + u.confidence, 0);
      this.stats.avgConfidence = totalConfidence / unused.length;
    }

    return unused;
  }

  /**
   * Create isolated signal result (pattern 3).
   * 
   * Isolated signals have highest confidence (1.0) as they have zero usage anywhere.
   */
  private createIsolatedSignal(
    signalName: string,
    defs: SignalDefinition[]
  ): UnusedSignal {
    return {
      signalName,
      pattern: UnusedPattern.Isolated,
      confidence: 1.0, // Highest confidence
      locations: defs.map(d => ({
        file: d.filePath,
        line: d.line,
      })),
      hasDocumentation: false, // Phase 2 SignalDefinition doesn't track doc comments
      isPrivate: signalName.startsWith('_'),
      reason: 'Signal defined but never emitted or connected',
    };
  }

  /**
   * Create orphan signal result (pattern 1).
   * 
   * Orphan signals are defined but never emitted (may still be connected).
   */
  private createOrphanSignal(
    signalName: string,
    defs: SignalDefinition[]
  ): UnusedSignal {
    const factors = this.computeOrphanConfidence(defs);

    return {
      signalName,
      pattern: UnusedPattern.Orphan,
      confidence: factors.finalScore,
      locations: defs.map(d => ({
        file: d.filePath,
        line: d.line,
      })),
      hasDocumentation: false, // Phase 2 SignalDefinition doesn't track doc comments
      isPrivate: signalName.startsWith('_'),
      reason: this.buildConfidenceReason(factors),
    };
  }

  /**
   * Create dead emitter signal result (pattern 2).
   * 
   * Dead emitters are emitted but never connected (no listeners).
   */
  private createDeadEmitterSignal(
    signalName: string,
    emits: EmissionSite[]
  ): UnusedSignal {
    const factors = this.computeDeadEmitterConfidence(emits);

    return {
      signalName,
      pattern: UnusedPattern.DeadEmitter,
      confidence: factors.finalScore,
      locations: emits.map(e => ({
        file: e.filePath,
        line: e.line,
      })),
      hasDocumentation: false, // Emissions don't have doc comments
      isPrivate: signalName.startsWith('_'),
      reason: this.buildConfidenceReason(factors),
    };
  }

  /**
   * Compute confidence for orphan signals.
   * 
   * Base: 0.95
   * Penalties:
   * - Private signal (_prefix): -0.15
   * - Multiple definitions (inheritance hint): -0.20
   * 
   * Note: Phase 2 SignalDefinition doesn't track doc comments or context,
   * so we use simpler heuristics based on name and definition count.
   */
  private computeOrphanConfidence(defs: SignalDefinition[]): ConfidenceFactors {
    let score = 0.95; // Base confidence
    let documentationPenalty = 0; // Not available in Phase 2
    let privatePenalty = 0;
    let inheritancePenalty = 0;

    // Penalty: Private signals may be placeholders
    if (defs.some(d => d.name.startsWith('_'))) {
      privatePenalty = 0.15;
      score -= privatePenalty;
    }

    // Penalty: Multiple definitions suggest inheritance (signal may be used in child class)
    if (defs.length > 1) {
      inheritancePenalty = 0.20;
      score -= inheritancePenalty;
    }

    return {
      baseScore: 0.95,
      documentationPenalty,
      privatePenalty,
      inheritancePenalty,
      finalScore: Math.max(0.0, score),
    };
  }

  /**
   * Compute confidence for dead emitter signals.
   * 
   * Base: 0.90
   * Penalties:
   * - Private signal: -0.15
   * - EventBus emission: -0.10 (may be used elsewhere)
   * - Autoload file emission: -0.20 (may be global)
   */
  private computeDeadEmitterConfidence(emits: EmissionSite[]): ConfidenceFactors {
    let score = 0.90; // Base confidence (lower than orphan)
    let documentationPenalty = 0; // Not applicable for emissions
    let privatePenalty = 0;
    let inheritancePenalty = 0; // Reuse for EventBus/autoload penalty

    // Penalty: Private signals may be placeholders
    const signalName = emits[0]?.signalName;
    if (signalName?.startsWith('_')) {
      privatePenalty = 0.15;
      score -= privatePenalty;
    }

    // Penalty: EventBus emissions may be used elsewhere
    if (emits.some(e => e.emitter === 'EventBus' || e.filePath.includes('EventBus'))) {
      inheritancePenalty = 0.10; // Reuse field for EventBus penalty
      score -= inheritancePenalty;
    }

    // Penalty: Autoload emissions may be global (check file path only)
    if (emits.some(e => e.filePath.includes('/autoload/'))) {
      inheritancePenalty = Math.max(inheritancePenalty, 0.20); // Update if higher
      score -= 0.20;
    }

    return {
      baseScore: 0.90,
      documentationPenalty,
      privatePenalty,
      inheritancePenalty,
      finalScore: Math.max(0.0, score),
    };
  }

  /**
   * Build human-readable confidence reason from factors.
   */
  private buildConfidenceReason(factors: ConfidenceFactors): string {
    const reasons: string[] = [];

    if (factors.documentationPenalty > 0) {
      reasons.push('documented signal');
    }
    if (factors.privatePenalty > 0) {
      reasons.push('private signal (may be placeholder)');
    }
    if (factors.inheritancePenalty > 0) {
      reasons.push('inheritance/global usage hint');
    }

    if (reasons.length === 0) {
      return 'High confidence unused signal';
    }

    return `Confidence reduced by: ${reasons.join(', ')}`;
  }

  /**
   * Get detector statistics.
   */
  getStats(): UnusedDetectorStats {
    return { ...this.stats };
  }

  /**
   * Reset detector statistics.
   */
  resetStats(): void {
    this.stats = {
      signalsAnalyzed: 0,
      orphansFound: 0,
      deadEmittersFound: 0,
      isolatedFound: 0,
      totalUnused: 0,
      durationMs: 0,
      avgConfidence: 0,
    };
  }
}
