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
export var UnusedPattern;
(function (UnusedPattern) {
    /** Signal defined but never emitted */
    UnusedPattern["Orphan"] = "orphan";
    /** Signal emitted but never connected */
    UnusedPattern["DeadEmitter"] = "dead_emitter";
    /** Signal neither emitted nor connected */
    UnusedPattern["Isolated"] = "isolated";
})(UnusedPattern || (UnusedPattern = {}));
//# sourceMappingURL=types.js.map