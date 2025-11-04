/**
 * Audit Compliance Checkers
 *
 * Rule-based compliance checking for CTS standards, code quality, and project structure.
 * Categories:
 * - CTS: File size, hop size, signal-first architecture
 * - Code Quality: Type hints, error handling, complexity
 * - Project Structure: Template usage, addon integration
 */
import { readFileSync } from 'fs';
import { join } from 'path';
/**
 * CTS Rule: File Size Limit
 * Uses configurable threshold from .ctsrc.json (default: 500 lines)
 */
const CTS_FILE_SIZE = {
    id: 'cts_file_size',
    name: 'File Size Limit',
    category: 'cts',
    description: 'Files should not exceed configured line limit (default: 500 lines)',
    check: async (ctx) => {
        const violations = [];
        const maxLines = ctx.config?.maxFileLines ?? 500; // Use config or default
        for (const file of ctx.files.filter((f) => f.endsWith('.gd'))) {
            const filePath = join(ctx.projectPath, file);
            try {
                const source = readFileSync(filePath, 'utf-8');
                const lines = source.split('\n').length;
                if (lines > maxLines) {
                    violations.push({
                        file,
                        line: 0,
                        severity: 'error',
                        message: `File has ${lines} lines (configured limit: ${maxLines})`,
                    });
                }
            }
            catch {
                // Skip unreadable files
            }
        }
        const score = Math.max(0, 100 - violations.length * 20);
        return { passed: violations.length === 0, violations, score };
    },
};
/**
 * CTS Rule: Signal-First Architecture
 */
const CTS_SIGNAL_FIRST = {
    id: 'cts_signal_first',
    name: 'Signal-First Architecture',
    category: 'cts',
    description: 'Classes should use signals for communication',
    check: async (ctx) => {
        const violations = [];
        for (const file of ctx.files.filter((f) => f.endsWith('.gd'))) {
            const filePath = join(ctx.projectPath, file);
            try {
                const source = readFileSync(filePath, 'utf-8');
                // Check if file has class declaration
                if (!source.includes('extends ') && !source.includes('class_name ')) {
                    continue;
                }
                // Check for signal definitions
                const hasSignals = source.includes('signal ');
                // Heuristic: Classes with functions should have signals
                const functionCount = (source.match(/func\s+\w+\(/g) || []).length;
                if (functionCount > 3 && !hasSignals) {
                    violations.push({
                        file,
                        line: 0,
                        severity: 'warning',
                        message: `Class has ${functionCount} functions but no signals (consider signal-first design)`,
                    });
                }
            }
            catch {
                // Skip unreadable files
            }
        }
        const score = Math.max(0, 100 - violations.length * 15);
        return { passed: violations.length === 0, violations, score };
    },
};
/**
 * CTS Rule: Hop Size Limit
 */
const CTS_HOP_SIZE = {
    id: 'cts_hop_size',
    name: 'Hop Size Limit',
    category: 'cts',
    description: 'Implementation hops should be focused (< 10 files changed)',
    check: async (ctx) => {
        // This is a placeholder - actual implementation would check git commits
        // For now, we'll just check project size as a proxy
        const violations = [];
        if (ctx.files.length > 1000) {
            violations.push({
                file: '',
                line: 0,
                severity: 'info',
                message: `Large project (${ctx.files.length} files) - ensure hops remain focused`,
            });
        }
        const score = 100; // Always pass for now
        return { passed: true, violations, score };
    },
};
/**
 * CTS Rule: Template Usage
 */
const CTS_TEMPLATE_USAGE = {
    id: 'cts_template_usage',
    name: 'Template Usage',
    category: 'cts',
    description: 'Scripts should use CTS templates for consistency',
    check: async (ctx) => {
        const violations = [];
        for (const file of ctx.files.filter((f) => f.endsWith('.gd'))) {
            const filePath = join(ctx.projectPath, file);
            try {
                const source = readFileSync(filePath, 'utf-8');
                // Check for CTS template markers
                const hasTemplateMarker = source.includes('# CTS Template') ||
                    source.includes('@tool') ||
                    source.includes('class_name');
                // Files without markers might not use templates
                if (!hasTemplateMarker &&
                    source.length > 100 &&
                    source.includes('extends ')) {
                    violations.push({
                        file,
                        line: 0,
                        severity: 'info',
                        message: 'Consider using CTS templates for consistency',
                    });
                }
            }
            catch {
                // Skip unreadable files
            }
        }
        const score = Math.max(0, 100 - violations.length * 5);
        return { passed: violations.length === 0, violations, score };
    },
};
/**
 * Code Quality Rule: Type Hints
 */
const CODE_QUALITY_TYPE_HINTS = {
    id: 'type_hints',
    name: 'Type Hints',
    category: 'code_quality',
    description: 'Functions should have type hints for parameters and return values',
    check: async (ctx) => {
        const violations = [];
        for (const file of ctx.files.filter((f) => f.endsWith('.gd'))) {
            const filePath = join(ctx.projectPath, file);
            try {
                const source = readFileSync(filePath, 'utf-8');
                const lines = source.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const funcMatch = line.match(/func\s+(\w+)\s*\(/);
                    if (funcMatch) {
                        const funcName = funcMatch[1];
                        // Check if line has return type hint (->)
                        const hasReturnType = line.includes('->');
                        if (!hasReturnType && !funcName.startsWith('_')) {
                            violations.push({
                                file,
                                line: i + 1,
                                severity: 'warning',
                                message: `Function '${funcName}' missing return type hint`,
                            });
                        }
                    }
                }
            }
            catch {
                // Skip unreadable files
            }
        }
        const score = Math.max(0, 100 - violations.length * 2);
        return { passed: violations.length === 0, violations, score };
    },
};
/**
 * Code Quality Rule: Error Handling
 */
const CODE_QUALITY_ERROR_HANDLING = {
    id: 'error_handling',
    name: 'Error Handling',
    category: 'code_quality',
    description: 'Functions should validate inputs and handle errors',
    check: async (ctx) => {
        const violations = [];
        for (const file of ctx.files.filter((f) => f.endsWith('.gd'))) {
            const filePath = join(ctx.projectPath, file);
            try {
                const source = readFileSync(filePath, 'utf-8');
                // Check for functions that don't validate inputs
                const funcMatches = source.matchAll(/func\s+(\w+)\s*\([^)]+\)/g);
                const hasAsserts = source.includes('assert(');
                const hasErrorChecks = source.includes('if not ') || source.includes('if !');
                let functionCount = 0;
                for (const _ of funcMatches) {
                    functionCount++;
                }
                if (functionCount > 5 && !hasAsserts && !hasErrorChecks) {
                    violations.push({
                        file,
                        line: 0,
                        severity: 'warning',
                        message: `File has ${functionCount} functions but no visible error checking`,
                    });
                }
            }
            catch {
                // Skip unreadable files
            }
        }
        const score = Math.max(0, 100 - violations.length * 10);
        return { passed: violations.length === 0, violations, score };
    },
};
/**
 * Code Quality Rule: Function Complexity
 */
const CODE_QUALITY_COMPLEXITY = {
    id: 'complexity',
    name: 'Function Complexity',
    category: 'code_quality',
    description: 'Functions should have low cyclomatic complexity',
    check: async (ctx) => {
        const violations = [];
        for (const file of ctx.files.filter((f) => f.endsWith('.gd'))) {
            const filePath = join(ctx.projectPath, file);
            try {
                const source = readFileSync(filePath, 'utf-8');
                const lines = source.split('\n');
                // Simple complexity: count if/for/while/match per function
                let inFunction = false;
                let funcName = '';
                let funcLine = 0;
                let complexity = 0;
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const funcMatch = line.match(/func\s+(\w+)/);
                    if (funcMatch) {
                        // Check previous function
                        if (inFunction && complexity > 10) {
                            violations.push({
                                file,
                                line: funcLine,
                                severity: 'warning',
                                message: `Function '${funcName}' has complexity ${complexity} (threshold: 10)`,
                            });
                        }
                        // Start new function
                        inFunction = true;
                        funcName = funcMatch[1];
                        funcLine = i + 1;
                        complexity = 1; // Base complexity
                    }
                    else if (inFunction) {
                        // Count control flow statements
                        if (line.match(/\b(if|elif|for|while|match|and|or)\b/)) {
                            complexity++;
                        }
                    }
                }
                // Check last function
                if (inFunction && complexity > 10) {
                    violations.push({
                        file,
                        line: funcLine,
                        severity: 'warning',
                        message: `Function '${funcName}' has complexity ${complexity} (threshold: 10)`,
                    });
                }
            }
            catch {
                // Skip unreadable files
            }
        }
        const score = Math.max(0, 100 - violations.length * 5);
        return { passed: violations.length === 0, violations, score };
    },
};
/**
 * Code Quality Rule: Naming Conventions
 */
const CODE_QUALITY_NAMING = {
    id: 'naming_conventions',
    name: 'Naming Conventions',
    category: 'code_quality',
    description: 'Follow GDScript naming conventions (snake_case for functions/variables)',
    check: async (ctx) => {
        const violations = [];
        for (const file of ctx.files.filter((f) => f.endsWith('.gd'))) {
            const filePath = join(ctx.projectPath, file);
            try {
                const source = readFileSync(filePath, 'utf-8');
                const lines = source.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    // Check function names (should be snake_case)
                    const funcMatch = line.match(/func\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (funcMatch) {
                        const funcName = funcMatch[1];
                        if (funcName.match(/[A-Z]/) && !funcName.startsWith('_')) {
                            violations.push({
                                file,
                                line: i + 1,
                                severity: 'info',
                                message: `Function '${funcName}' should use snake_case`,
                            });
                        }
                    }
                    // Check variable names
                    const varMatch = line.match(/var\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                    if (varMatch) {
                        const varName = varMatch[1];
                        if (varName.match(/[A-Z]/) && !varName.match(/^[A-Z_]+$/)) {
                            violations.push({
                                file,
                                line: i + 1,
                                severity: 'info',
                                message: `Variable '${varName}' should use snake_case or CONSTANT_CASE`,
                            });
                        }
                    }
                }
            }
            catch {
                // Skip unreadable files
            }
        }
        const score = Math.max(0, 100 - violations.length * 1);
        return { passed: violations.length === 0, violations, score };
    },
};
/**
 * Project Structure Rule: Addon Integration
 */
const PROJECT_STRUCTURE_ADDONS = {
    id: 'addon_integration',
    name: 'Addon Integration',
    category: 'project_structure',
    description: 'Addons should be properly integrated and documented',
    check: async (ctx) => {
        const violations = [];
        // Check if addons directory exists
        const addonFiles = ctx.files.filter((f) => f.startsWith('addons/'));
        if (addonFiles.length > 0) {
            // Check for plugin.cfg in addon directories
            const addonDirs = new Set(addonFiles.map((f) => f.split('/').slice(0, 2).join('/')));
            for (const addonDir of addonDirs) {
                const hasPluginCfg = addonFiles.some((f) => f.startsWith(`${addonDir}/plugin.cfg`));
                if (!hasPluginCfg) {
                    violations.push({
                        file: addonDir,
                        line: 0,
                        severity: 'warning',
                        message: 'Addon missing plugin.cfg file',
                    });
                }
            }
        }
        const score = Math.max(0, 100 - violations.length * 10);
        return { passed: violations.length === 0, violations, score };
    },
};
/**
 * Project Structure Rule: Directory Organization
 */
const PROJECT_STRUCTURE_ORGANIZATION = {
    id: 'directory_organization',
    name: 'Directory Organization',
    category: 'project_structure',
    description: 'Project should follow standard directory structure',
    check: async (ctx) => {
        const violations = [];
        // Check for standard directories
        const standardDirs = ['scripts', 'scenes', 'assets', 'test'];
        const projectDirs = new Set(ctx.files.map((f) => f.split('/')[0]).filter((d) => d !== ''));
        const hasStandardStructure = standardDirs.some((dir) => projectDirs.has(dir));
        if (!hasStandardStructure && ctx.files.length > 10) {
            violations.push({
                file: '',
                line: 0,
                severity: 'info',
                message: 'Consider using standard directory structure (scripts/, scenes/, assets/)',
            });
        }
        const score = violations.length === 0 ? 100 : 80;
        return { passed: violations.length === 0, violations, score };
    },
};
/**
 * All available compliance rules
 */
export const ALL_RULES = [
    // CTS Rules (4)
    CTS_FILE_SIZE,
    CTS_SIGNAL_FIRST,
    CTS_HOP_SIZE,
    CTS_TEMPLATE_USAGE,
    // Code Quality Rules (4)
    CODE_QUALITY_TYPE_HINTS,
    CODE_QUALITY_ERROR_HANDLING,
    CODE_QUALITY_COMPLEXITY,
    CODE_QUALITY_NAMING,
    // Project Structure Rules (2)
    PROJECT_STRUCTURE_ADDONS,
    PROJECT_STRUCTURE_ORGANIZATION,
];
/**
 * Get rules by category
 */
export function getRulesByCategory(category) {
    return ALL_RULES.filter((rule) => rule.category === category);
}
//# sourceMappingURL=checkers.js.map