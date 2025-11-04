/**
 * Rule Worker Thread
 * 
 * Executes individual compliance rules in a worker thread.
 * Communicates via parentPort with structured messages.
 */

import { parentPort, workerData } from 'worker_threads';
import type { ComplianceRule, AuditContext, ComplianceResult } from '../tools/audit/checkers.js';

interface WorkerMessage {
  type: 'result' | 'error' | 'progress';
  ruleId: string;
  result?: ComplianceResult;
  error?: string;
  progress?: number; // 0-100 percentage
}

interface WorkerData {
  ruleId: string;
  ruleName: string;
  ruleCategory: string;
  context: AuditContext;
}

/**
 * Execute rule and send result via parentPort
 */
async function executeRule(): Promise<void> {
  if (!parentPort) {
    throw new Error('Worker must be run as a worker thread');
  }

  try {
    const data = workerData as WorkerData;
    const { ruleId, context } = data;

    // Dynamically import rule (avoid circular dependencies)
    const { ALL_RULES } = await import('../tools/audit/checkers.js');
    const rule = ALL_RULES.find((r) => r.id === ruleId);

    if (!rule) {
      const errorMsg: WorkerMessage = {
        type: 'error',
        ruleId,
        error: `Rule not found: ${ruleId}`,
      };
      parentPort.postMessage(errorMsg);
      return;
    }

    // Send progress update (starting)
    const progressMsg: WorkerMessage = {
      type: 'progress',
      ruleId,
      progress: 0,
    };
    parentPort.postMessage(progressMsg);

    // Execute rule check
    const result = await rule.check(context);

    // Send progress update (complete)
    const completeProgress: WorkerMessage = {
      type: 'progress',
      ruleId,
      progress: 100,
    };
    parentPort.postMessage(completeProgress);

    // Send result
    const resultMsg: WorkerMessage = {
      type: 'result',
      ruleId,
      result,
    };
    parentPort.postMessage(resultMsg);
  } catch (error) {
    const errorMsg: WorkerMessage = {
      type: 'error',
      ruleId: (workerData as WorkerData).ruleId,
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
