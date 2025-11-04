#!/usr/bin/env node
/**
 * Validation Script for HOP 3.3: Unused Signal Detector
 * 
 * Validates:
 * 1. Orphan signal detection (defined but never emitted)
 * 2. Dead emitter detection (emitted but never connected)
 * 3. Isolated signal detection (neither emitted nor connected)
 * 4. Confidence scoring heuristics
 * 5. Performance (<500ms for 300 signals)
 * 6. Statistics tracking
 */

import { UnusedDetector } from '../src/artifacts/analysis/unused_detector.js';
import { UnusedPattern } from '../src/artifacts/analysis/types.js';

/**
 * Test 1: Orphan Signal Detection
 */
function testOrphanDetection() {
  console.log('\n=== Test 1: Orphan Signal Detection ===\n');

  const detector = new UnusedDetector();
  const graph = {
    definitions: new Map([
      ['health_changed', [
        { name: 'health_changed', params: ['new_health'], filePath: '/player.gd', line: 5, source: 'player' },
      ]],
    ]),
    emissions: new Map(),
    connections: new Map([
      ['health_changed', [
        { signalName: 'health_changed', filePath: '/ui.gd', line: 10, context: '', target: 'self', handler: '_on_health_changed', flags: [], isLambda: false },
      ]],
    ]),
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 2,
      signalCount: 1,
      emissionCount: 0,
      connectionCount: 1,
    },
  };

  return detector.detectUnused(graph).then(unused => {
    console.log(`✓ Detected ${unused.length} orphan signal(s)`);
    
    if (unused.length !== 1) {
      throw new Error(`Expected 1 orphan, got ${unused.length}`);
    }

    const orphan = unused[0];
    console.log(`  Signal: ${orphan.signalName}`);
    console.log(`  Pattern: ${orphan.pattern}`);
    console.log(`  Confidence: ${orphan.confidence.toFixed(2)}`);
    console.log(`  Reason: ${orphan.reason}`);

    if (orphan.pattern !== UnusedPattern.Orphan) {
      throw new Error(`Expected pattern 'orphan', got '${orphan.pattern}'`);
    }

    if (orphan.confidence < 0.95) {
      throw new Error(`Expected confidence ≥0.95, got ${orphan.confidence}`);
    }

    console.log('\n✅ Orphan detection: PASSED');
    return true;
  });
}

/**
 * Test 2: Dead Emitter Detection
 */
function testDeadEmitterDetection() {
  console.log('\n=== Test 2: Dead Emitter Detection ===\n');

  const detector = new UnusedDetector();
  const graph = {
    definitions: new Map([
      ['debug_log', [
        { name: 'debug_log', params: ['message'], filePath: '/logger.gd', line: 5, source: 'logger' },
      ]],
    ]),
    emissions: new Map([
      ['debug_log', [
        { signalName: 'debug_log', filePath: '/logger.gd', line: 20, context: '', emitter: 'self', args: ['msg'] },
      ]],
    ]),
    connections: new Map(),
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 1,
      signalCount: 1,
      emissionCount: 1,
      connectionCount: 0,
    },
  };

  return detector.detectUnused(graph).then(unused => {
    console.log(`✓ Detected ${unused.length} dead emitter(s)`);

    if (unused.length !== 1) {
      throw new Error(`Expected 1 dead emitter, got ${unused.length}`);
    }

    const deadEmitter = unused[0];
    console.log(`  Signal: ${deadEmitter.signalName}`);
    console.log(`  Pattern: ${deadEmitter.pattern}`);
    console.log(`  Confidence: ${deadEmitter.confidence.toFixed(2)}`);

    if (deadEmitter.pattern !== UnusedPattern.DeadEmitter) {
      throw new Error(`Expected pattern 'dead_emitter', got '${deadEmitter.pattern}'`);
    }

    if (deadEmitter.confidence < 0.90) {
      throw new Error(`Expected confidence ≥0.90, got ${deadEmitter.confidence}`);
    }

    console.log('\n✅ Dead emitter detection: PASSED');
    return true;
  });
}

/**
 * Test 3: Isolated Signal Detection
 */
function testIsolatedDetection() {
  console.log('\n=== Test 3: Isolated Signal Detection ===\n');

  const detector = new UnusedDetector();
  const graph = {
    definitions: new Map([
      ['unused_signal', [
        { name: 'unused_signal', params: [], filePath: '/deprecated.gd', line: 10, source: 'deprecated' },
      ]],
    ]),
    emissions: new Map(),
    connections: new Map(),
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 1,
      signalCount: 1,
      emissionCount: 0,
      connectionCount: 0,
    },
  };

  return detector.detectUnused(graph).then(unused => {
    console.log(`✓ Detected ${unused.length} isolated signal(s)`);

    if (unused.length !== 1) {
      throw new Error(`Expected 1 isolated signal, got ${unused.length}`);
    }

    const isolated = unused[0];
    console.log(`  Signal: ${isolated.signalName}`);
    console.log(`  Pattern: ${isolated.pattern}`);
    console.log(`  Confidence: ${isolated.confidence.toFixed(2)}`);

    if (isolated.pattern !== UnusedPattern.Isolated) {
      throw new Error(`Expected pattern 'isolated', got '${isolated.pattern}'`);
    }

    if (isolated.confidence !== 1.0) {
      throw new Error(`Expected confidence 1.0, got ${isolated.confidence}`);
    }

    console.log('\n✅ Isolated signal detection: PASSED');
    return true;
  });
}

/**
 * Test 4: Confidence Scoring Heuristics
 */
function testConfidenceScoring() {
  console.log('\n=== Test 4: Confidence Scoring Heuristics ===\n');

  const detector = new UnusedDetector();
  const graph = {
    definitions: new Map([
      ['normal_signal', [
        { name: 'normal_signal', params: [], filePath: '/a.gd', line: 5, source: 'a' },
      ]],
      ['_private_signal', [
        { name: '_private_signal', params: [], filePath: '/b.gd', line: 10, source: 'b' },
      ]],
      ['inherited_signal', [
        { name: 'inherited_signal', params: [], filePath: '/parent.gd', line: 15, source: 'parent' },
        { name: 'inherited_signal', params: [], filePath: '/child.gd', line: 20, source: 'child' },
      ]],
    ]),
    emissions: new Map(),
    connections: new Map([
      ['normal_signal', [
        { signalName: 'normal_signal', filePath: '/a.gd', line: 30, context: '', target: 'self', handler: '_on_normal', flags: [], isLambda: false },
      ]],
      ['_private_signal', [
        { signalName: '_private_signal', filePath: '/b.gd', line: 40, context: '', target: 'self', handler: '_on_private', flags: [], isLambda: false },
      ]],
      ['inherited_signal', [
        { signalName: 'inherited_signal', filePath: '/child.gd', line: 50, context: '', target: 'self', handler: '_on_inherited', flags: [], isLambda: false },
      ]],
    ]),
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 3,
      signalCount: 3,
      emissionCount: 0,
      connectionCount: 3,
    },
  };

  return detector.detectUnused(graph).then(unused => {
    console.log(`✓ Detected ${unused.length} orphan signal(s) with confidence scoring`);

    const normal = unused.find(u => u.signalName === 'normal_signal');
    const privateSignal = unused.find(u => u.signalName === '_private_signal');
    const inherited = unused.find(u => u.signalName === 'inherited_signal');

    console.log(`  normal_signal: ${normal ? normal.confidence.toFixed(2) : 'not detected (low confidence)'}`);
    console.log(`  _private_signal: ${privateSignal ? privateSignal.confidence.toFixed(2) : 'not detected (low confidence)'}`);
    console.log(`  inherited_signal: ${inherited ? inherited.confidence.toFixed(2) : 'not detected (low confidence)'}`);

    // Normal signal should have highest confidence
    if (normal && normal.confidence < 0.95) {
      throw new Error(`Normal signal confidence too low: ${normal.confidence}`);
    }

    // Private signal should have reduced confidence
    if (privateSignal && privateSignal.confidence >= 0.95) {
      throw new Error(`Private signal confidence should be reduced: ${privateSignal.confidence}`);
    }

    // Inherited signal should have lowest confidence
    if (inherited && inherited.confidence >= 0.90) {
      throw new Error(`Inherited signal confidence should be reduced: ${inherited.confidence}`);
    }

    console.log('\n✅ Confidence scoring: PASSED');
    return true;
  });
}

/**
 * Test 5: Performance (<500ms for 300 signals)
 */
function testPerformance() {
  console.log('\n=== Test 5: Performance Test ===\n');

  const detector = new UnusedDetector();
  
  // Create large graph with 300 signals
  const definitions = new Map();
  const emissions = new Map();
  const connections = new Map();

  for (let i = 0; i < 300; i++) {
    const signalName = `signal_${i}`;
    const filePath = `/test_${i % 10}.gd`;

    definitions.set(signalName, [
      { name: signalName, params: [], filePath, line: i + 1, source: `test_${i % 10}` },
    ]);

    // 50% have emissions
    if (i % 2 === 0) {
      emissions.set(signalName, [
        { signalName, filePath, line: i + 100, context: '', emitter: 'self' },
      ]);
    }

    // 50% have connections
    if (i % 2 === 1) {
      connections.set(signalName, [
        { signalName, filePath, line: i + 200, context: '', target: 'self', handler: `_on_${signalName}`, flags: [], isLambda: false },
      ]);
    }
  }

  const graph = {
    definitions,
    emissions,
    connections,
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 10,
      signalCount: 300,
      emissionCount: 150,
      connectionCount: 150,
    },
  };

  const startTime = performance.now();
  return detector.detectUnused(graph).then(unused => {
    const duration = performance.now() - startTime;

    console.log(`✓ Analyzed 300 signals in ${duration.toFixed(2)}ms`);
    console.log(`  Unused signals found: ${unused.length}`);

    if (duration >= 500) {
      throw new Error(`Performance target missed: ${duration.toFixed(2)}ms (expected <500ms)`);
    }

    console.log('\n✅ Performance test: PASSED');
    return true;
  });
}

/**
 * Test 6: Statistics Tracking
 */
function testStatistics() {
  console.log('\n=== Test 6: Statistics Tracking ===\n');

  const detector = new UnusedDetector();
  const graph = {
    definitions: new Map([
      ['orphan', [
        { name: 'orphan', params: [], filePath: '/a.gd', line: 5, source: 'a' },
      ]],
      ['dead', [
        { name: 'dead', params: [], filePath: '/b.gd', line: 10, source: 'b' },
      ]],
      ['isolated', [
        { name: 'isolated', params: [], filePath: '/c.gd', line: 15, source: 'c' },
      ]],
      ['used', [
        { name: 'used', params: [], filePath: '/d.gd', line: 20, source: 'd' },
      ]],
    ]),
    emissions: new Map([
      ['dead', [
        { signalName: 'dead', filePath: '/b.gd', line: 30, context: '', emitter: 'self' },
      ]],
      ['used', [
        { signalName: 'used', filePath: '/d.gd', line: 40, context: '', emitter: 'self' },
      ]],
    ]),
    connections: new Map([
      ['orphan', [
        { signalName: 'orphan', filePath: '/a.gd', line: 50, context: '', target: 'self', handler: '_on_orphan', flags: [], isLambda: false },
      ]],
      ['used', [
        { signalName: 'used', filePath: '/d.gd', line: 60, context: '', target: 'self', handler: '_on_used', flags: [], isLambda: false },
      ]],
    ]),
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 4,
      signalCount: 4,
      emissionCount: 2,
      connectionCount: 2,
    },
  };

  return detector.detectUnused(graph).then(unused => {
    const stats = detector.getStats();

    console.log(`✓ Statistics tracked successfully`);
    console.log(`  Signals analyzed: ${stats.signalsAnalyzed}`);
    console.log(`  Orphans found: ${stats.orphansFound}`);
    console.log(`  Dead emitters found: ${stats.deadEmittersFound}`);
    console.log(`  Isolated found: ${stats.isolatedFound}`);
    console.log(`  Total unused: ${stats.totalUnused}`);
    console.log(`  Duration: ${stats.durationMs.toFixed(2)}ms`);
    console.log(`  Avg confidence: ${stats.avgConfidence.toFixed(2)}`);

    if (stats.signalsAnalyzed !== 4) {
      throw new Error(`Expected 4 signals analyzed, got ${stats.signalsAnalyzed}`);
    }

    if (stats.totalUnused !== 3) {
      throw new Error(`Expected 3 unused signals, got ${stats.totalUnused}`);
    }

    if (stats.orphansFound + stats.deadEmittersFound + stats.isolatedFound !== stats.totalUnused) {
      throw new Error('Pattern counts do not sum to total unused');
    }

    console.log('\n✅ Statistics tracking: PASSED');
    return true;
  });
}

/**
 * Run all validation tests
 */
async function runValidation() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  HOP 3.3: Unused Signal Detector Validation Suite         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await testOrphanDetection();
    await testDeadEmitterDetection();
    await testIsolatedDetection();
    await testConfidenceScoring();
    await testPerformance();
    await testStatistics();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ ALL VALIDATION TESTS PASSED                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ VALIDATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runValidation();
