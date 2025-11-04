/**
 * Parse Worker Thread
 *
 * Worker thread entry point for parallel AST parsing.
 * Receives file paths via workerData and returns parsed AST trees.
 *
 * Architecture:
 * - Main thread: ProjectScanner orchestrates workers
 * - Worker threads: This file, parses chunk of files independently
 * - Communication: parentPort messaging (structured clone)
 *
 * @module scanner/parse_worker
 */
import { parentPort, workerData } from 'worker_threads';
import { TreeSitterBridge } from '../parsers/tree_sitter_bridge.js';
import { statSync } from 'fs';
/**
 * Worker thread main function.
 *
 * Parses all files in workerData.files and sends results via parentPort.
 */
async function main() {
    if (!parentPort) {
        console.error('parse_worker.ts must be run as a Worker thread');
        process.exit(1);
    }
    const payload = workerData;
    const { files, workerId } = payload;
    const trees = [];
    const errors = [];
    // Initialize tree-sitter bridge
    const bridge = new TreeSitterBridge();
    try {
        await bridge.init();
    }
    catch (error) {
        parentPort.postMessage({
            trees: [],
            workerId,
            errors: [{
                    filePath: '<init>',
                    error: `Failed to initialize tree-sitter: ${error instanceof Error ? error.message : String(error)}`,
                }],
        });
        return;
    }
    // Parse each file in chunk
    for (const filePath of files) {
        try {
            const startTime = Date.now();
            const tree = await bridge.parseFile(filePath);
            const parseDuration = Date.now() - startTime;
            // Get file metadata
            const stats = statSync(filePath);
            trees.push({
                tree,
                filePath,
                sizeBytes: stats.size,
                parseDurationMs: parseDuration,
                mtime: Math.floor(stats.mtimeMs),
            });
        }
        catch (error) {
            // Non-fatal error - collect and continue
            errors.push({
                filePath,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    // Send results back to main thread
    const result = {
        trees,
        workerId,
        errors,
    };
    parentPort.postMessage(result);
}
// Run worker
main().catch((error) => {
    if (parentPort) {
        parentPort.postMessage({
            trees: [],
            workerId: workerData?.workerId ?? -1,
            errors: [{
                    filePath: '<worker>',
                    error: `Worker crashed: ${error instanceof Error ? error.message : String(error)}`,
                }],
        });
    }
    process.exit(1);
});
//# sourceMappingURL=parse_worker.js.map