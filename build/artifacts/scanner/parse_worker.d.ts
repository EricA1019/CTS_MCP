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
export {};
//# sourceMappingURL=parse_worker.d.ts.map