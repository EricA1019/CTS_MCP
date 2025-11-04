/**
 * MCP Sampling Protocol Implementation
 *
 * Enables servers to request LLM completions from clients,
 * allowing agentic behaviors within CTS tools.
 *
 * @see https://modelcontextprotocol.io/specification/2024-11-05/client/sampling
 */
import { z } from 'zod';
/**
 * sampling/createMessage request params
 */
export declare const CreateMessageParamsSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodUnion<[z.ZodObject<{
            type: z.ZodLiteral<"text">;
            text: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            text: string;
            type: "text";
        }, {
            text: string;
            type: "text";
        }>, z.ZodObject<{
            type: z.ZodLiteral<"image">;
            data: z.ZodString;
            mimeType: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "image";
            data: string;
            mimeType: string;
        }, {
            type: "image";
            data: string;
            mimeType: string;
        }>]>;
    }, "strip", z.ZodTypeAny, {
        content: {
            text: string;
            type: "text";
        } | {
            type: "image";
            data: string;
            mimeType: string;
        };
        role: "user" | "assistant";
    }, {
        content: {
            text: string;
            type: "text";
        } | {
            type: "image";
            data: string;
            mimeType: string;
        };
        role: "user" | "assistant";
    }>, "many">;
    modelPreferences: z.ZodOptional<z.ZodObject<{
        hints: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
        }, {
            name: string;
        }>, "many">>;
        costPriority: z.ZodOptional<z.ZodNumber>;
        speedPriority: z.ZodOptional<z.ZodNumber>;
        intelligencePriority: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        hints?: {
            name: string;
        }[] | undefined;
        costPriority?: number | undefined;
        speedPriority?: number | undefined;
        intelligencePriority?: number | undefined;
    }, {
        hints?: {
            name: string;
        }[] | undefined;
        costPriority?: number | undefined;
        speedPriority?: number | undefined;
        intelligencePriority?: number | undefined;
    }>>;
    systemPrompt: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    messages: {
        content: {
            text: string;
            type: "text";
        } | {
            type: "image";
            data: string;
            mimeType: string;
        };
        role: "user" | "assistant";
    }[];
    metadata?: Record<string, unknown> | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    stopSequences?: string[] | undefined;
    modelPreferences?: {
        hints?: {
            name: string;
        }[] | undefined;
        costPriority?: number | undefined;
        speedPriority?: number | undefined;
        intelligencePriority?: number | undefined;
    } | undefined;
    systemPrompt?: string | undefined;
}, {
    messages: {
        content: {
            text: string;
            type: "text";
        } | {
            type: "image";
            data: string;
            mimeType: string;
        };
        role: "user" | "assistant";
    }[];
    metadata?: Record<string, unknown> | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    stopSequences?: string[] | undefined;
    modelPreferences?: {
        hints?: {
            name: string;
        }[] | undefined;
        costPriority?: number | undefined;
        speedPriority?: number | undefined;
        intelligencePriority?: number | undefined;
    } | undefined;
    systemPrompt?: string | undefined;
}>;
export type CreateMessageParams = z.infer<typeof CreateMessageParamsSchema>;
/**
 * sampling/createMessage response
 */
export interface CreateMessageResult {
    role: 'assistant';
    content: {
        type: 'text';
        text: string;
    };
    model: string;
    stopReason?: 'endTurn' | 'stopSequence' | 'maxTokens';
}
/**
 * Context injection utilities
 * Add project-specific context to sampling requests
 */
export declare class ContextInjector {
    /**
     * Inject project file contents into messages
     */
    static injectFileContext(messages: any[], filePath: string, content: string): any[];
    /**
     * Inject signal map context
     */
    static injectSignalContext(messages: any[], signals: any[]): any[];
    /**
     * Inject audit results context
     */
    static injectAuditContext(messages: any[], violations: any[]): any[];
    /**
     * Inject project metrics context
     */
    static injectMetricsContext(messages: any[], metrics: any): any[];
}
/**
 * Create sampling/createMessage handler
 *
 * Note: This is a SERVER-SIDE handler that formats requests.
 * The actual LLM call is made by the CLIENT.
 */
export declare function createSamplingHandler(): (params: unknown) => Promise<CreateMessageResult>;
/**
 * Helper to build sampling requests with context
 */
export declare class SamplingRequestBuilder {
    private messages;
    private systemPrompt?;
    private modelPreferences?;
    private maxTokens?;
    private temperature?;
    /**
     * Add a user message
     */
    addUserMessage(text: string): this;
    /**
     * Add an assistant message
     */
    addAssistantMessage(text: string): this;
    /**
     * Set system prompt
     */
    setSystemPrompt(prompt: string): this;
    /**
     * Set model preferences
     */
    setModelPreferences(prefs: {
        hints?: string[];
        costPriority?: number;
        speedPriority?: number;
        intelligencePriority?: number;
    }): this;
    /**
     * Set max tokens
     */
    setMaxTokens(tokens: number): this;
    /**
     * Set temperature
     */
    setTemperature(temp: number): this;
    /**
     * Inject file context
     */
    withFileContext(filePath: string, content: string): this;
    /**
     * Inject signal context
     */
    withSignalContext(signals: any[]): this;
    /**
     * Inject audit context
     */
    withAuditContext(violations: any[]): this;
    /**
     * Inject metrics context
     */
    withMetricsContext(metrics: any): this;
    /**
     * Build the sampling request
     */
    build(): CreateMessageParams;
}
/**
 * Predefined sampling templates for common use cases
 */
export declare const SamplingTemplates: {
    /**
     * Request refactoring suggestions based on audit results
     */
    refactoringSuggestions(violations: any[]): CreateMessageParams;
    /**
     * Request signal naming improvements
     */
    signalNaming(signals: any[]): CreateMessageParams;
    /**
     * Request code explanation
     */
    codeExplanation(filePath: string, content: string): CreateMessageParams;
};
//# sourceMappingURL=sampling_handler.d.ts.map