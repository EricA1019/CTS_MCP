/**
 * Rule Worker Thread
 *
 * Executes individual compliance rules in a worker thread.
 * Communicates via parentPort with structured messages.
 */
import { parentPort, workerData } from 'worker_threads';
/**
 * Execute rule and send result via parentPort
 */
async function executeRule() {
    if (!parentPort) {
        throw new Error('Worker must be run as a worker thread');
    }
    try {
        const data = workerData;
        const { ruleId, context } = data;
        // Dynamically import rule (avoid circular dependencies)
        const { ALL_RULES } = await import('../tools/audit/checkers.js');
        const rule = ALL_RULES.find((r) => r.id === ruleId);
        if (!rule) {
            const errorMsg = {
                type: 'error',
                ruleId,
                error: `Rule not found: ${ruleId}`,
            };
            parentPort.postMessage(errorMsg);
            return;
        }
        // Send progress update (starting)
        const progressMsg = {
            type: 'progress',
            ruleId,
            progress: 0,
        };
        parentPort.postMessage(progressMsg);
        // Execute rule check
        const result = await rule.check(context);
        // Send progress update (complete)
        const completeProgress = {
            type: 'progress',
            ruleId,
            progress: 100,
        };
        parentPort.postMessage(completeProgress);
        // Send result
        const resultMsg = {
            type: 'result',
            ruleId,
            result,
        };
        parentPort.postMessage(resultMsg);
    }
    catch (error) {
        const errorMsg = {
            type: 'error',
            ruleId: workerData.ruleId,
            error: error instanceof Error ? error.message : String(error),
        };
        parentPort?.postMessage(errorMsg);
    }
}
// Execute immediately when worker starts
executeRule().catch((error) => {
    console.error('Worker fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=rule_worker.js.map