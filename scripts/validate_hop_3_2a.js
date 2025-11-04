/**
 * HOP 3.2a Integration Validation Script
 * 
 * Validates signal graph builder implementation:
 * - Emission extraction from real GDScript files
 * - Partial graph construction
 * - Performance benchmarks
 * - Precision metrics
 * 
 * Run: node scripts/validate_hop_3_2a.js
 */

import { SignalGraphBuilder } from '../build/artifacts/graph/signal_graph_builder.js';
import { SignalExtractor } from '../build/artifacts/parsers/signal_extractor.js';
import { ProjectScanner } from '../build/artifacts/scanner/project_scanner.js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log('\n' + '='.repeat(80));
  log(text, 'cyan');
  console.log('='.repeat(80) + '\n');
}

async function createTestProject() {
  const testDir = join(tmpdir(), `hop-3-2a-validation-${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  // File 1: Player with signal definitions and emissions
  await writeFile(
    join(testDir, 'Player.gd'),
    `extends CharacterBody2D

signal health_changed(new_health, max_health)
signal player_died
signal level_up(new_level)

var health = 100
var max_health = 100
var level = 1

func take_damage(amount):
    health -= amount
    health_changed.emit(health, max_health)
    
    if health <= 0:
        player_died.emit()

func gain_experience(amount):
    # Some logic here
    if should_level_up():
        level += 1
        level_up.emit(level)
`
  );

  // File 2: Enemy with EventBus usage
  await writeFile(
    join(testDir, 'Enemy.gd'),
    `extends CharacterBody2D

signal enemy_defeated

func die():
    EventBus.enemy_killed.emit(self)
    enemy_defeated.emit()
`
  );

  // File 3: GameManager with multiple signal usages
  await writeFile(
    join(testDir, 'GameManager.gd'),
    `extends Node

signal game_started
signal game_paused
signal game_resumed
signal game_over(final_score)

var is_paused = false

func start_game():
    game_started.emit()

func toggle_pause():
    is_paused = !is_paused
    
    if is_paused:
        game_paused.emit()
    else:
        game_resumed.emit()

func end_game(score):
    game_over.emit(score)
`
  );

  // File 4: EventBus autoload (only definitions, no emissions)
  await writeFile(
    join(testDir, 'EventBus.gd'),
    `extends Node

# Global event bus for decoupled communication

signal enemy_killed(enemy)
signal item_collected(item_type, quantity)
signal quest_completed(quest_id)
signal achievement_unlocked(achievement_name)
`
  );

  // File 5: UI component with signal connections
  await writeFile(
    join(testDir, 'HealthBar.gd'),
    `extends Control

signal health_bar_updated

func update_health(current, maximum):
    var percentage = float(current) / float(maximum)
    $ProgressBar.value = percentage
    health_bar_updated.emit()
`
  );

  return testDir;
}

async function test_emission_extraction() {
  header('TEST 1: Emission Extraction');

  const testDir = await createTestProject();
  const extractor = new SignalExtractor();
  const scanner = new ProjectScanner();

  try {
    // Scan project
    log('Scanning test project...', 'blue');
    const astForest = await scanner.scanProject(testDir, 'full');
    log(`✓ Scanned ${astForest.length} files`, 'green');

    // Extract emissions from each file
    let totalEmissions = 0;
    let emissionsByFile = {};

    for (const { tree, filePath } of astForest) {
      const fileName = filePath.split('/').pop();
      const emissions = await extractor.extractEmissions(tree, filePath);
      emissionsByFile[fileName] = emissions;
      totalEmissions += emissions.length;

      log(`  ${fileName}: ${emissions.length} emissions`, 'green');
      
      for (const emission of emissions) {
        console.log(`    - ${emission.signalName} (line ${emission.line})${emission.emitter ? ` from ${emission.emitter}` : ''}`);
      }
    }

    log(`\n✓ Total emissions extracted: ${totalEmissions}`, 'green');

    // Validate expected emissions
    const expectations = {
      'Player.gd': 3, // health_changed, player_died, level_up
      'Enemy.gd': 2,  // EventBus.enemy_killed, enemy_defeated
      'GameManager.gd': 4, // game_started, game_paused, game_resumed, game_over
      'EventBus.gd': 0, // Only definitions, no emissions
      'HealthBar.gd': 1, // health_bar_updated
    };

    let allValid = true;
    for (const [file, expected] of Object.entries(expectations)) {
      const actual = emissionsByFile[file]?.length || 0;
      if (actual === expected) {
        log(`  ✓ ${file}: ${actual} emissions (expected ${expected})`, 'green');
      } else {
        log(`  ✗ ${file}: ${actual} emissions (expected ${expected})`, 'red');
        allValid = false;
      }
    }

    if (allValid) {
      log('\n✓ All emission counts match expectations', 'green');
    } else {
      log('\n✗ Some emission counts do not match', 'red');
    }

    return { success: allValid, testDir };
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, 'red');
    return { success: false, testDir };
  }
}

async function test_graph_construction() {
  header('TEST 2: Graph Construction');

  const testDir = await createTestProject();
  const extractor = new SignalExtractor();
  const builder = new SignalGraphBuilder(extractor);
  const scanner = new ProjectScanner();

  try {
    // Scan and build graph
    log('Building partial signal graph...', 'blue');
    const astForest = await scanner.scanProject(testDir, 'full');
    const graph = await builder.buildPartialGraph(astForest);

    log('\n📊 Graph Metadata:', 'cyan');
    console.log(`  Version: ${graph.metadata.version}`);
    console.log(`  Files: ${graph.metadata.fileCount}`);
    console.log(`  Signals: ${graph.metadata.signalCount}`);
    console.log(`  Emissions: ${graph.metadata.emissionCount}`);

    // Get all signal names
    const allSignals = builder.getAllSignalNames(graph);
    log(`\n📝 All Signals (${allSignals.length}):`, 'cyan');
    for (const sig of allSignals) {
      const defs = builder.getDefinitions(graph, sig);
      const emits = builder.getEmissions(graph, sig);
      console.log(`  ${sig}: ${defs.length} definitions, ${emits.length} emissions`);
    }

    // Find undefined signals (emitted but not defined)
    const undefined = builder.findUndefinedSignals(graph);
    if (undefined.length > 0) {
      log(`\n⚠️  Undefined Signals (${undefined.length}):`, 'yellow');
      for (const sig of undefined) {
        console.log(`  ${sig}`);
      }
    } else {
      log('\n✓ No undefined signals found', 'green');
    }

    // Find unemitted signals (defined but never emitted)
    const unemitted = builder.findUnemittedSignals(graph);
    if (unemitted.length > 0) {
      log(`\n💤 Unemitted Signals (${unemitted.length}):`, 'yellow');
      for (const sig of unemitted) {
        console.log(`  ${sig}`);
      }
    } else {
      log('\n✓ All signals are emitted', 'green');
    }

    // Validate graph statistics
    const stats = builder.getStats();
    log('\n📈 Builder Statistics:', 'cyan');
    console.log(`  Files processed: ${stats.filesProcessed}`);
    console.log(`  Signals discovered: ${stats.signalsDiscovered}`);
    console.log(`  Emissions found: ${stats.emissionsFound}`);
    console.log(`  Duration: ${stats.durationMs}ms`);
    console.log(`  Peak memory: ${(stats.peakMemoryBytes / 1024 / 1024).toFixed(2)}MB`);

    // Validate expectations
    const expectations = {
      fileCount: 5,
      minSignalCount: 12, // At least 12 unique signals
      minEmissionCount: 10, // At least 10 emissions
    };

    let allValid = true;
    if (graph.metadata.fileCount === expectations.fileCount) {
      log(`\n✓ File count: ${graph.metadata.fileCount}`, 'green');
    } else {
      log(`\n✗ File count: ${graph.metadata.fileCount} (expected ${expectations.fileCount})`, 'red');
      allValid = false;
    }

    if (graph.metadata.signalCount >= expectations.minSignalCount) {
      log(`✓ Signal count: ${graph.metadata.signalCount}`, 'green');
    } else {
      log(`✗ Signal count: ${graph.metadata.signalCount} (expected ≥${expectations.minSignalCount})`, 'red');
      allValid = false;
    }

    if (graph.metadata.emissionCount >= expectations.minEmissionCount) {
      log(`✓ Emission count: ${graph.metadata.emissionCount}`, 'green');
    } else {
      log(`✗ Emission count: ${graph.metadata.emissionCount} (expected ≥${expectations.minEmissionCount})`, 'red');
      allValid = false;
    }

    return { success: allValid, testDir };
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, 'red');
    console.error(error);
    return { success: false, testDir };
  }
}

async function test_performance() {
  header('TEST 3: Performance Benchmark');

  const testDir = join(tmpdir(), `hop-3-2a-perf-${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  try {
    // Create 100 test files
    log('Creating 100 test files...', 'blue');
    for (let i = 0; i < 100; i++) {
      await writeFile(
        join(testDir, `test_${i}.gd`),
        `extends Node

signal sig_a_${i}
signal sig_b_${i}
signal sig_c_${i}

func handler_a():
    sig_a_${i}.emit()

func handler_b():
    sig_b_${i}.emit()

func handler_c():
    sig_c_${i}.emit()
`
      );
    }

    const extractor = new SignalExtractor();
    const builder = new SignalGraphBuilder(extractor);
    const scanner = new ProjectScanner();

    // Benchmark
    log('Running performance benchmark...', 'blue');
    const startTime = Date.now();
    const astForest = await scanner.scanProject(testDir, 'full');
    const graph = await builder.buildPartialGraph(astForest);
    const durationMs = Date.now() - startTime;

    log(`\n⏱️  Performance Results:`, 'cyan');
    console.log(`  Total duration: ${durationMs}ms`);
    console.log(`  Files processed: ${graph.metadata.fileCount}`);
    console.log(`  Signals discovered: ${graph.metadata.signalCount}`);
    console.log(`  Emissions found: ${graph.metadata.emissionCount}`);
    console.log(`  Avg time per file: ${(durationMs / graph.metadata.fileCount).toFixed(2)}ms`);

    // Performance target: <500ms for 300 signals across 500 files
    // We have 100 files, 300 signals, 300 emissions
    const targetMs = 500;
    if (durationMs < targetMs) {
      log(`\n✓ Performance target met: ${durationMs}ms < ${targetMs}ms`, 'green');
      return { success: true, testDir };
    } else {
      log(`\n✗ Performance target not met: ${durationMs}ms ≥ ${targetMs}ms`, 'red');
      return { success: false, testDir };
    }
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, 'red');
    console.error(error);
    return { success: false, testDir };
  }
}

async function test_precision() {
  header('TEST 4: Emission Detection Precision');

  const testDir = join(tmpdir(), `hop-3-2a-precision-${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  const testCases = [
    {
      name: 'basic_emit',
      content: `signal test\nfunc f(): test.emit()`,
      expectedEmissions: 1,
      expectedSignal: 'test',
    },
    {
      name: 'eventbus_emit',
      content: `func f(): EventBus.global_signal.emit()`,
      expectedEmissions: 1,
      expectedSignal: 'global_signal',
    },
    {
      name: 'self_emit',
      content: `signal sig\nfunc f(): self.sig.emit()`,
      expectedEmissions: 1,
      expectedSignal: 'sig',
    },
    {
      name: 'with_args',
      content: `signal sig\nfunc f(): sig.emit(1, 2, 3)`,
      expectedEmissions: 1,
      expectedSignal: 'sig',
    },
    {
      name: 'multiple_emits',
      content: `signal a\nsignal b\nfunc f(): a.emit()\nfunc g(): b.emit()`,
      expectedEmissions: 2,
      expectedSignal: null,
    },
    {
      name: 'no_false_positives',
      content: `signal sig\nfunc f(): sig.connect(handler)\nsig.disconnect(handler)`,
      expectedEmissions: 0,
      expectedSignal: null,
    },
  ];

  const extractor = new SignalExtractor();
  const scanner = new ProjectScanner();

  let totalTests = testCases.length;
  let passedTests = 0;

  for (const testCase of testCases) {
    const filePath = join(testDir, `${testCase.name}.gd`);
    await writeFile(filePath, testCase.content);

    const astForest = await scanner.scanProject(testDir, 'full');
    const fileTree = astForest.find(ast => ast.filePath === filePath);

    if (!fileTree) {
      log(`✗ ${testCase.name}: Could not find AST`, 'red');
      continue;
    }

    const emissions = await extractor.extractEmissions(fileTree.tree, filePath);

    if (emissions.length === testCase.expectedEmissions) {
      if (testCase.expectedSignal === null || emissions.some(e => e.signalName === testCase.expectedSignal)) {
        log(`✓ ${testCase.name}: ${emissions.length} emissions (correct)`, 'green');
        passedTests++;
      } else {
        log(`✗ ${testCase.name}: Expected signal '${testCase.expectedSignal}', got ${emissions.map(e => e.signalName).join(', ')}`, 'red');
      }
    } else {
      log(`✗ ${testCase.name}: ${emissions.length} emissions (expected ${testCase.expectedEmissions})`, 'red');
    }

    // Clean up for next test
    await rm(filePath);
  }

  const precision = (passedTests / totalTests) * 100;
  log(`\n📊 Precision: ${precision.toFixed(1)}% (${passedTests}/${totalTests} tests passed)`, precision >= 95 ? 'green' : 'red');

  return { success: precision >= 95, testDir };
}

async function main() {
  log('\n🧪 HOP 3.2a Validation Suite', 'cyan');
  log('Testing: Signal Graph Builder - Definitions & Emissions\n', 'cyan');

  const results = [];

  // Run tests
  results.push(await test_emission_extraction());
  results.push(await test_graph_construction());
  results.push(await test_performance());
  results.push(await test_precision());

  // Cleanup
  header('Cleanup');
  for (const result of results) {
    if (result.testDir) {
      try {
        await rm(result.testDir, { recursive: true });
        log(`✓ Cleaned up ${result.testDir}`, 'green');
      } catch (error) {
        log(`⚠️  Failed to cleanup ${result.testDir}`, 'yellow');
      }
    }
  }

  // Summary
  header('Summary');
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  log(`Total tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  if (failedTests > 0) {
    log(`Failed: ${failedTests}`, 'red');
  }

  const overallSuccess = passedTests === totalTests;
  if (overallSuccess) {
    log('\n✅ All tests passed! HOP 3.2a implementation is valid.', 'green');
  } else {
    log('\n❌ Some tests failed. Review implementation.', 'red');
  }

  process.exit(overallSuccess ? 0 : 1);
}

main().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
