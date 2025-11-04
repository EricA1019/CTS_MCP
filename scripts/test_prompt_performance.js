#!/usr/bin/env node
/**
 * Performance test for prompt rendering
 */

import { TemplateRenderer } from '../build/prompts/template_renderer.js';
import { ALL_TOOL_PROMPTS } from '../build/prompts/tool_prompts.js';

const renderer = new TemplateRenderer();

async function measurePromptPerformance() {
  console.log('\n=== Prompt Rendering Performance ===\n');
  
  const testCases = [
    {
      prompt: ALL_TOOL_PROMPTS[0], // SCAN_SIGNALS_PROMPT
      args: { signalCount: 100, fileCount: 50, hasIssues: true },
    },
    {
      prompt: ALL_TOOL_PROMPTS[1], // ANALYZE_PROJECT_PROMPT
      args: { analysisType: 'full', issueCount: 25, complianceScore: 85 },
    },
    {
      prompt: ALL_TOOL_PROMPTS[2], // SUGGEST_REFACTORING_PROMPT
      args: { targetFile: 'script.gd', suggestionCount: 10, priority: 'high' },
    },
  ];

  let totalTime = 0;
  let iterations = 0;

  for (const testCase of testCases) {
    const start = performance.now();
    testCase.prompt.render(testCase.args);
    const end = performance.now();
    const duration = end - start;
    
    totalTime += duration;
    iterations++;
    
    console.log(`${testCase.prompt.name}:`);
    console.log(`  Render time: ${duration.toFixed(3)}ms`);
    console.log(`  Budget: <5ms`);
    console.log(`  Status: ${duration < 5 ? '✅ PASS' : '❌ FAIL'}\n`);
  }

  const avgTime = totalTime / iterations;
  console.log('=== Summary ===');
  console.log(`Total prompts tested: ${iterations}`);
  console.log(`Average render time: ${avgTime.toFixed(3)}ms`);
  console.log(`All prompts registered: ${ALL_TOOL_PROMPTS.length}`);
  console.log(`Overall status: ${avgTime < 5 ? '✅ PASS' : '❌ FAIL'}`);
}

measurePromptPerformance().catch(console.error);
