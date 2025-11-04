/**
 * Signal Extraction Service
 * 
 * Provides unified signal extraction using regex-based parser (Phase 1)
 * with architecture prepared for tree-sitter AST integration (Phase 2 future).
 * 
 * Design Pattern: Adapter/Facade
 * - Wraps gdscript_parser.ts in extensible interface
 * - Maintains SignalDefinition schema compatibility
 * - Enables future tree-sitter drop-in replacement
 * 
 * @module signal_extractor
 */

import { parseGDScriptSignals, SignalDefinition } from './gdscript_parser.js';
import { TreeSitterBridge } from './tree_sitter_bridge.js';
import type { Tree } from 'tree-sitter';
import type { EmissionSite } from '../graph/types.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { readFile } from 'fs';

/**
 * Zod schema for validating SignalDefinition structures.
 * Ensures type safety and runtime validation of extracted signals.
 */
export const SignalDefinitionSchema = z.object({
  name: z.string().min(1),
  params: z.array(z.string()),
  filePath: z.string().min(1),
  line: z.number().int().positive(),
  source: z.string().min(1),
  paramTypes: z.record(z.string(), z.string()).optional(),
});

/**
 * Extraction statistics for diagnostics and performance monitoring.
 */
export interface ExtractionStats {
  /** Total signals extracted */
  signalCount: number;
  /** Files processed */
  filesProcessed: number;
  /** Extraction duration in milliseconds */
  durationMs: number;
  /** EventBus global signals */
  eventBusSignals: number;
  /** SignalBus global signals */
  signalBusSignals: number;
  /** Local (component) signals */
  localSignals: number;
}

/**
 * Signal extraction service providing high-level API for parsing GDScript signals.
 * 
 * Current Implementation: Uses Phase 1 regex parser for proven accuracy
 * Future Integration: Architected for tree-sitter AST drop-in replacement
 * 
 * @example
 * ```typescript
 * const extractor = new SignalExtractor();
 * const signals = await extractor.extractSignals('path/to/EventBus.gd');
 * console.log(`Found ${signals.length} signals`);
 * ```
 */
export class SignalExtractor {
  private stats: ExtractionStats = {
    signalCount: 0,
    filesProcessed: 0,
    durationMs: 0,
    eventBusSignals: 0,
    signalBusSignals: 0,
    localSignals: 0,
  };

  /**
   * Extract all signal definitions from a GDScript file.
   * 
   * @param {string} filePath - Absolute or relative path to .gd file
   * @returns {Promise<SignalDefinition[]>} Array of signal definitions with metadata
   * @throws {Error} If file doesn't exist or parsing fails
   * 
   * @example
   * ```typescript
   * const signals = await extractor.extractSignals('autoload/EventBus.gd');
   * signals.forEach(sig => console.log(`${sig.name}: ${sig.params.join(', ')}`));
   * ```
   */
  async extractSignals(filePath: string): Promise<SignalDefinition[]> {
    const startTime = Date.now();

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      // Use WASM parser (async with tree-sitter)
      const signals = await parseGDScriptSignals(filePath);

      // Categorize signals by source
      const fileName = path.basename(filePath, '.gd');
      signals.forEach(sig => {
        if (fileName === 'EventBus' || filePath.includes('autoload/EventBus')) {
          this.stats.eventBusSignals++;
        } else if (fileName === 'SignalBus' || filePath.includes('SignalBus')) {
          this.stats.signalBusSignals++;
        } else {
          this.stats.localSignals++;
        }
      });

      // Validate extracted signals
      signals.forEach(sig => {
        const result = SignalDefinitionSchema.safeParse(sig);
        if (!result.success) {
          console.warn(
            `Validation warning for signal ${sig.name} in ${filePath}:`,
            result.error.issues
          );
        }
      });

      this.stats.signalCount += signals.length;
      this.stats.filesProcessed++;
      this.stats.durationMs = Date.now() - startTime;

      return signals;
    } catch (error) {
      throw new Error(
        `Failed to extract signals from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extract signals from multiple GDScript files in batch.
   * 
   * @param {string[]} filePaths - Array of file paths to process
   * @returns {Promise<SignalDefinition[]>} Aggregated signals from all files
   * 
   * @example
   * ```typescript
   * const files = ['EventBus.gd', 'Player.gd', 'Enemy.gd'];
   * const allSignals = await extractor.extractFromFiles(files);
   * console.log(`Total: ${allSignals.length} signals`);
   * ```
   */
  async extractFromFiles(filePaths: string[]): Promise<SignalDefinition[]> {
    const allSignals: SignalDefinition[] = [];
    const startTime = Date.now();

    for (const filePath of filePaths) {
      try {
        const signals = await this.extractSignals(filePath);
        allSignals.push(...signals);
      } catch (error) {
        console.warn(`Skipping ${filePath}:`, error);
      }
    }

    this.stats.durationMs = Date.now() - startTime;
    return allSignals;
  }

  /**
   * Extract signals from all .gd files in a directory (recursive).
   * 
   * @param {string} directoryPath - Root directory to scan
   * @param {string[]} excludePatterns - Glob patterns to exclude (e.g., ['addons/*', 'test/*'])
   * @returns {Promise<SignalDefinition[]>} All signals found in directory tree
   */
  async extractFromDirectory(
    directoryPath: string,
    excludePatterns: string[] = ['addons/**', 'test/**', '.godot/**']
  ): Promise<SignalDefinition[]> {
    const gdFiles = this.findGDScriptFiles(directoryPath, excludePatterns);
    return this.extractFromFiles(gdFiles);
  }

  /**
   * Get extraction statistics for performance monitoring and diagnostics.
   * 
   * @returns {ExtractionStats} Statistics from last extraction operation
   */
  getStats(): ExtractionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics counters.
   */
  resetStats(): void {
    this.stats = {
      signalCount: 0,
      filesProcessed: 0,
      durationMs: 0,
      eventBusSignals: 0,
      signalBusSignals: 0,
      localSignals: 0,
    };
  }

  /**
   * Extract signal emission sites from AST tree.
   * 
   * NEW in Phase 3: Tree-sitter based emission detection for global graph construction.
   * 
   * Detects patterns:
   * - signal_name.emit()
   * - EventBus.signal_name.emit(args)
   * - self.signal_name.emit()
   * 
   * @param {Tree} tree - Tree-sitter AST from TreeSitterBridge
   * @param {string} filePath - Source file path for context
   * @returns {Promise<EmissionSite[]>} Array of emission sites with context
   * 
   * @example
   * ```typescript
   * const bridge = new TreeSitterBridge();
   * await bridge.init();
   * const tree = await bridge.parseFile('Player.gd');
   * const emissions = await extractor.extractEmissions(tree, 'Player.gd');
   * ```
   */
  async extractEmissions(tree: Tree, filePath: string): Promise<EmissionSite[]> {
    const emissions: EmissionSite[] = [];
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const lines = sourceCode.split('\n');

    try {
      // Traverse AST to find .emit() calls
      const rootNode = tree.rootNode;
      this.findEmitCalls(rootNode, filePath, lines, emissions);

      return emissions;
    } catch (error) {
      console.warn(`Failed to extract emissions from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Recursively find .emit() calls in AST node tree.
   * 
   * @private
   */
  private findEmitCalls(
    node: any,
    filePath: string,
    lines: string[],
    emissions: EmissionSite[]
  ): void {
    // Check if this node is a call_expression with .emit()
    if (node.type === 'call_expression') {
      const functionNode = node.childForFieldName('function');
      
      if (functionNode && functionNode.type === 'attribute') {
        const attribute = functionNode.childForFieldName('attribute');
        
        if (attribute && attribute.text === 'emit') {
          // Found .emit() call - extract signal name
          const objectNode = functionNode.childForFieldName('object');
          
          if (objectNode) {
            const signalName = this.extractSignalName(objectNode);
            const emitter = this.extractEmitter(objectNode);
            const args = this.extractCallArguments(node);
            
            if (signalName) {
              emissions.push({
                signalName,
                filePath,
                line: node.startPosition.row + 1,
                context: this.getNodeContext(node, lines),
                emitter,
                args,
              });
            }
          }
        }
      }
    }

    // Recurse into children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        this.findEmitCalls(child, filePath, lines, emissions);
      }
    }
  }

  /**
   * Extract signal name from emit object node.
   * 
   * Handles patterns:
   * - signal_name.emit() → "signal_name"
   * - EventBus.signal_name.emit() → "signal_name"
   * - self.signal_name.emit() → "signal_name"
   * 
   * @private
   */
  private extractSignalName(objectNode: any): string | null {
    if (objectNode.type === 'identifier') {
      return objectNode.text;
    }

    // Handle chained access (EventBus.signal_name)
    if (objectNode.type === 'attribute') {
      const attribute = objectNode.childForFieldName('attribute');
      if (attribute) {
        return attribute.text;
      }
    }

    return null;
  }

  /**
   * Extract emitter object from emit call.
   * 
   * @private
   */
  private extractEmitter(objectNode: any): string | undefined {
    if (objectNode.type === 'attribute') {
      const obj = objectNode.childForFieldName('object');
      if (obj && obj.type === 'identifier') {
        return obj.text;
      }
    }

    return undefined;
  }

  /**
   * Extract arguments from call expression.
   * 
   * @private
   */
  private extractCallArguments(callNode: any): string[] | undefined {
    const argsNode = callNode.childForFieldName('arguments');
    if (!argsNode) return undefined;

    const args: string[] = [];
    for (let i = 0; i < argsNode.childCount; i++) {
      const child = argsNode.child(i);
      if (child && child.type !== '(' && child.type !== ')' && child.type !== ',') {
        args.push(child.text);
      }
    }

    return args.length > 0 ? args : undefined;
  }

  /**
   * Get source code context around a node (2 lines before/after).
   * 
   * @private
   */
  private getNodeContext(node: any, lines: string[]): string {
    const lineNum = node.startPosition.row;
    const startLine = Math.max(0, lineNum - 2);
    const endLine = Math.min(lines.length - 1, lineNum + 2);

    const contextLines = lines.slice(startLine, endLine + 1);
    return contextLines.join('\n');
  }

  /**
   * Extract signal connection sites from AST tree.
   * 
   * NEW in Phase 3 HOP 3.2b: Connection detection for complete signal graph.
   * 
   * Detects patterns:
   * - signal_name.connect(target, method)
   * - signal_name.connect(method)
   * - signal_name.connect(lambda: code)
   * - signal_name.connect(Callable(target, method))
   * - EventBus.signal_name.connect(...)
   * 
   * @param {Tree} tree - Tree-sitter AST from TreeSitterBridge
   * @param {string} filePath - Source file path for context
   * @returns {Promise<ConnectionSite[]>} Array of connection sites with handlers
   * 
   * @example
   * ```typescript
   * const tree = await bridge.parseFile('Player.gd');
   * const connections = await extractor.extractConnections(tree, 'Player.gd');
   * ```
   */
  async extractConnections(tree: Tree, filePath: string): Promise<import('../graph/types.js').ConnectionSite[]> {
    const connections: import('../graph/types.js').ConnectionSite[] = [];
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const lines = sourceCode.split('\n');

    try {
      // Traverse AST to find .connect() calls
      const rootNode = tree.rootNode;
      this.findConnectCalls(rootNode, filePath, lines, connections);

      return connections;
    } catch (error) {
      console.warn(`Failed to extract connections from ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Recursively find .connect() calls in AST node tree.
   * 
   * @private
   */
  private findConnectCalls(
    node: any,
    filePath: string,
    lines: string[],
    connections: import('../graph/types.js').ConnectionSite[]
  ): void {
    // Check if this node is a call_expression with .connect()
    if (node.type === 'call_expression') {
      const functionNode = node.childForFieldName('function');
      
      if (functionNode && functionNode.type === 'attribute') {
        const attribute = functionNode.childForFieldName('attribute');
        
        if (attribute && attribute.text === 'connect') {
          // Found .connect() call - extract connection details
          const objectNode = functionNode.childForFieldName('object');
          
          if (objectNode) {
            const signalName = this.extractSignalName(objectNode);
            const target = this.extractConnectionTarget(objectNode);
            const connectionInfo = this.extractConnectionHandler(node);
            
            if (signalName && connectionInfo) {
              connections.push({
                signalName,
                filePath,
                line: node.startPosition.row + 1,
                context: this.getNodeContext(node, lines),
                target,
                handler: connectionInfo.handler,
                flags: connectionInfo.flags,
                isLambda: connectionInfo.isLambda,
              });
            }
          }
        }
      }
    }

    // Recurse into children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        this.findConnectCalls(child, filePath, lines, connections);
      }
    }
  }

  /**
   * Extract connection target from signal object.
   * 
   * @private
   */
  private extractConnectionTarget(objectNode: any): string | undefined {
    if (objectNode.type === 'attribute') {
      const obj = objectNode.childForFieldName('object');
      if (obj && obj.type === 'identifier') {
        return obj.text;
      }
    }

    return undefined;
  }

  /**
   * Extract connection handler details from .connect() call.
   * 
   * Handles:
   * - .connect(target, "method_name") → { handler: "method_name", isLambda: false }
   * - .connect(method) → { handler: "method", isLambda: false }
   * - .connect(lambda: ...) → { handler: "<lambda>", isLambda: true }
   * - .connect(Callable(obj, "method")) → { handler: "method", isLambda: false }
   * - .connect(..., flags) → { handler: "...", flags: [flags] }
   * 
   * @private
   */
  private extractConnectionHandler(callNode: any): {
    handler: string;
    flags?: string[];
    isLambda: boolean;
  } | null {
    const argsNode = callNode.childForFieldName('arguments');
    if (!argsNode) return null;

    const args: any[] = [];
    for (let i = 0; i < argsNode.childCount; i++) {
      const child = argsNode.child(i);
      if (child && child.type !== '(' && child.type !== ')' && child.type !== ',') {
        args.push(child);
      }
    }

    if (args.length === 0) return null;

    // Pattern 1: Lambda connection - .connect(lambda: ...)
    const firstArg = args[0];
    if (firstArg.type === 'lambda') {
      return {
        handler: '<lambda>',
        isLambda: true,
        flags: args.length > 1 ? [args[1].text] : undefined,
      };
    }

    // Pattern 2: Callable - .connect(Callable(obj, "method"))
    if (firstArg.type === 'call_expression') {
      const callFunc = firstArg.childForFieldName('function');
      if (callFunc && callFunc.text === 'Callable') {
        const callArgs = firstArg.childForFieldName('arguments');
        if (callArgs) {
          const callArgsList: any[] = [];
          for (let i = 0; i < callArgs.childCount; i++) {
            const child = callArgs.child(i);
            if (child && child.type !== '(' && child.type !== ')' && child.type !== ',') {
              callArgsList.push(child);
            }
          }
          
          if (callArgsList.length >= 2) {
            // Callable(target, "method") - extract method name
            const methodArg = callArgsList[1];
            const methodName = methodArg.text.replace(/['"]/g, '');
            return {
              handler: methodName,
              isLambda: false,
              flags: args.length > 1 ? [args[1].text] : undefined,
            };
          }
        }
      }
    }

    // Pattern 3: Standard connection - .connect(target, "method") or .connect("method")
    if (args.length >= 2) {
      // .connect(target, "method_name")
      const methodArg = args[1];
      const methodName = methodArg.text.replace(/['"]/g, '');
      return {
        handler: methodName,
        isLambda: false,
        flags: args.length > 2 ? args.slice(2).map(a => a.text) : undefined,
      };
    } else if (args.length === 1) {
      // .connect(method_name) or .connect("method_name")
      const handler = firstArg.text.replace(/['"]/g, '');
      return {
        handler,
        isLambda: false,
      };
    }

    return null;
  }

  /**
   * Find all .gd files in a directory tree (helper method).
   * 
   * @private
   */
  private findGDScriptFiles(
    dir: string,
    excludePatterns: string[]
  ): string[] {
    const files: string[] = [];

    function traverse(currentDir: string): void {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(dir, fullPath);

        // Check exclusion patterns
        const excluded = excludePatterns.some(pattern => {
          const regexPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
          return new RegExp(regexPattern).test(relativePath);
        });

        if (excluded) continue;

        if (entry.isDirectory()) {
          traverse(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.gd')) {
          files.push(fullPath);
        }
      }
    }

    traverse(dir);
    return files;
  }
}
