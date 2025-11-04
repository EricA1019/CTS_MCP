/**
 * Reasoning Tool Integration Tests
 * 
 * Tests MCP tool wrapper, validation, error handling, and end-to-end reasoning flow.
 */

import { describe, it, expect } from '@jest/globals';
import { reasoningTool, createReasoningHandler } from '../index';
import { getAvailableStages } from '../prompts';

describe('Reasoning Tool MCP Integration', () => {
  describe('Tool Definition', () => {
    it('should have correct tool name', () => {
      expect(reasoningTool.name).toBe('CTS_Reasoning');
    });

    it('should have comprehensive description', () => {
      expect(reasoningTool.description).toContain('Template-driven');
      expect(reasoningTool.description).toContain('state management');
      expect(reasoningTool.description).toContain('convergence');
    });

    it('should have proper input schema', () => {
      expect(reasoningTool.inputSchema.type).toBe('object');
      expect(reasoningTool.inputSchema.properties).toHaveProperty('topic');
      expect(reasoningTool.inputSchema.properties).toHaveProperty('maxIterations');
      expect(reasoningTool.inputSchema.required).toContain('topic');
    });

    it('should include all available stages in enum', () => {
      const stageEnum = (reasoningTool.inputSchema.properties.initialStage as any).enum;
      const availableStages = getAvailableStages();
      expect(stageEnum).toEqual(availableStages);
    });
  });

  describe('Handler Creation', () => {
    it('should create valid handler function', () => {
      const handler = createReasoningHandler();
      expect(typeof handler).toBe('function');
      expect(handler.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Parameter Validation', () => {
    let handler: ReturnType<typeof createReasoningHandler>;

    beforeEach(() => {
      handler = createReasoningHandler();
    });

    it('should accept valid minimal parameters', async () => {
      const result = await handler({
        topic: 'Test reasoning problem',
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('reasoning_chain');
      expect(result).toHaveProperty('summary');
    });

    it('should reject topic shorter than 5 characters', async () => {
      const result = await handler({
        topic: 'Test',
      }) as any;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(-32602); // Invalid params
      expect(result.error.data.validationErrors).toBeDefined();
    });

    it('should accept all optional parameters', async () => {
      const result = await handler({
        topic: 'Complex reasoning task',
        maxIterations: 5,
        initialStage: 'Analysis',
        context: 'This is background context',
        previousThoughts: ['Previous thought 1', 'Previous thought 2'],
        stageSequence: ['Problem Definition', 'Analysis', 'Conclusion'],
      });

      expect(result).toHaveProperty('success', true);
    });

    it('should enforce maxIterations bounds (1-50)', async () => {
      const resultTooLow = await handler({
        topic: 'Test problem',
        maxIterations: 0,
      }) as any;

      expect(resultTooLow.success).toBe(false);
      expect(resultTooLow.error.code).toBe(-32602);

      const resultTooHigh = await handler({
        topic: 'Test problem',
        maxIterations: 51,
      }) as any;

      expect(resultTooHigh.success).toBe(false);
      expect(resultTooHigh.error.code).toBe(-32602);
    });
  });

  describe('Reasoning Execution', () => {
    let handler: ReturnType<typeof createReasoningHandler>;

    beforeEach(() => {
      handler = createReasoningHandler();
    });

    it('should execute full reasoning cycle', async () => {
      const result = await handler({
        topic: 'How to optimize performance',
        maxIterations: 6,
      }) as any;

      expect(result.success).toBe(true);
      expect(result.reasoning_chain).toBeDefined();
      expect(result.reasoning_chain.length).toBeGreaterThan(0);
      expect(result.summary.topic).toBe('How to optimize performance');
    });

    it('should include prompt in each iteration', async () => {
      const result = await handler({
        topic: 'Test with prompts',
        maxIterations: 3,
      }) as any;

      expect(result.success).toBe(true);
      result.reasoning_chain.forEach((iteration: any) => {
        expect(iteration).toHaveProperty('prompt_used');
        expect(iteration.prompt_used).not.toBeNull();
      });
    });

    it('should progress through stages', async () => {
      const result = await handler({
        topic: 'Multi-stage reasoning',
        maxIterations: 6,
        stageSequence: ['Problem Definition', 'Analysis', 'Conclusion'],
      }) as any;

      expect(result.success).toBe(true);
      
      const stages = result.reasoning_chain.map((iter: any) => iter.stage);
      expect(stages).toContain('Problem Definition');
      expect(stages).toContain('Analysis');
      expect(stages).toContain('Conclusion');
    });

    it('should accumulate previous thoughts', async () => {
      const result = await handler({
        topic: 'Thought accumulation test',
        maxIterations: 4,
        previousThoughts: ['Initial thought'],
      }) as any;

      expect(result.success).toBe(true);
      expect(result.reasoning_chain.length).toBeGreaterThan(0);
      
      // Each iteration should add a thought
      expect(result.summary.total_iterations).toBeGreaterThan(0);
    });

    it('should detect convergence', async () => {
      const result = await handler({
        topic: 'Convergence test',
        maxIterations: 3,
      }) as any;

      expect(result.success).toBe(true);
      expect(result.summary).toHaveProperty('converged');
      expect(typeof result.summary.converged).toBe('boolean');
    });

    it('should return final state', async () => {
      const result = await handler({
        topic: 'Final state test',
        maxIterations: 5,
      }) as any;

      expect(result.success).toBe(true);
      expect(result.final_state).toBeDefined();
      expect(result.final_state).toHaveProperty('thought_number');
      expect(result.final_state).toHaveProperty('stage');
      expect(result.final_state).toHaveProperty('assumptions_challenged');
      expect(result.final_state).toHaveProperty('axioms_used');
    });

    it('should respect custom initial stage', async () => {
      const result = await handler({
        topic: 'Custom start stage test',
        maxIterations: 3,
        initialStage: 'Synthesis',
      }) as any;

      expect(result.success).toBe(true);
      expect(result.reasoning_chain[0].stage).toBe('Synthesis');
    });

    it('should include summary statistics', async () => {
      const result = await handler({
        topic: 'Summary stats test',
        maxIterations: 5,
      }) as any;

      expect(result.success).toBe(true);
      expect(result.summary).toMatchObject({
        topic: expect.any(String),
        total_iterations: expect.any(Number),
        converged: expect.any(Boolean),
        final_stage: expect.any(String),
        total_assumptions_challenged: expect.any(Number),
        total_axioms_used: expect.any(Number),
        unique_tags: expect.any(Array),
      });
    });
  });

  describe('Error Handling', () => {
    let handler: ReturnType<typeof createReasoningHandler>;

    beforeEach(() => {
      handler = createReasoningHandler();
    });

    it('should return structured error for invalid params', async () => {
      const result = await handler({
        topic: 'OK',
        maxIterations: 'not a number' as any,
      }) as any;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe(-32602);
      expect(result.error.message).toContain('Invalid');
    });

    it('should handle missing required parameters', async () => {
      const result = await handler({}) as any;

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(-32602);
    });

    it('should include validation details in error', async () => {
      const result = await handler({
        topic: 'A', // Too short
      }) as any;

      expect(result.success).toBe(false);
      expect(result.error.data).toHaveProperty('validationErrors');
      expect(Array.isArray(result.error.data.validationErrors)).toBe(true);
    });
  });
});
