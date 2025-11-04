#!/usr/bin/env node
/**
 * Clustering Performance Benchmark
 * Tests community detection performance on large graphs
 */

import { detectCommunities } from '../build/artifacts/clustering/community_detection.js';

console.log('🧪 Clustering Performance Benchmark\n');

// Test 1: 50-node graph
console.log('Test 1: 50-node graph (5 files × 10 signals)');
const test1Nodes = [];
const test1Links = [];

for (let file = 0; file < 5; file++) {
  for (let sig = 0; sig < 10; sig++) {
    test1Nodes.push({ id: `f${file}_s${sig}` });
  }
  
  // Fully connect within file
  for (let i = 0; i < 10; i++) {
    for (let j = i + 1; j < 10; j++) {
      test1Links.push({
        source: `f${file}_s${i}`,
        target: `f${file}_s${j}`,
      });
    }
  }
}

const start1 = performance.now();
const result1 = detectCommunities(test1Nodes, test1Links);
const duration1 = performance.now() - start1;

console.log(`  Nodes: ${test1Nodes.length}`);
console.log(`  Links: ${test1Links.length}`);
console.log(`  Clusters: ${result1.clusters.size}`);
console.log(`  Modularity: ${result1.modularity.toFixed(4)}`);
console.log(`  Duration: ${duration1.toFixed(2)}ms`);
console.log(`  Status: ${duration1 < 100 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 2: 100-node graph
console.log('Test 2: 100-node graph (10 files × 10 signals)');
const test2Nodes = [];
const test2Links = [];

for (let file = 0; file < 10; file++) {
  for (let sig = 0; sig < 10; sig++) {
    test2Nodes.push({ id: `f${file}_s${sig}` });
  }
  
  for (let i = 0; i < 10; i++) {
    for (let j = i + 1; j < 10; j++) {
      test2Links.push({
        source: `f${file}_s${i}`,
        target: `f${file}_s${j}`,
      });
    }
  }
}

// Add cross-file connections
for (let file = 0; file < 9; file++) {
  test2Links.push({
    source: `f${file}_s0`,
    target: `f${file + 1}_s0`,
  });
}

const start2 = performance.now();
const result2 = detectCommunities(test2Nodes, test2Links);
const duration2 = performance.now() - start2;

console.log(`  Nodes: ${test2Nodes.length}`);
console.log(`  Links: ${test2Links.length}`);
console.log(`  Clusters: ${result2.clusters.size}`);
console.log(`  Modularity: ${result2.modularity.toFixed(4)}`);
console.log(`  Duration: ${duration2.toFixed(2)}ms`);
console.log(`  Status: ${duration2 < 150 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 3: 150-node graph (target scenario)
console.log('Test 3: 150-node graph (10 files × 15 signals) - TARGET SCENARIO');
const test3Nodes = [];
const test3Links = [];

for (let file = 0; file < 10; file++) {
  for (let sig = 0; sig < 15; sig++) {
    test3Nodes.push({ id: `f${file}_s${sig}` });
  }
  
  for (let i = 0; i < 15; i++) {
    for (let j = i + 1; j < 15; j++) {
      test3Links.push({
        source: `f${file}_s${i}`,
        target: `f${file}_s${j}`,
      });
    }
  }
}

// Cross-file bridges
for (let file = 0; file < 9; file++) {
  test3Links.push({
    source: `f${file}_s0`,
    target: `f${file + 1}_s0`,
  });
  test3Links.push({
    source: `f${file}_s7`,
    target: `f${file + 1}_s7`,
  });
}

const start3 = performance.now();
const result3 = detectCommunities(test3Nodes, test3Links);
const duration3 = performance.now() - start3;

console.log(`  Nodes: ${test3Nodes.length}`);
console.log(`  Links: ${test3Links.length}`);
console.log(`  Clusters: ${result3.clusters.size}`);
console.log(`  Modularity: ${result3.modularity.toFixed(4)}`);
console.log(`  Duration: ${duration3.toFixed(2)}ms`);
console.log(`  Target: <200ms (clustering only)`);
console.log(`  Status: ${duration3 < 200 ? '✅ PASS' : '❌ FAIL'}\n`);

// Test 4: 300-node graph (stress test)
console.log('Test 4: 300-node graph (20 files × 15 signals) - STRESS TEST');
const test4Nodes = [];
const test4Links = [];

for (let file = 0; file < 20; file++) {
  for (let sig = 0; sig < 15; sig++) {
    test4Nodes.push({ id: `f${file}_s${sig}` });
  }
  
  for (let i = 0; i < 15; i++) {
    for (let j = i + 1; j < 15; j++) {
      test4Links.push({
        source: `f${file}_s${i}`,
        target: `f${file}_s${j}`,
      });
    }
  }
}

const start4 = performance.now();
const result4 = detectCommunities(test4Nodes, test4Links);
const duration4 = performance.now() - start4;

console.log(`  Nodes: ${test4Nodes.length}`);
console.log(`  Links: ${test4Links.length}`);
console.log(`  Clusters: ${result4.clusters.size}`);
console.log(`  Modularity: ${result4.modularity.toFixed(4)}`);
console.log(`  Duration: ${duration4.toFixed(2)}ms`);
console.log(`  Target: <500ms (stress test)`);
console.log(`  Status: ${duration4 < 500 ? '✅ PASS' : '❌ FAIL'}\n`);

// Summary
console.log('━'.repeat(60));
console.log('Summary:');
console.log(`  50 nodes:  ${duration1.toFixed(2)}ms`);
console.log(`  100 nodes: ${duration2.toFixed(2)}ms`);
console.log(`  150 nodes: ${duration3.toFixed(2)}ms ⭐ TARGET`);
console.log(`  300 nodes: ${duration4.toFixed(2)}ms`);
console.log('');

const allPassed = duration1 < 100 && duration2 < 150 && duration3 < 200 && duration4 < 500;
console.log(allPassed ? '✅ All benchmarks PASSED' : '❌ Some benchmarks FAILED');
process.exit(allPassed ? 0 : 1);
