#!/usr/bin/env node
/**
 * Performance test for resource loading
 */

import { PromptLoader } from '../build/resources/prompt_loader.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const promptsDir = join(__dirname, '..', 'data', 'prompts');
const loader = new PromptLoader();

async function measureLoadTime() {
  const start = performance.now();
  const resources = await loader.loadPromptsFromDirectory(promptsDir);
  const end = performance.now();
  const duration = end - start;
  
  console.log(`\n=== Resource Loading Performance ===`);
  console.log(`Resources loaded: ${resources.length}`);
  console.log(`Total time: ${duration.toFixed(2)}ms`);
  console.log(`Average per resource: ${(duration / resources.length).toFixed(2)}ms`);
  console.log(`Budget threshold: <10ms per resource`);
  console.log(`Status: ${duration / resources.length < 10 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test read performance
  if (resources.length > 0) {
    const testUri = resources[0].uri;
    const readStart = performance.now();
    await loader.readPromptContent(testUri);
    const readEnd = performance.now();
    const readDuration = readEnd - readStart;
    
    console.log(`\n=== Resource Read Performance ===`);
    console.log(`Read time for ${testUri}: ${readDuration.toFixed(2)}ms`);
    console.log(`Budget threshold: <10ms`);
    console.log(`Status: ${readDuration < 10 ? '✅ PASS' : '❌ FAIL'}`);
  }
}

measureLoadTime().catch(console.error);
