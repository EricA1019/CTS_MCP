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
 * Check if a node has a null guard (is, as, or if check) in parent context
 */
function hasNullGuard(node: Parser.SyntaxNode | null, maxDepth: number = 3): boolean {
  let current = node;
  let depth = 0;
  
  while (current && depth < maxDepth) {
    const parentType = current.type;
    
    // Check for null guard patterns
    if (parentType === 'if_statement' || 
        parentType === 'is_expression' ||
        parentType === 'assert_statement') {
      return true;
    }
    
    current = current.parent;
    depth++;
  }
  
  return false;
}

/**
 * Get node text from source
 */
function getNodeText(node: Parser.SyntaxNode, source: string): string {
  return source.slice(node.startIndex, node.endIndex);
}

/**
 * Check if identifier starts with uppercase (likely a class/constant)
 */
function isUpperCase(text: string): boolean {
  return text.length > 0 && text[0] === text[0].toUpperCase();
}

/**
 * Bug pattern definitions - 10 common patterns
 */
export const BUG_PATTERNS: BugPattern[] = [
  // General patterns (5)
  {
    id: 'missing_null_check',
    name: 'Missing Null Check',
    severity: 'medium',
    description: 'Variable access without null validation',
    detect: (node, source) => {
      if (node.type === 'call' && node.parent) {
        const callee = node.childForFieldName('function');
        if (callee && callee.type === 'attribute') {
          const obj = callee.childForFieldName('object');
          if (obj && obj.type === 'identifier' && !hasNullGuard(node)) {
            const varName = getNodeText(obj, source);
            // Skip if it's a class/constant (uppercase)
            if (!isUpperCase(varName)) {
              return {
                line: node.startPosition.row + 1,
                column: node.startPosition.column + 1,
                message: `Potential null reference on '${varName}' - consider adding null check`,
                suggestion: `if ${varName}: ${getNodeText(node, source)}`,
              };
            }
          }
        }
      }
      return null;
    },
  },
  
  {
    id: 'missing_error_handling',
    name: 'Missing Error Handling',
    severity: 'high',
    description: 'Function call that can fail without error handling',
    detect: (node, source) => {
      if (node.type === 'call') {
        const funcName = node.childForFieldName('function');
        if (funcName) {
          const name = getNodeText(funcName, source);
          // Common error-prone functions
          const riskyFunctions = ['load', 'open', 'connect', 'instantiate', 'get_node'];
          if (riskyFunctions.some(f => name.includes(f))) {
            // Check if result is checked
            const parent = node.parent;
            if (parent && parent.type !== 'if_statement' && parent.type !== 'assignment') {
              return {
                line: node.startPosition.row + 1,
                column: node.startPosition.column + 1,
                message: `Function '${name}' can fail - consider checking return value`,
                suggestion: 'var result = ...; if result: ...',
              };
            }
          }
        }
      }
      return null;
    },
  },
  
  {
    id: 'type_mismatch_likely',
    name: 'Likely Type Mismatch',
    severity: 'medium',
    description: 'Potential type incompatibility',
    detect: (node, source) => {
      if (node.type === 'assignment') {
        const left = node.childForFieldName('left');
        const right = node.childForFieldName('right');
        
        if (left && right) {
          const leftText = getNodeText(left, source);
          const rightText = getNodeText(right, source);
          
          // Detect string assignment to number variable names
          if (leftText.includes('count') || leftText.includes('index') || leftText.includes('num')) {
            if (rightText.includes('"') || rightText.includes("'")) {
              return {
                line: node.startPosition.row + 1,
                column: node.startPosition.column + 1,
                message: `Assigning string to numeric variable '${leftText}'`,
                suggestion: 'Add type hint or use int()/float()',
              };
            }
          }
        }
      }
      return null;
    },
  },
  
  {
    id: 'division_by_zero_risk',
    name: 'Division by Zero Risk',
    severity: 'high',
    description: 'Division operation without denominator validation',
    detect: (node, source) => {
      if (node.type === 'binary_operator') {
        const operator = node.childForFieldName('operator');
        if (operator && getNodeText(operator, source) === '/') {
          const right = node.childForFieldName('right');
          if (right && right.type === 'identifier') {
            if (!hasNullGuard(node)) {
              return {
                line: node.startPosition.row + 1,
                column: node.startPosition.column + 1,
                message: 'Division by zero risk - validate denominator',
                suggestion: 'if denominator != 0: result = numerator / denominator',
              };
            }
          }
        }
      }
      return null;
    },
  },
  
  {
    id: 'unused_return_value',
    name: 'Unused Return Value',
    severity: 'low',
    description: 'Function with return value called without using result',
    detect: (node, source) => {
      if (node.type === 'expression_statement') {
        const child = node.firstChild;
        if (child && child.type === 'call') {
          const funcName = child.childForFieldName('function');
          if (funcName) {
            const name = getNodeText(funcName, source);
            // Functions that typically return important values
            if (name.startsWith('get_') || name.includes('find') || name.includes('search')) {
              return {
                line: node.startPosition.row + 1,
                column: node.startPosition.column + 1,
                message: `Return value of '${name}' is unused`,
                suggestion: 'var result = ' + getNodeText(child, source),
              };
            }
          }
        }
      }
      return null;
    },
  },
  
  // GDScript-specific patterns (5)
  {
    id: 'signal_leak',
    name: 'Signal Not Disconnected',
    severity: 'high',
    description: 'Signal connection without corresponding disconnection',
    detect: (node, source) => {
      if (node.type === 'call') {
        const funcName = node.childForFieldName('function');
        if (funcName && getNodeText(funcName, source).endsWith('.connect')) {
          // Check if there's a matching disconnect in the file
          // This is a simplified heuristic - full analysis would track signal names
          const text = getNodeText(node, source);
          const signalName = text.match(/\.connect\(["'](\w+)["']/)?.[1];
          
          if (signalName) {
            return {
              line: node.startPosition.row + 1,
              column: node.startPosition.column + 1,
              message: `Signal '${signalName}' connected but may not be disconnected`,
              suggestion: 'Add disconnect() in _exit_tree() or cleanup method',
            };
          }
        }
      }
      return null;
    },
  },
  
  {
    id: 'node_not_freed',
    name: 'Node Not Freed',
    severity: 'critical',
    description: 'Dynamically created node without queue_free() or free()',
    detect: (node, source) => {
      if (node.type === 'call') {
        const funcName = node.childForFieldName('function');
        if (funcName) {
          const name = getNodeText(funcName, source);
          // Check for node creation
          if (name === 'new' || name.includes('.new') || name.includes('.instance')) {
            // This is a basic check - proper analysis would track variable lifecycle
            return {
              line: node.startPosition.row + 1,
              column: node.startPosition.column + 1,
              message: 'Dynamically created node may not be freed',
              suggestion: 'Call queue_free() when done or use add_child() for auto-cleanup',
            };
          }
        }
      }
      return null;
    },
  },
  
  {
    id: 'missing_ready_check',
    name: 'Missing Ready Check',
    severity: 'medium',
    description: 'Node access in _init() instead of _ready()',
    detect: (node, source) => {
      if (node.type === 'function_definition') {
        const nameNode = node.childForFieldName('name');
        if (nameNode && getNodeText(nameNode, source) === '_init') {
          // Check for get_node or $ calls in _init
          const body = node.childForFieldName('body');
          if (body) {
            const hasNodeAccess = body.descendantsOfType('call').some(call => {
              const func = call.childForFieldName('function');
              return func && (getNodeText(func, source).includes('get_node') || 
                             getNodeText(func, source).includes('$'));
            });
            
            if (hasNodeAccess) {
              return {
                line: node.startPosition.row + 1,
                column: node.startPosition.column + 1,
                message: 'Node access in _init() - use _ready() instead',
                suggestion: 'Move node access to _ready() function',
              };
            }
          }
        }
      }
      return null;
    },
  },
  
  {
    id: 'export_without_type',
    name: 'Export Without Type Hint',
    severity: 'low',
    description: 'Exported variable lacks type hint for editor',
    detect: (node, source) => {
      if (node.type === 'decorated_definition') {
        const decorator = node.childForFieldName('decorator');
        if (decorator && getNodeText(decorator, source).includes('@export')) {
          const definition = node.childForFieldName('definition');
          if (definition && definition.type === 'variable_declaration') {
            const typeNode = definition.childForFieldName('type');
            if (!typeNode) {
              const varName = definition.childForFieldName('name');
              return {
                line: node.startPosition.row + 1,
                column: node.startPosition.column + 1,
                message: `Exported variable '${varName ? getNodeText(varName, source) : 'unknown'}' lacks type hint`,
                suggestion: '@export var name: Type = value',
              };
            }
          }
        }
      }
      return null;
    },
  },
  
  {
    id: 'onready_with_null_path',
    name: 'Onready With Potentially Invalid Path',
    severity: 'medium',
    description: '@onready variable with hardcoded node path',
    detect: (node, source) => {
      if (node.type === 'decorated_definition') {
        const decorator = node.childForFieldName('decorator');
        if (decorator && getNodeText(decorator, source).includes('@onready')) {
          const definition = node.childForFieldName('definition');
          if (definition) {
            const initializer = definition.childForFieldName('value');
            if (initializer) {
              const text = getNodeText(initializer, source);
              // Check for hardcoded paths like get_node("HardcodedPath")
              if (text.includes('get_node') && /["'][^$%]/.test(text)) {
                return {
                  line: node.startPosition.row + 1,
                  column: node.startPosition.column + 1,
                  message: '@onready with hardcoded path - may break if scene structure changes',
                  suggestion: 'Use $NodeName or add null check in _ready()',
                };
              }
            }
          }
        }
      }
      return null;
    },
  },
];

/**
 * Apply all heuristic patterns to an AST and collect bug matches
 * 
 * @param tree - Tree-sitter parse tree
 * @param source - Original source code
 * @returns Array of bug matches
 */
export function applyHeuristics(tree: Parser.Tree, source: string): BugMatch[] {
  const matches: BugMatch[] = [];
  
  // Traverse all nodes
  const cursor = tree.walk();
  
  function visit() {
    const node = cursor.currentNode;
    
    // Apply each pattern to this node
    for (const pattern of BUG_PATTERNS) {
      try {
        const match = pattern.detect(node, source);
        if (match) {
          matches.push({
            pattern: pattern.id,
            name: pattern.name,
            severity: pattern.severity,
            ...match,
          });
        }
      } catch (error) {
        // Pattern detection failed, continue with other patterns
        console.error(`[Bughunter] Pattern ${pattern.id} failed:`, error);
      }
    }
    
    // Visit children
    if (cursor.gotoFirstChild()) {
      do {
        visit();
      } while (cursor.gotoNextSibling());
      cursor.gotoParent();
    }
  }
  
  visit();
  
  return matches;
}

/**
 * Calculate severity score (0-100)
 */
export function calculateSeverityScore(bugs: BugMatch[]): number {
  const weights = {
    low: 1,
    medium: 3,
    high: 7,
    critical: 15,
  };
  
  let totalWeight = 0;
  for (const bug of bugs) {
    totalWeight += weights[bug.severity];
  }
  
  // Scale to 0-100 (100 = 20+ critical bugs)
  const maxScore = 100;
  const score = Math.min(100, (totalWeight / 300) * 100);
  
  return Math.round(100 - score); // Invert so 100 = clean, 0 = many bugs
}
