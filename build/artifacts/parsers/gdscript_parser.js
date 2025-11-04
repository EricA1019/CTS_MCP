/**
 * GDScript Signal Parser
 * Extracts signal definitions from GDScript files using tree-sitter WASM
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseGDScriptFile, findSignalDefinitions as findSignalsWASM, } from '../../utils/tree_sitter.js';
/**
 * Parse signal definitions from a GDScript file using tree-sitter WASM
 */
export async function parseGDScriptSignals(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const source = path.basename(filePath, '.gd');
    try {
        // Use WASM parser for accurate AST-based extraction
        const tree = await parseGDScriptFile(filePath, true); // Use cache
        const wasmSignals = findSignalsWASM(tree);
        // Convert WASM signal format to our interface
        return wasmSignals.map((sig) => ({
            name: sig.name,
            params: sig.params,
            filePath,
            line: sig.line,
            source,
            paramTypes: sig.paramTypes,
        }));
    }
    catch (error) {
        // Fallback to regex if WASM fails
        console.warn(`WASM parser failed for ${filePath}, using regex fallback:`, error);
        return parseGDScriptSignalsRegex(filePath);
    }
}
/**
 * Fallback regex-based parser (legacy)
 *
 * @deprecated Use parseGDScriptSignals (WASM-based) instead
 */
function parseGDScriptSignalsRegex(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const signals = [];
    // Regex pattern for signal definitions
    // Matches: signal signal_name(param1: Type1, param2: Type2)
    const signalRegex = /^\s*signal\s+(\w+)\s*(?:\(([^)]*)\))?/;
    const source = path.basename(filePath, '.gd');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = signalRegex.exec(line);
        if (match) {
            const signalName = match[1];
            const paramsStr = match[2] || '';
            // Parse parameters with types
            const params = [];
            const paramTypes = {};
            if (paramsStr.trim()) {
                const paramList = paramsStr.split(',').map(p => p.trim());
                for (const param of paramList) {
                    // Extract param name and type (e.g., "entity: Node" -> name="entity", type="Node")
                    const paramMatch = /^(\w+)\s*:\s*(\w+(?:\[.*?\])?)/.exec(param);
                    if (paramMatch) {
                        const paramName = paramMatch[1];
                        const paramType = paramMatch[2];
                        params.push(paramName);
                        paramTypes[paramName] = paramType;
                    }
                    else {
                        // No type annotation, just param name
                        params.push(param);
                    }
                }
            }
            signals.push({
                name: signalName,
                params,
                filePath,
                line: i + 1,
                source,
                paramTypes,
            });
        }
    }
    return signals;
}
/**
 * Find signal connections in GDScript files (connect() calls)
 * Note: This is a simplified implementation for Phase 1
 * Full implementation would use grep or AST parsing
 */
export function findSignalConnections(projectPath, signalName) {
    const connections = [];
    // For Phase 1, return empty array
    // Real implementation in Phase 2 would use:
    // - grep -rn "${signalName}.connect" ${projectPath} --include="*.gd"
    // - Or ripgrep for faster search
    // - Or GDScript AST parser for accurate parsing
    return connections;
}
/**
 * Parse all signals from EventBus and SignalBus
 */
export async function parseProjectSignals(projectPath) {
    const eventBusPath = path.join(projectPath, 'autoload', 'EventBus.gd');
    const signalBusPath = path.join(projectPath, 'autoload', 'SignalBus.gd');
    const eventBusSignals = fs.existsSync(eventBusPath)
        ? await parseGDScriptSignals(eventBusPath)
        : [];
    const signalBusSignals = fs.existsSync(signalBusPath)
        ? await parseGDScriptSignals(signalBusPath)
        : [];
    return {
        eventBusSignals,
        signalBusSignals,
        totalCount: eventBusSignals.length + signalBusSignals.length,
    };
}
//# sourceMappingURL=gdscript_parser.js.map