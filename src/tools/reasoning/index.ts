/**
 * CTS Reasoning Tool - MCP Integration
 * 
 * Template-driven reasoning with state management and convergence detection.
 * Supports flexible thinking processes with stage-based progression.
 */

import { z } from 'zod';
import { ToolDefinition, ToolHandler } from '../../types.js';
import { validateToolResponse, ReasoningResponseSchema } from '../../schemas.js';
import { Errors } from '../../errors.js';
import { ReasoningEngine, ReasoningContext } from './core.js';
import { getAvailableStages, renderPrompt } from './prompts.js';

/**
 * Zod schema for reasoning tool parameters
 */
const ReasoningParamsSchema = z.object({
  topic: z.string().min(5).describe('The topic or problem to reason about (minimum 5 characters)'),
  maxIterations: z.number().min(1).max(50).default(10).describe('Maximum number of reasoning iterations (1-50)'),
  initialStage: z.string().default('Problem Definition').describe('Initial reasoning stage to start with'),
  context: z.string().optional().describe('Additional context or background information'),
  previousThoughts: z.array(z.string()).optional().describe('Previous thoughts to build upon'),
  stageSequence: z.array(z.string()).optional().describe('Custom sequence of reasoning stages (uses default if not provided)'),
});

/**
 * Tool definition for MCP protocol
 */
export const reasoningTool: ToolDefinition = {
  name: 'CTS_Reasoning',
  description: 'Template-driven reasoning engine with state management and convergence detection. Supports flexible thinking processes through 6 reasoning stages: Problem Definition, Information Gathering, Analysis, Synthesis, Conclusion, Critical Questioning.',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The topic or problem to reason about (minimum 5 characters)',
      },
      maxIterations: {
        type: 'number',
        description: 'Maximum number of reasoning iterations (1-50)',
        default: 10,
        minimum: 1,
        maximum: 50,
      },
      initialStage: {
        type: 'string',
        description: 'Initial reasoning stage to start with',
        default: 'Problem Definition',
        enum: getAvailableStages(),
      },
      context: {
        type: 'string',
        description: 'Additional context or background information',
      },
      previousThoughts: {
        type: 'array',
        description: 'Previous thoughts to build upon',
        items: { type: 'string' },
      },
      stageSequence: {
        type: 'array',
        description: 'Custom sequence of reasoning stages (uses default if not provided)',
        items: {
          type: 'string',
          enum: getAvailableStages(),
        },
      },
    },
    required: ['topic'],
  },
};

/**
 * Default stage sequence for reasoning process
 */
const DEFAULT_STAGE_SEQUENCE = [
  'Problem Definition',
  'Information Gathering',
  'Analysis',
  'Synthesis',
  'Conclusion',
  'Critical Questioning',
];

/**
 * Create tool handler for reasoning
 */
export function createReasoningHandler(): ToolHandler {
  return async (args: Record<string, unknown>) => {
    const startTime = Date.now();
    
    try {
      // Validate input parameters
      const params = ReasoningParamsSchema.parse(args);
      
      console.error(`[CTS Reasoning] Starting reasoning on topic: "${params.topic}"`);
      console.error(`[CTS Reasoning] Max iterations: ${params.maxIterations}, Initial stage: ${params.initialStage}`);
      
      // Initialize reasoning engine
      const engine = new ReasoningEngine(params.maxIterations);
      
      // Build context for reasoning
      const context: ReasoningContext = {
        topic: params.topic,
        context: params.context,
        previous_thoughts: params.previousThoughts,
      };
      
      // Determine stage sequence
      const stageSequence = params.stageSequence || DEFAULT_STAGE_SEQUENCE;
      console.error(`[CTS Reasoning] Using stage sequence: ${stageSequence.join(' → ')}`);
      
      // Execute reasoning iterations
      const reasoningChain: Array<{
        iteration: number;
        stage: string;
        thought: string;
        assumptions_challenged: string[];
        axioms_used: string[];
        tags: string[];
        next_thought_needed: boolean;
        prompt_used: string | null;
      }> = [];
      
      let currentStageIndex = stageSequence.indexOf(params.initialStage);
      if (currentStageIndex === -1) {
        currentStageIndex = 0; // Fallback to first stage
      }
      
      while (!engine.converged() && reasoningChain.length < params.maxIterations) {
        const stage = stageSequence[currentStageIndex % stageSequence.length];
        
        console.error(`[CTS Reasoning] Iteration ${reasoningChain.length + 1}: ${stage}`);
        
        // Get prompt for current stage
        const prompt = renderPrompt(stage, context);
        
        // Execute reasoning iteration
        const state = await engine.iterate(stage, context);
        
        // Record iteration result
        reasoningChain.push({
          iteration: state.thought_number,
          stage: state.stage,
          thought: state.thought,
          assumptions_challenged: state.assumptions_challenged,
          axioms_used: state.axioms_used,
          tags: state.tags,
          next_thought_needed: state.next_thought_needed,
          prompt_used: prompt,
        });
        
        // Update context with new thought
        if (!context.previous_thoughts) {
          context.previous_thoughts = [];
        }
        context.previous_thoughts.push(state.thought);
        
        // Advance to next stage if not converged
        if (state.next_thought_needed) {
          currentStageIndex++;
        } else {
          console.error('[CTS Reasoning] Early convergence detected');
          break;
        }
      }
      
      const finalState = engine.getState();
      
      console.error(`[CTS Reasoning] Completed ${reasoningChain.length} iterations`);
      console.error(`[CTS Reasoning] Converged: ${engine.converged()}`);
      
      const totalDuration = Date.now() - startTime;
      
      // Format response using BaseToolResponse pattern
      const response = {
        success: true as const,
        timestamp: new Date().toISOString(),
        toolName: 'CTS_Reasoning' as const,
        duration_ms: totalDuration,
        result: {
          reasoning_chain: reasoningChain,
          summary: {
            topic: params.topic,
            total_iterations: reasoningChain.length,
            converged: engine.converged(),
            final_stage: finalState.stage,
            total_assumptions_challenged: finalState.assumptions_challenged.length,
            total_axioms_used: finalState.axioms_used.length,
            unique_tags: Array.from(new Set(finalState.tags)),
          },
          final_state: finalState,
        },
      };
      
      // Validate response format
      const validation = validateToolResponse('CTS_Reasoning', response);
      if (!validation.valid) {
        throw Errors.validationError(
          'response',
          'ReasoningResponse',
          validation.errors?.errors[0]?.message || 'Unknown validation error'
        );
      }
      
      return response;
      
    } catch (error) {
      console.error('[CTS Reasoning] Error during reasoning:', error);
      
      // Throw enhanced error
      if (error instanceof z.ZodError) {
        throw Errors.validationError(
          'parameters',
          'ReasoningParamsSchema',
          error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
      }
      throw error;
    }
  };
}