/**
 * Refactoring Types
 *
 * Type definitions for refactoring suggestions and naming convention validation.
 *
 * @module refactoring/types
 */
/**
 * Refactoring suggestion type.
 */
export var RefactorType;
(function (RefactorType) {
    /** Rename signal to similar name (duplicate detection) */
    RefactorType["Merge"] = "merge";
    /** Rename signal to fix naming convention */
    RefactorType["Rename"] = "rename";
    /** Mark signal as deprecated */
    RefactorType["Deprecate"] = "deprecate";
})(RefactorType || (RefactorType = {}));
//# sourceMappingURL=types.js.map