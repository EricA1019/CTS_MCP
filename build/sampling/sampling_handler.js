/**
 * MCP Sampling Protocol Implementation
 *
 * Enables servers to request LLM completions from clients,
 * allowing agentic behaviors within CTS tools.
 *
 * @see https://modelcontextprotocol.io/specification/2024-11-05/client/sampling
 */
import { z } from 'zod';
import { Errors } from '../errors.js';
/**
 * Message content types
 */
const TextContentSchema = z.object({
    type: z.literal('text'),
    text: z.string(),
});
const ImageContentSchema = z.object({
    type: z.literal('image'),
    data: z.string(), // base64 encoded
    mimeType: z.string(),
});
const ContentSchema = z.union([TextContentSchema, ImageContentSchema]);
/**
 * Message schema
 */
const MessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: ContentSchema,
});
/**
 * Model preferences schema
 */
const ModelPreferencesSchema = z.object({
    hints: z.array(z.object({ name: z.string() })).optional(),
    costPriority: z.number().min(0).max(1).optional(),
    speedPriority: z.number().min(0).max(1).optional(),
    intelligencePriority: z.number().min(0).max(1).optional(),
});
/**
 * sampling/createMessage request params
 */
export const CreateMessageParamsSchema = z.object({
    messages: z.array(MessageSchema),
    modelPreferences: ModelPreferencesSchema.optional(),
    systemPrompt: z.string().optional(),
    maxTokens: z.number().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    stopSequences: z.array(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
});
/**
 * Context injection utilities
 * Add project-specific context to sampling requests
 */
export class ContextInjector {
    /**
     * Inject project file contents into messages
     */
    static injectFileContext(messages, filePath, content) {
        const contextMessage = {
            role: 'user',
            content: {
                type: 'text',
                text: `File: ${filePath}\n\`\`\`gdscript\n${content}\n\`\`\``,
            },
        };
        return [contextMessage, ...messages];
    }
    /**
     * Inject signal map context
     */
    static injectSignalContext(messages, signals) {
        const signalList = signals.map(s => `- ${s.name}: ${s.description || 'No description'}`).join('\n');
        const contextMessage = {
            role: 'user',
            content: {
                type: 'text',
                text: `Project Signals:\n${signalList}`,
            },
        };
        return [contextMessage, ...messages];
    }
    /**
     * Inject audit results context
     */
    static injectAuditContext(messages, violations) {
        const violationList = violations
            .slice(0, 10) // Limit to top 10
            .map(v => `- ${v.rule}: ${v.message} (${v.file}:${v.line})`)
            .join('\n');
        const contextMessage = {
            role: 'user',
            content: {
                type: 'text',
                text: `CTS Audit Violations:\n${violationList}`,
            },
        };
        return [contextMessage, ...messages];
    }
    /**
     * Inject project metrics context
     */
    static injectMetricsContext(messages, metrics) {
        const metricsText = `Project Metrics:
- Total Files: ${metrics.totalFiles || 0}
- Total Lines: ${metrics.totalLines || 0}
- Total Functions: ${metrics.totalFunctions || 0}
- Signal Usage: ${metrics.signalUsage || 0}%
- Test Coverage: ${metrics.testCoverage || 0}%`;
        const contextMessage = {
            role: 'user',
            content: {
                type: 'text',
                text: metricsText,
            },
        };
        return [contextMessage, ...messages];
    }
}
/**
 * Create sampling/createMessage handler
 *
 * Note: This is a SERVER-SIDE handler that formats requests.
 * The actual LLM call is made by the CLIENT.
 */
export function createSamplingHandler() {
    return async (params) => {
        // Validate params
        const validationResult = CreateMessageParamsSchema.safeParse(params);
        if (!validationResult.success) {
            throw Errors.validationError('params', 'CreateMessageParams', validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
        }
        const validParams = validationResult.data;
        // NOTE: In actual MCP implementation, this would be sent to the client
        // The client would then make the LLM call and return the result
        // For now, we return a mock response since we're server-side only
        throw Errors.methodNotFound('sampling/createMessage is a client capability - servers send requests, clients execute them');
    };
}
/**
 * Helper to build sampling requests with context
 */
export class SamplingRequestBuilder {
    messages = [];
    systemPrompt;
    modelPreferences;
    maxTokens;
    temperature;
    /**
     * Add a user message
     */
    addUserMessage(text) {
        this.messages.push({
            role: 'user',
            content: { type: 'text', text },
        });
        return this;
    }
    /**
     * Add an assistant message
     */
    addAssistantMessage(text) {
        this.messages.push({
            role: 'assistant',
            content: { type: 'text', text },
        });
        return this;
    }
    /**
     * Set system prompt
     */
    setSystemPrompt(prompt) {
        this.systemPrompt = prompt;
        return this;
    }
    /**
     * Set model preferences
     */
    setModelPreferences(prefs) {
        this.modelPreferences = {
            ...prefs,
            hints: prefs.hints?.map(name => ({ name })),
        };
        return this;
    }
    /**
     * Set max tokens
     */
    setMaxTokens(tokens) {
        this.maxTokens = tokens;
        return this;
    }
    /**
     * Set temperature
     */
    setTemperature(temp) {
        this.temperature = temp;
        return this;
    }
    /**
     * Inject file context
     */
    withFileContext(filePath, content) {
        this.messages = ContextInjector.injectFileContext(this.messages, filePath, content);
        return this;
    }
    /**
     * Inject signal context
     */
    withSignalContext(signals) {
        this.messages = ContextInjector.injectSignalContext(this.messages, signals);
        return this;
    }
    /**
     * Inject audit context
     */
    withAuditContext(violations) {
        this.messages = ContextInjector.injectAuditContext(this.messages, violations);
        return this;
    }
    /**
     * Inject metrics context
     */
    withMetricsContext(metrics) {
        this.messages = ContextInjector.injectMetricsContext(this.messages, metrics);
        return this;
    }
    /**
     * Build the sampling request
     */
    build() {
        if (this.messages.length === 0) {
            throw new Error('At least one message is required');
        }
        return {
            messages: this.messages,
            systemPrompt: this.systemPrompt,
            modelPreferences: this.modelPreferences,
            maxTokens: this.maxTokens,
            temperature: this.temperature,
        };
    }
}
/**
 * Predefined sampling templates for common use cases
 */
export const SamplingTemplates = {
    /**
     * Request refactoring suggestions based on audit results
     */
    refactoringSuggestions(violations) {
        return new SamplingRequestBuilder()
            .setSystemPrompt('You are a GDScript expert helping improve code quality.')
            .withAuditContext(violations)
            .addUserMessage('Based on these CTS violations, suggest specific refactorings to improve code quality. Provide code examples.')
            .setModelPreferences({
            hints: ['claude-3-sonnet', 'gpt-4'],
            intelligencePriority: 0.8,
            speedPriority: 0.5,
        })
            .setMaxTokens(1000)
            .build();
    },
    /**
     * Request signal naming improvements
     */
    signalNaming(signals) {
        return new SamplingRequestBuilder()
            .setSystemPrompt('You are a GDScript expert specializing in event-driven architecture.')
            .withSignalContext(signals)
            .addUserMessage('Review these signal names and suggest improvements for clarity and consistency. Follow GDScript naming conventions.')
            .setModelPreferences({
            hints: ['claude-3-sonnet'],
            intelligencePriority: 0.7,
        })
            .setMaxTokens(800)
            .build();
    },
    /**
     * Request code explanation
     */
    codeExplanation(filePath, content) {
        return new SamplingRequestBuilder()
            .setSystemPrompt('You are a helpful coding assistant.')
            .withFileContext(filePath, content)
            .addUserMessage('Explain what this code does, highlighting any potential issues or improvements.')
            .setModelPreferences({
            speedPriority: 0.7,
            costPriority: 0.5,
        })
            .setMaxTokens(500)
            .build();
    },
};
//# sourceMappingURL=sampling_handler.js.map