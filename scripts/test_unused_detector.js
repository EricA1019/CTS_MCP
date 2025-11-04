/**
 * Integration Test for Unused Detector
 * 
 * Simple end-to-end test to verify unused detection works.
 */

import { UnusedDetector } from '../build/artifacts/analysis/unused_detector.js';
import { UnusedPattern } from '../build/artifacts/analysis/types.js';

async function main() {
  console.log('Testing Unused Detector...\n');

  const detector = new UnusedDetector();

  // Create test graph with all three patterns
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

  const unused = await detector.detectUnused(graph);
  const stats = detector.getStats();

  console.log(`Found ${unused.length} unused signals:\n`);

  unused.forEach(u => {
    console.log(`- ${u.signalName}:`);
    console.log(`  Pattern: ${u.pattern}`);
    console.log(`  Confidence: ${(u.confidence * 100).toFixed(0)}%`);
    console.log(`  Reason: ${u.reason}`);
    console.log(`  Locations: ${u.locations.length}`);
    console.log();
  });

  console.log('Statistics:');
  console.log(`- Signals analyzed: ${stats.signalsAnalyzed}`);
  console.log(`- Orphans found: ${stats.orphansFound}`);
  console.log(`- Dead emitters found: ${stats.deadEmittersFound}`);
  console.log(`- Isolated found: ${stats.isolatedFound}`);
  console.log(`- Total unused: ${stats.totalUnused}`);
  console.log(`- Duration: ${stats.durationMs.toFixed(2)}ms`);
  console.log(`- Avg confidence: ${(stats.avgConfidence * 100).toFixed(0)}%`);

  // Verify results
  if (unused.length !== 3) {
    throw new Error(`Expected 3 unused, got ${unused.length}`);
  }

  const orphan = unused.find(u => u.signalName === 'orphan');
  const dead = unused.find(u => u.signalName === 'dead');
  const isolated = unused.find(u => u.signalName === 'isolated');

  if (!orphan || orphan.pattern !== UnusedPattern.Orphan) {
    throw new Error('Orphan signal not detected correctly');
  }

  if (!dead || dead.pattern !== UnusedPattern.DeadEmitter) {
    throw new Error('Dead emitter not detected correctly');
  }

  if (!isolated || isolated.pattern !== UnusedPattern.Isolated) {
    throw new Error('Isolated signal not detected correctly');
  }

  console.log('\n✅ All tests passed!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
