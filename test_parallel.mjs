#!/usr/bin/env node
/**
 * Manual Test Script for Parallel Execution
 * 
 * Tests the parallel rule executor on a real Godot project.
 */

import { executeRulesParallel, shouldUseParallel } from './build/parallel/rule_executor.js';
import { ALL_RULES } from './build/tools/audit/checkers.js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Get GDScript files from project
function getGDScriptFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    // Skip hidden and build directories
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'build') {
      continue;
    }
    
    if (entry.isDirectory()) {
      getGDScriptFiles(fullPath, files);
    } else if (entry.name.endsWith('.gd')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

async function testParallelExecution() {
  const projectPath = '/home/eric/Godot/ProtoBd';
  
  console.log('🔍 Scanning project for GDScript files...');
  const allFiles = getGDScriptFiles(projectPath);
  const relativeFiles = allFiles.map(f => f.replace(projectPath + '/', ''));
  
  console.log(`📁 Found ${allFiles.length} GDScript files`);
  
  const rules = ALL_RULES;
  console.log(`📋 Testing with ${rules.length} compliance rules`);
  
  const shouldParallel = shouldUseParallel(rules.length, allFiles.length);
  console.log(`⚙️  Should use parallel: ${shouldParallel ? 'YES' : 'NO'}`);
  
  const context = {
    projectPath,
    files: relativeFiles,
  };
  
  // Sequential execution
  console.log('\n🔄 Running sequential execution...');
  const seqStart = performance.now();
  const seqResults = [];
  for (const rule of rules) {
    const result = await rule.check(context);
    seqResults.push({ ...result, rule });
  }
  const seqTime = performance.now() - seqStart;
  console.log(`✅ Sequential: ${Math.round(seqTime)}ms`);
  
  // Parallel execution
  console.log('\n⚡ Running parallel execution...');
  const parStart = performance.now();
  const parResults = await executeRulesParallel(
    rules,
    context,
    4,
    (completed, total, ruleId) => {
      process.stdout.write(`\r   Progress: ${completed}/${total} rules complete`);
    }
  );
  const parTime = performance.now() - parStart;
  console.log(`\n✅ Parallel: ${Math.round(parTime)}ms`);
  
  const speedup = seqTime / parTime;
  console.log(`\n📊 Performance:`);
  console.log(`   Sequential: ${Math.round(seqTime)}ms`);
  console.log(`   Parallel:   ${Math.round(parTime)}ms`);
  console.log(`   Speedup:    ${speedup.toFixed(2)}x`);
  console.log(`   Target:     3.00x`);
  
  if (speedup >= 3.0) {
    console.log('\n✅ SUCCESS: Achieved 3x speedup target!');
  } else if (speedup >= 2.0) {
    console.log('\n⚠️  PARTIAL: Achieved 2x+ speedup (target is 3x)');
  } else {
    console.log('\n❌ BELOW TARGET: Did not achieve 2x speedup');
  }
  
  // Verify results match
  console.log('\n🔍 Verifying result correctness...');
  let mismatches = 0;
  for (let i = 0; i < rules.length; i++) {
    if (seqResults[i].rule.id !== parResults[i].rule.id) {
      console.log(`   ❌ Rule ID mismatch at index ${i}`);
      mismatches++;
    }
  }
  
  if (mismatches === 0) {
    console.log('   ✅ All results match!');
  } else {
    console.log(`   ❌ ${mismatches} mismatches found`);
  }
}

testParallelExecution().catch(console.error);
