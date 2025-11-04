/**
 * Bughunter Heuristics Engine
 *
 * Pattern-based bug detection for GDScript with severity scoring.
 * Detects common programming errors and GDScript-specific antipatterns.
 */
import Parser from 'tree-sitter';
/**
 * Bug match result from pattern detection
 */
export interface BugMatch {
    pattern: string;
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    line: number;
    column: number;
    message: string;
    file?: string;
    suggestion?: string;
}
/**
 * Bug pattern definition
 */
export interface BugPattern {
    id: string;
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detect: (node: Parser.SyntaxNode, source: string) => Omit<BugMatch, 'pattern' | 'name' | 'severity'> | null;
}
/**
 * Bug pattern definitions - 10 common patterns
 */
export declare const BUG_PATTERNS: BugPattern[];
/**
 * Apply all heuristic patterns to an AST and collect bug matches
 *
 * @param tree - Tree-sitter parse tree
 * @param source - Original source code
 * @returns Array of bug matches
 */
export declare function applyHeuristics(tree: Parser.Tree, source: string): BugMatch[];
/**
 * Calculate severity score (0-100)
 */
export declare function calculateSeverityScore(bugs: BugMatch[]): number;
//# sourceMappingURL=heuristics.d.ts.map