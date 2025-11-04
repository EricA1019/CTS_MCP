/**
 * Parallel Rule Executor
 *
 * Executes compliance rules in parallel using worker threads.
 * Features:
 * - Worker pool with max 4 workers
 * - Automatic rule distribution across workers
 * - Progress reporting (X/Y rules complete)
 * - Graceful crash recovery
 * - 3x+ speedup for 10+ rules
 */
import { Worker } from 'worker_threads';
import { join } from 'path';
/**
 * Execute rules in parallel using worker threads
 *
 * @param rules - Array of compliance rules to execute
 * @param context - Audit context (project path, files, config)
 * @param maxWorkers - Maximum concurrent workers (default: 4)
 * @param onProgress - Optional progress callback
 * @returns Array of rule results
 */
export async function executeRulesParallel(rules, context, maxWorkers = 4, onProgress) {
    // Small projects: don't use workers (overhead not worth it)
    if (rules.length < 3) {
        return executeSequential(rules, context, onProgress);
    }
    const results = new Map();
    const errors = new Map();
    let completedCount = 0;
    // Create worker pool
    const workerPool = [];
    const activeWorkers = new Set();
    const ruleQueue = [...rules]; // Copy rules for processing
    return new Promise((resolve, reject) => {
        /**
         * Process next rule in queue with an available worker
         */
        function processNextRule() {
            if (ruleQueue.length === 0 && activeWorkers.size === 0) {
                // All rules processed and all workers finished
                cleanup();
                // Convert results to RuleResult array
                const ruleResults = rules.map((rule) => {
                    const execResult = results.get(rule.id);
                    if (execResult?.result) {
                        return { ...execResult.result, rule };
                    }
                    else {
                        // Rule failed or crashed - return empty result
                        return {
                            passed: false,
                            violations: [{
                                    file: '',
                                    line: 0,
                                    severity: 'error',
                                    message: errors.get(rule.id) || 'Worker crashed or failed',
                                }],
                            score: 0,
                            rule,
                        };
                    }
                });
                resolve(ruleResults);
                return;
            }
            if (ruleQueue.length === 0) {
                // No more rules to process, but workers still active
                return;
            }
            const rule = ruleQueue.shift();
            const worker = createWorker(rule);
            activeWorkers.add(worker);
        }
        /**
         * Create worker for a specific rule
         */
        function createWorker(rule) {
            // Worker path resolution:
            // In CommonJS: __dirname is available
            // In ESM: use './rule_worker.js' relative import
            // The Worker constructor will resolve the path correctly
            const workerPath = join(__dirname, 'rule_worker.js');
            const worker = new Worker(workerPath, {
                workerData: {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    ruleCategory: rule.category,
                    context,
                },
            });
            workerPool.push(worker);
            worker.on('message', (msg) => {
                if (msg.type === 'result') {
                    // Store result
                    results.set(msg.ruleId, {
                        ruleId: msg.ruleId,
                        result: msg.result,
                        rule,
                    });
                    completedCount++;
                    if (onProgress) {
                        onProgress(completedCount, rules.length, msg.ruleId);
                    }
                    // Worker finished - remove from active set and process next
                    activeWorkers.delete(worker);
                    worker.terminate();
                    processNextRule();
                }
                else if (msg.type === 'error') {
                    // Store error
                    errors.set(msg.ruleId, msg.error || 'Unknown error');
                    completedCount++;
                    if (onProgress) {
                        onProgress(completedCount, rules.length, msg.ruleId);
                    }
                    // Worker errored - remove from active set and process next
                    activeWorkers.delete(worker);
                    worker.terminate();
                    processNextRule();
                }
                else if (msg.type === 'progress') {
                    // Progress update (currently not used for anything)
                    // Could be used for more granular progress tracking
                }
            });
            worker.on('error', (error) => {
                console.error(`Worker error for rule ${rule.id}:`, error);
                errors.set(rule.id, error.message);
                completedCount++;
                if (onProgress) {
                    onProgress(completedCount, rules.length, rule.id);
                }
                // Worker crashed - remove from active set and process next
                activeWorkers.delete(worker);
                worker.terminate();
                processNextRule();
            });
            worker.on('exit', (code) => {
                if (code !== 0 && !results.has(rule.id) && !errors.has(rule.id)) {
                    console.error(`Worker for rule ${rule.id} exited with code ${code}`);
                    errors.set(rule.id, `Worker exited with code ${code}`);
                    completedCount++;
                    if (onProgress) {
                        onProgress(completedCount, rules.length, rule.id);
                    }
                    // Worker crashed on exit - remove from active set
                    activeWorkers.delete(worker);
                    processNextRule();
                }
            });
            return worker;
        }
        /**
         * Cleanup all workers
         */
        function cleanup() {
            for (const worker of workerPool) {
                worker.terminate();
            }
            workerPool.length = 0;
            activeWorkers.clear();
        }
        // Start initial batch of workers (up to maxWorkers)
        const initialBatch = Math.min(maxWorkers, rules.length);
        for (let i = 0; i < initialBatch; i++) {
            processNextRule();
        }
    });
}
/**
 * Execute rules sequentially (fallback for small projects)
 */
async function executeSequential(rules, context, onProgress) {
    const results = [];
    let completed = 0;
    for (const rule of rules) {
        try {
            const result = await rule.check(context);
            results.push({ ...result, rule });
            completed++;
            if (onProgress) {
                onProgress(completed, rules.length, rule.id);
            }
        }
        catch (error) {
            // Handle rule execution error
            results.push({
                passed: false,
                violations: [{
                        file: '',
                        line: 0,
                        severity: 'error',
                        message: error instanceof Error ? error.message : String(error),
                    }],
                score: 0,
                rule,
            });
            completed++;
            if (onProgress) {
                onProgress(completed, rules.length, rule.id);
            }
        }
    }
    return results;
}
/**
 * Determine if parallel execution should be used
 *
 * Heuristics:
 * - Less than 3 rules: Sequential (overhead not worth it)
 * - Less than 20 files: Sequential (small project)
 * - Otherwise: Parallel
 */
export function shouldUseParallel(ruleCount, fileCount) {
    if (ruleCount < 3)
        return false;
    if (fileCount < 20)
        return false;
    return true;
}
//# sourceMappingURL=rule_executor.js.map