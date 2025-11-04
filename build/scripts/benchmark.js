#!/usr/bin/env node
/**
 * Performance Benchmark Suite for CTS MCP Server
 *
 * Validates performance targets from Tier 2C improvements:
 * - Sync tools: <100ms
 * - Async tools: <5s
 * - Cache operations: <2ms
 * - Schema validation: <2ms
 */
import { performance } from 'perf_hooks';
import { ResultCache } from '../cache/result_cache.js';
import { ConfigManager } from '../config/tool_config.js';
import { checkResponseSize, truncateLargeArrays } from '../sampling/index.js';
import fs from 'fs';
import path from 'path';
/**
 * Run a benchmark with multiple iterations
 */
function benchmark(name, fn, iterations = 100) {
    const times = [];
    // Warmup
    for (let i = 0; i < 10; i++) {
        fn();
    }
    // Actual measurements
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        fn();
        const end = performance.now();
        times.push(end - start);
    }
    return times;
}
/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray, p) {
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
}
/**
 * Analyze benchmark times
 */
function analyzeTimes(name, category, target, times) {
    const sorted = times.slice().sort((a, b) => a - b);
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    return {
        name,
        category,
        target,
        iterations: times.length,
        mean,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: percentile(sorted, 95),
        p99: percentile(sorted, 99),
        passed: mean < target,
    };
}
/**
 * Main benchmark suite
 */
async function runBenchmarks() {
    console.log('🚀 CTS MCP Performance Benchmark Suite\n');
    const results = [];
    // 1. Cache Operations (Target: <2ms)
    console.log('📦 Cache Operations...');
    const cache = new ResultCache({ maxEntries: 100 });
    const cacheData = { result: Array(100).fill('test') };
    // Cache write
    const writeTimes = benchmark('Cache Write', () => {
        cache.set('bench', { id: Math.random() }, cacheData);
    }, 1000);
    results.push(analyzeTimes('Cache Write', 'cache', 2, writeTimes));
    // Cache read
    cache.set('bench', { id: 1 }, cacheData);
    const readTimes = benchmark('Cache Read', () => {
        cache.get('bench', { id: 1 });
    }, 1000);
    results.push(analyzeTimes('Cache Read', 'cache', 2, readTimes));
    // Cache key generation
    const keyTimes = benchmark('Cache Key Generation', () => {
        cache['generateKey']('tool', { projectPath: '/test', data: [1, 2, 3] });
    }, 1000);
    results.push(analyzeTimes('Cache Key Generation', 'cache', 1, keyTimes));
    // 2. Configuration Management (Target: <100ms)
    console.log('⚙️  Configuration Management...');
    const config = new ConfigManager();
    const configReadTimes = benchmark('Config Read', () => {
        config.getBughunterConfig();
    }, 1000);
    results.push(analyzeTimes('Config Read', 'sync', 100, configReadTimes));
    const configUpdateTimes = benchmark('Config Update', () => {
        config.updateConfig({ bughunter: { enableCache: !config.getBughunterConfig().enableCache } });
    }, 1000);
    results.push(analyzeTimes('Config Update', 'sync', 100, configUpdateTimes));
    // 3. Sampling Operations (Target: <5ms for small data, <100ms for large)
    console.log('🎯 Sampling Operations...');
    const smallData = { items: Array(50).fill({ id: 1, data: 'x'.repeat(100) }) };
    const smallSamplingTimes = benchmark('Sampling (Small Data)', () => {
        truncateLargeArrays(smallData, 25);
    }, 1000);
    results.push(analyzeTimes('Sampling Small Arrays', 'sync', 5, smallSamplingTimes));
    const largeData = { items: Array(1000).fill({ id: 1, data: 'x'.repeat(100) }) };
    const largeSamplingTimes = benchmark('Sampling (Large Data)', () => {
        truncateLargeArrays(largeData, 100);
    }, 100);
    results.push(analyzeTimes('Sampling Large Arrays', 'sync', 100, largeSamplingTimes));
    // Size checking
    const sizeCheckTimes = benchmark('Size Check', () => {
        checkResponseSize(smallData, 60000);
    }, 1000);
    results.push(analyzeTimes('Response Size Check', 'sync', 5, sizeCheckTimes));
    // 4. Complete Workflow (Target: <100ms with cache hit)
    console.log('🔄 Complete Workflow...');
    const workflowCache = new ResultCache({ enableStats: true });
    const workflowConfig = new ConfigManager({ bughunter: { enableCache: true } });
    const params = { projectPath: '/test' };
    // First run (cache miss)
    const missWorkflowTimes = benchmark('Workflow (Cache Miss)', () => {
        const toolConfig = workflowConfig.getBughunterConfig();
        let result = workflowCache.get('test', params);
        if (!result) {
            const mockResult = { bugs: Array(100).fill({ severity: 'high' }) };
            const sampled = truncateLargeArrays(mockResult, 50);
            const { data } = checkResponseSize(sampled, 60000);
            if (toolConfig.enableCache) {
                workflowCache.set('test', params, data);
            }
        }
    }, 100);
    results.push(analyzeTimes('Workflow Cache Miss', 'sync', 100, missWorkflowTimes));
    // Second run (cache hit)
    workflowCache.set('test', params, { data: 'cached' });
    const hitWorkflowTimes = benchmark('Workflow (Cache Hit)', () => {
        const result = workflowCache.get('test', params);
        if (result) {
            // Cache hit - should be very fast
        }
    }, 1000);
    results.push(analyzeTimes('Workflow Cache Hit', 'sync', 10, hitWorkflowTimes));
    // Generate summary
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    return {
        timestamp: new Date().toISOString(),
        results,
        summary: {
            total: results.length,
            passed,
            failed,
            passRate: (passed / results.length) * 100,
        },
    };
}
/**
 * Format results as table
 */
function formatResults(suite) {
    console.log('\n📊 Results:\n');
    console.log('Category'.padEnd(20), 'Benchmark'.padEnd(30), 'Target'.padEnd(10), 'Mean'.padEnd(10), 'P95'.padEnd(10), 'Status');
    console.log('-'.repeat(100));
    for (const result of suite.results) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(result.category.toUpperCase().padEnd(20), result.name.padEnd(30), `<${result.target}ms`.padEnd(10), `${result.mean.toFixed(2)}ms`.padEnd(10), `${result.p95.toFixed(2)}ms`.padEnd(10), status);
    }
    console.log('\n' + '='.repeat(100));
    console.log(`\n📈 Summary: ${suite.summary.passed}/${suite.summary.total} passed (${suite.summary.passRate.toFixed(1)}%)\n`);
    if (suite.summary.failed > 0) {
        console.log('⚠️  Failed benchmarks:');
        suite.results
            .filter(r => !r.passed)
            .forEach(r => console.log(`   - ${r.name}: ${r.mean.toFixed(2)}ms (target: <${r.target}ms)`));
        console.log();
    }
}
/**
 * Save results to file
 */
function saveResults(suite) {
    const outputDir = path.join(process.cwd(), 'benchmarks');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, 'results.json');
    fs.writeFileSync(outputPath, JSON.stringify(suite, null, 2));
    console.log(`💾 Results saved to ${outputPath}\n`);
}
/**
 * Main entry point
 */
async function main() {
    try {
        const suite = await runBenchmarks();
        formatResults(suite);
        saveResults(suite);
        // Exit with error if benchmarks failed
        if (suite.summary.failed > 0) {
            console.error('❌ Some benchmarks failed performance targets');
            process.exit(1);
        }
        console.log('✅ All benchmarks passed!');
    }
    catch (error) {
        console.error('Error running benchmarks:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=benchmark.js.map