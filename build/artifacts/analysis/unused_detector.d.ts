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
import { type UnusedSignal, type UnusedDetectorStats } from './types.js';
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
export declare class UnusedDetector {
    private stats;
    /**
     * Detect all unused signals in graph.
     *
     * @param graph - Complete signal graph with definitions, emissions, connections
     * @returns Array of unused signals sorted by confidence (highest first)
     */
    detectUnused(graph: SignalGraph): Promise<UnusedSignal[]>;
    /**
     * Create isolated signal result (pattern 3).
     *
     * Isolated signals have highest confidence (1.0) as they have zero usage anywhere.
     */
    private createIsolatedSignal;
    /**
     * Create orphan signal result (pattern 1).
     *
     * Orphan signals are defined but never emitted (may still be connected).
     */
    private createOrphanSignal;
    /**
     * Create dead emitter signal result (pattern 2).
     *
     * Dead emitters are emitted but never connected (no listeners).
     */
    private createDeadEmitterSignal;
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
    private computeOrphanConfidence;
    /**
     * Compute confidence for dead emitter signals.
     *
     * Base: 0.90
     * Penalties:
     * - Private signal: -0.15
     * - EventBus emission: -0.10 (may be used elsewhere)
     * - Autoload file emission: -0.20 (may be global)
     */
    private computeDeadEmitterConfidence;
    /**
     * Build human-readable confidence reason from factors.
     */
    private buildConfidenceReason;
    /**
     * Get detector statistics.
     */
    getStats(): UnusedDetectorStats;
    /**
     * Reset detector statistics.
     */
    resetStats(): void;
}
//# sourceMappingURL=unused_detector.d.ts.map