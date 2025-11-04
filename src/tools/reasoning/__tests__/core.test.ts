/**
 * Reasoning Core Unit Tests
 * 
 * Tests for ReasoningEngine class and prompt template system.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ReasoningEngine, ReasoningContext } from '../core';
import {
  getStageTemplate,
  substituteVariables,
  getAvailableStages,
  renderPrompt,
  STAGE_TEMPLATES,
} from '../prompts';

describe('ReasoningEngine', () => {
  let engine: ReasoningEngine;

  beforeEach(() => {
    engine = new ReasoningEngine(10);
  });

  it('should initialize with default state', () => {
    const state = engine.getState();
    expect(state.thought_number).toBe(0);
    expect(state.total_thoughts).toBe(10);
    expect(state.stage).toBe('Problem Definition');
    expect(state.next_thought_needed).toBe(true);
    expect(state.assumptions_challenged).toEqual([]);
    expect(state.axioms_used).toEqual([]);
    expect(state.tags).toEqual([]);
  });

  it('should iterate through reasoning cycle', async () => {
    const context: ReasoningContext = {
      topic: 'Test Problem',
      current_stage: 'Problem Definition',
    };

    const state = await engine.iterate('Problem Definition', context);

    expect(state.thought_number).toBe(1);
    expect(state.stage).toBe('Problem Definition');
    expect(state.thought).toContain('Test Problem');
    expect(state.tags).toContain('Problem Definition');
  });

  it('should increment thought number on each iteration', async () => {
    const context: ReasoningContext = { topic: 'Test' };

    await engine.iterate('Problem Definition', context);
    expect(engine.getState().thought_number).toBe(1);

    await engine.iterate('Analysis', context);
    expect(engine.getState().thought_number).toBe(2);

    await engine.iterate('Conclusion', context);
    expect(engine.getState().thought_number).toBe(3);
  });

  it('should detect convergence when reaching total thoughts', async () => {
    const shortEngine = new ReasoningEngine(2);
    const context: ReasoningContext = { topic: 'Test' };

    expect(shortEngine.converged()).toBe(false);

    await shortEngine.iterate('Problem Definition', context);
    expect(shortEngine.converged()).toBe(false);

    await shortEngine.iterate('Conclusion', context);
    expect(shortEngine.converged()).toBe(true);
  });

  it('should challenge assumptions in Critical Questioning stage', async () => {
    const context: ReasoningContext = {
      topic: 'Test',
      previous_thoughts: ['thought 1', 'thought 2'],
    };

    await engine.iterate('Problem Definition', context);
    await engine.iterate('Critical Questioning', context);

    const state = engine.getState();
    expect(state.assumptions_challenged.length).toBeGreaterThan(0);
  });

  it('should track axioms used in Analysis stage', async () => {
    const context: ReasoningContext = { topic: 'Test' };

    await engine.iterate('Analysis', context);

    const state = engine.getState();
    expect(state.axioms_used).toContain('Logical consistency');
  });

  it('should allow state persistence and restoration', () => {
    const context: ReasoningContext = { topic: 'Test' };
    
    engine.iterate('Problem Definition', context);
    const savedState = engine.getState();
    
    const newEngine = new ReasoningEngine();
    newEngine.setState(savedState);
    
    expect(newEngine.getState()).toEqual(savedState);
  });

  it('should adjust total thoughts dynamically', () => {
    engine.adjustTotalThoughts(20);
    expect(engine.getState().total_thoughts).toBe(20);

    engine.adjustTotalThoughts(5);
    expect(engine.getState().total_thoughts).toBe(5);

    // Should not allow total < 1
    engine.adjustTotalThoughts(0);
    expect(engine.getState().total_thoughts).toBe(1);
  });

  it('should reset to initial state', async () => {
    const context: ReasoningContext = { topic: 'Test' };

    await engine.iterate('Problem Definition', context);
    await engine.iterate('Analysis', context);

    engine.reset();

    const state = engine.getState();
    expect(state.thought_number).toBe(0);
    expect(state.tags).toEqual([]);
    expect(state.assumptions_challenged).toEqual([]);
  });

  it('should add stage tags without duplicates', async () => {
    const context: ReasoningContext = { topic: 'Test' };

    await engine.iterate('Analysis', context);
    await engine.iterate('Analysis', context);

    const state = engine.getState();
    const analysisTags = state.tags.filter(t => t === 'Analysis');
    expect(analysisTags.length).toBe(1);
  });
});

describe('Prompt Templates', () => {
  it('should have 6 stage templates defined', () => {
    expect(STAGE_TEMPLATES).toHaveLength(6);
  });

  it('should get template for valid stage', () => {
    const template = getStageTemplate('Problem Definition');
    expect(template).toBeDefined();
    expect(template?.stage).toBe('Problem Definition');
    expect(template?.prompt).toContain('Problem Definition');
  });

  it('should return undefined for invalid stage', () => {
    const template = getStageTemplate('Nonexistent Stage');
    expect(template).toBeUndefined();
  });

  it('should substitute variables correctly', () => {
    const template = 'Hello {{name}}, your topic is {{topic}}.';
    const data = { name: 'Alice', topic: 'Testing' };

    const result = substituteVariables(template, data);

    expect(result).toBe('Hello Alice, your topic is Testing.');
  });

  it('should handle missing variables', () => {
    const template = 'Topic: {{topic}}, Missing: {{missing}}';
    const data = { topic: 'Test' };

    const result = substituteVariables(template, data);

    expect(result).toContain('Test');
    expect(result).toContain('(not provided)');
  });

  it('should get all available stages', () => {
    const stages = getAvailableStages();
    expect(stages).toHaveLength(6);
    expect(stages).toContain('Problem Definition');
    expect(stages).toContain('Conclusion');
  });

  it('should render complete prompt with context', () => {
    const context = {
      topic: 'AI Reasoning',
      context: 'Testing framework',
    };

    const prompt = renderPrompt('Problem Definition', context);

    expect(prompt).toBeDefined();
    expect(prompt).toContain('AI Reasoning');
    expect(prompt).toContain('Testing framework');
  });

  it('should return null for invalid stage in renderPrompt', () => {
    const prompt = renderPrompt('Invalid Stage', { topic: 'Test' });
    expect(prompt).toBeNull();
  });

  it('should have proper template structure', () => {
    STAGE_TEMPLATES.forEach((template) => {
      expect(template.stage).toBeDefined();
      expect(template.prompt).toBeDefined();
      expect(template.variables).toBeDefined();
      expect(template.description).toBeDefined();
      expect(Array.isArray(template.variables)).toBe(true);
    });
  });
});
