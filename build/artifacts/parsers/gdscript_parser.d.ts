/**
 * GDScript Signal Parser
 * Extracts signal definitions from GDScript files using tree-sitter WASM
 */
export interface SignalDefinition {
    name: string;
    params: string[];
    filePath: string;
    line: number;
    source: string;
    paramTypes?: Record<string, string>;
}
export interface SignalConnection {
    signalName: string;
    sourcePath: string;
    targetPath: string;
    targetMethod: string;
    line: number;
}
/**
 * Parse signal definitions from a GDScript file using tree-sitter WASM
 */
export declare function parseGDScriptSignals(filePath: string): Promise<SignalDefinition[]>;
/**
 * Find signal connections in GDScript files (connect() calls)
 * Note: This is a simplified implementation for Phase 1
 * Full implementation would use grep or AST parsing
 */
export declare function findSignalConnections(projectPath: string, signalName: string): SignalConnection[];
/**
 * Parse all signals from EventBus and SignalBus
 */
export declare function parseProjectSignals(projectPath: string): Promise<{
    eventBusSignals: SignalDefinition[];
    signalBusSignals: SignalDefinition[];
    totalCount: number;
}>;
//# sourceMappingURL=gdscript_parser.d.ts.map