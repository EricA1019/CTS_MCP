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
export declare const SamplingRequestSchema: z.ZodObject<{
    method: z.ZodLiteral<"sampling/createMessage">;
    params: z.ZodObject<{
        messages: z.ZodArray<z.ZodObject<{
            role: z.ZodEnum<["user", "assistant"]>;
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            content: string;
            role: "user" | "assistant";
        }, {
            content: string;
            role: "user" | "assistant";
        }>, "many">;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        temperature: z.ZodOptional<z.ZodNumber>;
        stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        messages: {
            content: string;
            role: "user" | "assistant";
        }[];
        maxTokens?: number | undefined;
        temperature?: number | undefined;
        stopSequences?: string[] | undefined;
    }, {
        messages: {
            content: string;
            role: "user" | "assistant";
        }[];
        maxTokens?: number | undefined;
        temperature?: number | undefined;
        stopSequences?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        messages: {
            content: string;
            role: "user" | "assistant";
        }[];
        maxTokens?: number | undefined;
        temperature?: number | undefined;
        stopSequences?: string[] | undefined;
    };
    method: "sampling/createMessage";
}, {
    params: {
        messages: {
            content: string;
            role: "user" | "assistant";
        }[];
        maxTokens?: number | undefined;
        temperature?: number | undefined;
        stopSequences?: string[] | undefined;
    };
    method: "sampling/createMessage";
}>;
export type SamplingRequest = z.infer<typeof SamplingRequestSchema>;
/**
 * Chunked response for large data
 */
export interface ChunkedResponse<T> {
    chunk: number;
    totalChunks: number;
    data: Partial<T>;
    complete: boolean;
}
/**
 * Sampling state for long-running operations
 */
export interface SamplingState {
    operationId: string;
    startTime: number;
    estimatedDuration?: number;
    progress?: number;
    status: 'running' | 'completed' | 'failed';
    result?: unknown;
    error?: string;
}
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
export declare function checkResponseSize<T>(data: T, maxSize?: number): {
    data: T;
    truncated: boolean;
    originalSize: number;
};
/**
 * Create truncated version of large responses
 * For audit reports, violations, etc.
 */
export declare function truncateLargeArrays<T extends Record<string, unknown>>(data: T, maxArrayLength?: number): T & {
    _truncated?: string[];
};
/**
 * Sampling manager for long-running operations
 */
export declare class SamplingManager {
    private operations;
    /**
     * Start a long-running operation
     */
    startOperation(operationId: string, estimatedDuration?: number): void;
    /**
     * Update operation progress
     */
    updateProgress(operationId: string, progress: number): void;
    /**
     * Complete operation with result
     */
    completeOperation(operationId: string, result: unknown): void;
    /**
     * Fail operation with error
     */
    failOperation(operationId: string, error: string): void;
    /**
     * Get operation state
     */
    getState(operationId: string): SamplingState | undefined;
    /**
     * Clean up completed operations older than TTL
     */
    cleanup(ttlMs?: number): void;
}
/**
 * Global sampling manager instance
 */
export declare const samplingManager: SamplingManager;
//# sourceMappingURL=index.d.ts.map