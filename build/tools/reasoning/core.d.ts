/**
 * Reasoning Engine Core
 *
 * Template-driven reasoning loop with state management and convergence detection.
 * Supports iterative reasoning with assumptions, axioms, and tag tracking.
 *
 * @module tools/reasoning/core
 */
/**
 * Reasoning state at a specific iteration
 */
export interface ReasoningState {
    thought_number: number;
    total_thoughts: number;
    stage: string;
    thought: string;
    assumptions_challenged: string[];
    axioms_used: string[];
    tags: string[];
    next_thought_needed: boolean;
}
/**
 * Reasoning context for template substitution
 */
export interface ReasoningContext {
    topic: string;
    previous_thoughts?: string[];
    current_stage?: string;
    [key: string]: unknown;
}
/**
 * Core reasoning engine with template-driven iteration
 */
export declare class ReasoningEngine {
    private state;
    private initialTotalThoughts;
    constructor(initialThoughts?: number);
    /**
     * Execute a single reasoning iteration
     *
     * @param stage - Current reasoning stage
     * @param context - Context data for template substitution
     * @returns Updated reasoning state
     */
    iterate(stage: string, context: ReasoningContext): Promise<ReasoningState>;
    /**
     * Check if reasoning has converged
     *
     * @returns True if no more thoughts needed, false otherwise
     */
    converged(): boolean;
    /**
     * Get current reasoning state (immutable copy)
     *
     * @returns Current state snapshot
     */
    getState(): ReasoningState;
    /**
     * Set reasoning state (for persistence/restoration)
     *
     * @param state - State to restore
     */
    setState(state: ReasoningState): void;
    /**
     * Adjust total thoughts dynamically
     *
     * @param newTotal - New total thoughts count
     */
    adjustTotalThoughts(newTotal: number): void;
    /**
     * Generate thought content based on stage and context
     *
     * @param stage - Current reasoning stage
     * @param context - Reasoning context
     * @returns Generated thought text
     */
    private generateThought;
    /**
     * Update state properties based on current stage
     *
     * @param stage - Current reasoning stage
     * @param context - Reasoning context
     */
    private updateStateForStage;
    /**
     * Reset engine to initial state
     */
    reset(): void;
}
//# sourceMappingURL=core.d.ts.map