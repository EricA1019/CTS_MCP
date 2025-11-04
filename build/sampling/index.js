/**
 * MCP Sampling Protocol Implementation
 * Handles long-running operations and large responses via sampling
 *
 * Following MCP Specification:
 * https://spec.modelcontextprotocol.io/specification/server/sampling/
 */
import { z } from 'zod';
/**
 * Sampling request from client
 */
export const SamplingRequestSchema = z.object({
    method: z.literal('sampling/createMessage'),
    params: z.object({
        messages: z.array(z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
        })),
        maxTokens: z.number().optional(),
        temperature: z.number().min(0).max(2).optional(),
        stopSequences: z.array(z.string()).optional(),
    }),
});
/**
 * Chunk large responses to avoid stdio buffer overflow
 *
 * Strategy: For very large responses, return a summary with a flag
 * indicating full data is too large. Client can request specific parts.
 *
 * @param data - Data to check size
 * @param maxSize - Maximum size in bytes before truncating
 * @returns Response with truncation flag if needed
 */
export function checkResponseSize(data, maxSize = 60000) {
    const serialized = JSON.stringify(data);
    const size = serialized.length;
    return {
        data,
        truncated: size > maxSize,
        originalSize: size,
    };
}
/**
 * Create truncated version of large responses
 * For audit reports, violations, etc.
 */
export function truncateLargeArrays(data, maxArrayLength = 10) {
    const result = { ...data };
    const truncatedFields = [];
    for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > maxArrayLength) {
            result[key] = value.slice(0, maxArrayLength);
            truncatedFields.push(`${key} (${value.length} total, showing ${maxArrayLength})`);
        }
    }
    if (truncatedFields.length > 0) {
        result._truncated = truncatedFields;
    }
    return result;
}
/**
 * Sampling manager for long-running operations
 */
export class SamplingManager {
    operations = new Map();
    /**
     * Start a long-running operation
     */
    startOperation(operationId, estimatedDuration) {
        this.operations.set(operationId, {
            operationId,
            startTime: Date.now(),
            estimatedDuration,
            status: 'running',
        });
    }
    /**
     * Update operation progress
     */
    updateProgress(operationId, progress) {
        const state = this.operations.get(operationId);
        if (state) {
            state.progress = Math.min(100, Math.max(0, progress));
        }
    }
    /**
     * Complete operation with result
     */
    completeOperation(operationId, result) {
        const state = this.operations.get(operationId);
        if (state) {
            state.status = 'completed';
            state.result = result;
            state.progress = 100;
        }
    }
    /**
     * Fail operation with error
     */
    failOperation(operationId, error) {
        const state = this.operations.get(operationId);
        if (state) {
            state.status = 'failed';
            state.error = error;
        }
    }
    /**
     * Get operation state
     */
    getState(operationId) {
        return this.operations.get(operationId);
    }
    /**
     * Clean up completed operations older than TTL
     */
    cleanup(ttlMs = 300000) {
        const now = Date.now();
        for (const [id, state] of this.operations) {
            if (state.status !== 'running' && now - state.startTime > ttlMs) {
                this.operations.delete(id);
            }
        }
    }
}
/**
 * Global sampling manager instance
 */
export const samplingManager = new SamplingManager();
//# sourceMappingURL=index.js.map