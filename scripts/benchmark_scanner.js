#!/usr/bin/env node

/**
 * Project Scanner Performance Benchmark
 * 
 * Benchmark script to validate HOP 3.1 performance targets:
 * - 500 files in <5s
 * - Memory usage <100MB
 * - 100% file discovery recall
 */

import { ProjectScanner } from '../build/artifacts/scanner/project_scanner.js';
import { resolve } from 'path';

async function main() {
  const args = process.argv.slice(2);
  const projectPath = args[0] || process.cwd();

  console.log('=== Project Scanner Benchmark ===');
  console.log(`Project: ${projectPath}\n`);

  const scanner = new ProjectScanner();

  // Listen to events
  scanner.on('project:scan_started', (data) => {
    console.log(`[SCAN STARTED] Mode: ${data.mode}, Path: ${data.projectPath}`);
  });

  scanner.on('project:scan_progress', (data) => {
    console.log(`[PROGRESS] ${data.filesProcessed}/${data.totalFiles} files processed`);
  });

  scanner.on('project:scan_completed', (data) => {
    console.log(`\n[SCAN COMPLETED]`);
    console.log(`  Files discovered: ${data.filesDiscovered}`);
    console.log(`  Files parsed: ${data.filesParsed}`);
    console.log(`  Files skipped (cache): ${data.filesSkipped}`);
    console.log(`  Worker count: ${data.workerCount}`);
    console.log(`  Duration: ${data.durationMs}ms (${(data.durationMs / 1000).toFixed(2)}s)`);
    console.log(`  Peak memory: ${(data.peakMemoryBytes / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Throughput: ${(data.filesParsed / (data.durationMs / 1000)).toFixed(1)} files/sec`);
  });

  scanner.on('project:scan_failed', (data) => {
    console.error(`\n[SCAN FAILED] ${data.error}`);
  });

  try {
    // Full scan
    console.log('--- Full Scan ---');
    const memBefore = process.memoryUsage().heapUsed;
    const astForest = await scanner.scanProject(resolve(projectPath), 'full');
    const memAfter = process.memoryUsage().heapUsed;

    const stats = scanner.getStats();

    console.log(`\n=== Results ===`);
    console.log(`Total AST trees: ${astForest.length}`);
    console.log(`Memory delta: ${((memAfter - memBefore) / 1024 / 1024).toFixed(2)}MB`);

    // Verify targets
    console.log(`\n=== Target Verification ===`);
    const targetDuration = 5000; // 5s for 500 files
    const scaledTarget = (stats.filesDiscovered / 500) * targetDuration;

    if (stats.durationMs < scaledTarget) {
      console.log(`✅ Performance target MET: ${stats.durationMs}ms < ${scaledTarget.toFixed(0)}ms (scaled for ${stats.filesDiscovered} files)`);
    } else {
      console.log(`❌ Performance target MISSED: ${stats.durationMs}ms > ${scaledTarget.toFixed(0)}ms`);
    }

    if (stats.peakMemoryBytes < 100 * 1024 * 1024) {
      console.log(`✅ Memory target MET: ${(stats.peakMemoryBytes / 1024 / 1024).toFixed(2)}MB < 100MB`);
    } else {
      console.log(`❌ Memory target MISSED: ${(stats.peakMemoryBytes / 1024 / 1024).toFixed(2)}MB > 100MB`);
    }

    if (stats.filesDiscovered === stats.filesParsed) {
      console.log(`✅ Discovery recall: 100% (all discovered files parsed)`);
    }

    // Incremental scan test
    console.log(`\n--- Incremental Scan (2nd run) ---`);
    const astForest2 = await scanner.scanProject(resolve(projectPath), 'incremental');
    const stats2 = scanner.getStats();

    console.log(`Files skipped (cached): ${stats2.filesSkipped}`);
    console.log(`Files re-parsed: ${stats2.filesParsed}`);
    console.log(`Duration: ${stats2.durationMs}ms`);

    if (stats2.filesSkipped === stats.filesDiscovered) {
      console.log(`✅ Cache hit rate: 100% (all files cached)`);
    }

  } catch (error) {
    console.error(`\n❌ Benchmark failed:`, error);
    process.exit(1);
  }
}

main();
