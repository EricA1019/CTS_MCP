/**
 * Reasoning Engine Performance Tests
 * 
 * Validates <500ms iteration requirement from Task 11.1a verification criteria.
 */

import { describe, it, expect } from '@jest/globals';
import { ReasoningEngine, ReasoningContext } from '../core';

describe('ReasoningEngine Performance', () => {
  it('should complete iteration in <500ms', async () => {
    const engine = new ReasoningEngine(10);
    const context: ReasoningContext = {
      topic: 'Performance Testing',
      context: 'Measuring iteration speed',
    };

    const start = performance.now();
    await engine.iterate('Problem Definition', context);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500);
  });

  it('should complete full reasoning cycle in reasonable time', async () => {
    const engine = new ReasoningEngine(6);
    const context: ReasoningContext = {
      topic: 'Full Cycle Test',
    };

    const stages = [
      'Problem Definition',
      'Information Gathering',
      'Analysis',
      'Synthesis',
      'Conclusion',
      'Critical Questioning',
    ];

    const start = performance.now();

    for (const stage of stages) {
      await engine.iterate(stage, context);
    }

    const totalDuration = performance.now() - start;

    // 6 iterations × 500ms max = 3000ms max
    expect(totalDuration).toBeLessThan(3000);
  });

  it('should handle rapid iterations efficiently', async () => {
    const engine = new ReasoningEngine(50);
    const context: ReasoningContext = {
      topic: 'Rapid iteration test',
    };

    const start = performance.now();

    // 20 rapid iterations
    for (let i = 0; i < 20; i++) {
      await engine.iterate('Analysis', context);
    }

    const duration = performance.now() - start;

    // Average should still be <500ms per iteration
    const avgPerIteration = duration / 20;
    expect(avgPerIteration).toBeLessThan(500);
  });

  it('should maintain performance with large state', async () => {
    const engine = new ReasoningEngine(100);
    const context: ReasoningContext = {
      topic: 'Large state test',
      context: 'Testing performance with many thoughts',
      previous_thoughts: Array.from({ length: 50 }, (_, i) => `Thought ${i}`),
    };

    // Add many iterations to build up state
    for (let i = 0; i < 30; i++) {
      await engine.iterate('Analysis', context);
    }

    // Measure a single iteration with large accumulated state
    const start = performance.now();
    await engine.iterate('Synthesis', context);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500);
  });
});
