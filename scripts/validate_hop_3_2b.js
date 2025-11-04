/**
 * HOP 3.2b Integration Validation Script
 * 
 * Validates complete signal graph construction:
 * - Connection extraction from real GDScript files
 * - Full graph construction (definitions + emissions + connections)
 * - Graph serialization/deserialization
 * - Performance benchmarks
 * 
 * Run: node scripts/validate_hop_3_2b.js
 */

import { SignalGraphBuilder } from '../build/artifacts/graph/signal_graph_builder.js';
import { GraphSerializer } from '../build/artifacts/graph/graph_serializer.js';
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
  const testDir = join(tmpdir(), `hop-3-2b-validation-${Date.now()}`);
  await mkdir(testDir, { recursive: true});

  // File 1: Player with definitions, emissions, AND connections
  await writeFile(
    join(testDir, 'Player.gd'),
    `extends CharacterBody2D

signal health_changed(new_health, max_health)
signal player_died
signal level_up(new_level)

var health = 100
var max_health = 100
var level = 1

func _ready():
    # Connect to own signals
    player_died.connect(self, "_on_died")
    level_up.connect(lambda new_lvl: print("Leveled up to ", new_lvl))

func take_damage(amount):
    health -= amount
    health_changed.emit(health, max_health)
    
    if health <= 0:
        player_died.emit()

func _on_died():
    print("Player died!")
`
  );

  // File 2: UI with external connections
  await writeFile(
    join(testDir, 'HealthBar.gd'),
    `extends Control

func _ready():
    # Connect to player signals
    var player = get_node("/root/Player")
    player.health_changed.connect(self, "_on_health_changed")
    player.player_died.connect(Callable(self, "_on_player_died"))

func _on_health_changed(current, maximum):
    var percentage = float(current) / float(maximum)
    $ProgressBar.value = percentage

func _on_player_died():
    $DeathOverlay.visible = true
`
  );

  // File 3: GameManager with EventBus connections
  await writeFile(
    join(testDir, 'GameManager.gd'),
    `extends Node

signal game_paused
signal game_resumed

func _ready():
    # Connect to EventBus
    EventBus.player_died.connect(self, "_on_player_died")
    EventBus.game_over.connect(lambda score: print("Final score: ", score))
    
    # Connect own signals
    game_paused.connect(self, "_on_paused", CONNECT_ONE_SHOT)

func _on_player_died():
    get_tree().reload_current_scene()

func _on_paused():
    get_tree().paused = true

func pause_game():
    game_paused.emit()
`
  );

  return testDir;
}

async function test_connection_extraction() {
  header('TEST 1: Connection Extraction');

  const testDir = await createTestProject();
  const extractor = new SignalExtractor();
  const scanner = new ProjectScanner();

  try {
    log('Scanning test project...', 'blue');
    const astForest = await scanner.scanProject(testDir, 'full');
    log(`✓ Scanned ${astForest.length} files`, 'green');

    let totalConnections = 0;
    let connectionsByFile = {};

    for (const { tree, filePath } of astForest) {
      const fileName = filePath.split('/').pop();
      const connections = await extractor.extractConnections(tree, filePath);
      connectionsByFile[fileName] = connections;
      totalConnections += connections.length;

      log(`  ${fileName}: ${connections.length} connections`, 'green');
      
      for (const conn of connections) {
        const lambdaFlag = conn.isLambda ? ' (lambda)' : '';
        const targetFlag = conn.target ? ` from ${conn.target}` : '';
        console.log(`    - ${conn.signalName}.connect(${conn.handler})${lambdaFlag}${targetFlag}`);
      }
    }

    log(`\n✓ Total connections extracted: ${totalConnections}`, 'green');

    // Validate expected connections
    const expectations = {
      'Player.gd': 2,      // player_died.connect, level_up.connect
      'HealthBar.gd': 2,   // health_changed.connect, player_died.connect
      'GameManager.gd': 3, // EventBus.player_died, EventBus.game_over, game_paused
    };

    let allValid = true;
    for (const [file, expected] of Object.entries(expectations)) {
      const actual = connectionsByFile[file]?.length || 0;
      if (actual === expected) {
        log(`  ✓ ${file}: ${actual} connections (expected ${expected})`, 'green');
      } else {
        log(`  ✗ ${file}: ${actual} connections (expected ${expected})`, 'red');
        allValid = false;
      }
    }

    // Check for lambda detection
    const hasLambda = Object.values(connectionsByFile).some(
      conns => conns.some(c => c.isLambda)
    );
    if (hasLambda) {
      log('✓ Lambda connections detected', 'green');
    } else {
      log('✗ No lambda connections detected', 'red');
      allValid = false;
    }

    // Check for Callable detection
    const playerConnections = connectionsByFile['HealthBar.gd'] || [];
    const hasCallable = playerConnections.some(c => c.handler === '_on_player_died');
    if (hasCallable) {
      log('✓ Callable connections detected', 'green');
    } else {
      log('✗ No Callable connections detected', 'red');
      allValid = false;
    }

    return { success: allValid, testDir };
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, 'red');
    console.error(error);
    return { success: false, testDir };
  }
}

async function test_full_graph_construction() {
  header('TEST 2: Full Graph Construction');

  const testDir = await createTestProject();
  const extractor = new SignalExtractor();
  const builder = new SignalGraphBuilder(extractor);
  const scanner = new ProjectScanner();

  try {
    log('Building full signal graph...', 'blue');
    const astForest = await scanner.scanProject(testDir, 'full');
    const graph = await builder.buildFullGraph(astForest);

    log('\n📊 Graph Metadata:', 'cyan');
    console.log(`  Version: ${graph.metadata.version}`);
    console.log(`  Files: ${graph.metadata.fileCount}`);
    console.log(`  Signals: ${graph.metadata.signalCount}`);
    console.log(`  Emissions: ${graph.metadata.emissionCount}`);
    console.log(`  Connections: ${graph.metadata.connectionCount}`);

    // Verify all three components
    log('\n📈 Graph Components:', 'cyan');
    console.log(`  Definitions: ${graph.definitions.size} signals`);
    console.log(`  Emissions: ${graph.emissions.size} signals`);
    console.log(`  Connections: ${graph.connections.size} signals`);

    // Get all signal names
    const allSignals = builder.getAllSignalNames(graph);
    log(`\n📝 All Signals (${allSignals.length}):`, 'cyan');
    for (const sig of allSignals) {
      const defs = builder.getDefinitions(graph, sig);
      const emits = builder.getEmissions(graph, sig);
      const conns = builder.getConnections(graph, sig);
      console.log(`  ${sig}: ${defs.length} defs, ${emits.length} emits, ${conns.length} conns`);
    }

    // Validate expectations
    const expectations = {
      minSignalCount: 5,
      minEmissionCount: 3,
      minConnectionCount: 7,
    };

    let allValid = true;
    if (graph.metadata.signalCount >= expectations.minSignalCount) {
      log(`\n✓ Signal count: ${graph.metadata.signalCount}`, 'green');
    } else {
      log(`\n✗ Signal count: ${graph.metadata.signalCount} (expected ≥${expectations.minSignalCount})`, 'red');
      allValid = false;
    }

    if (graph.metadata.emissionCount >= expectations.minEmissionCount) {
      log(`✓ Emission count: ${graph.metadata.emissionCount}`, 'green');
    } else {
      log(`✗ Emission count: ${graph.metadata.emissionCount} (expected ≥${expectations.minEmissionCount})`, 'red');
      allValid = false;
    }

    if (graph.metadata.connectionCount >= expectations.minConnectionCount) {
      log(`✓ Connection count: ${graph.metadata.connectionCount}`, 'green');
    } else {
      log(`✗ Connection count: ${graph.metadata.connectionCount} (expected ≥${expectations.minConnectionCount})`, 'red');
      allValid = false;
    }

    return { success: allValid, testDir, graph };
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, 'red');
    console.error(error);
    return { success: false, testDir };
  }
}

async function test_graph_serialization(graphFromTest2) {
  header('TEST 3: Graph Serialization');

  if (!graphFromTest2) {
    log('✗ Skipping (no graph from test 2)', 'yellow');
    return { success: false };
  }

  const serializer = new GraphSerializer();
  const testDir = join(tmpdir(), `hop-3-2b-serialization-${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  try {
    const cachePath = join(testDir, 'signal_graph_cache.json');

    // Serialize
    log('Serializing graph to JSON...', 'blue');
    await serializer.save(graphFromTest2.graph, cachePath);
    log(`✓ Saved to ${cachePath}`, 'green');

    // Get cache stats
    const stats = await serializer.getStats(cachePath);
    log(`  Cache size: ${(stats.sizeBytes / 1024).toFixed(2)} KB`, 'cyan');

    // Deserialize
    log('\nDeserializing graph from JSON...', 'blue');
    const loadedGraph = await serializer.load(cachePath);

    if (!loadedGraph) {
      log('✗ Failed to load graph', 'red');
      return { success: false, testDir };
    }

    log('✓ Graph loaded successfully', 'green');

    // Verify data integrity
    const checks = [
      { name: 'Signal count', original: graphFromTest2.graph.metadata.signalCount, loaded: loadedGraph.metadata.signalCount },
      { name: 'Emission count', original: graphFromTest2.graph.metadata.emissionCount, loaded: loadedGraph.metadata.emissionCount },
      { name: 'Connection count', original: graphFromTest2.graph.metadata.connectionCount, loaded: loadedGraph.metadata.connectionCount },
      { name: 'Definition map size', original: graphFromTest2.graph.definitions.size, loaded: loadedGraph.definitions.size },
      { name: 'Emission map size', original: graphFromTest2.graph.emissions.size, loaded: loadedGraph.emissions.size },
      { name: 'Connection map size', original: graphFromTest2.graph.connections.size, loaded: loadedGraph.connections.size },
    ];

    log('\n🔍 Data Integrity Checks:', 'cyan');
    let allValid = true;
    for (const check of checks) {
      if (check.original === check.loaded) {
        log(`  ✓ ${check.name}: ${check.loaded}`, 'green');
      } else {
        log(`  ✗ ${check.name}: ${check.loaded} (expected ${check.original})`, 'red');
        allValid = false;
      }
    }

    return { success: allValid, testDir };
  } catch (error) {
    log(`✗ Test failed: ${error.message}`, 'red');
    console.error(error);
    return { success: false, testDir };
  }
}

async function test_performance() {
  header('TEST 4: Performance Benchmark');

  const testDir = join(tmpdir(), `hop-3-2b-perf-${Date.now()}`);
  await mkdir(testDir, { recursive: true });

  try {
    log('Creating 100 test files...', 'blue');
    for (let i = 0; i < 100; i++) {
      await writeFile(
        join(testDir, `test_${i}.gd`),
        `extends Node

signal sig_a_${i}
signal sig_b_${i}

func _ready():
    sig_a_${i}.connect(self, "handler_a_${i}")
    sig_b_${i}.connect(lambda: print("Lambda ${i}"))

func trigger():
    sig_a_${i}.emit()
    sig_b_${i}.emit()

func handler_a_${i}():
    pass
`
      );
    }

    const extractor = new SignalExtractor();
    const builder = new SignalGraphBuilder(extractor);
    const scanner = new ProjectScanner();

    log('Running performance benchmark...', 'blue');
    const startTime = Date.now();
    const astForest = await scanner.scanProject(testDir, 'full');
    const graph = await builder.buildFullGraph(astForest);
    const durationMs = Date.now() - startTime;

    log(`\n⏱️  Performance Results:`, 'cyan');
    console.log(`  Total duration: ${durationMs}ms`);
    console.log(`  Files processed: ${graph.metadata.fileCount}`);
    console.log(`  Signals discovered: ${graph.metadata.signalCount}`);
    console.log(`  Emissions found: ${graph.metadata.emissionCount}`);
    console.log(`  Connections found: ${graph.metadata.connectionCount}`);
    console.log(`  Avg time per file: ${(durationMs / graph.metadata.fileCount).toFixed(2)}ms`);

    // Performance target: <1s for 100 files with full graph
    const targetMs = 1000;
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

async function main() {
  log('\n🧪 HOP 3.2b Validation Suite', 'cyan');
  log('Testing: Signal Graph Builder - Connections\n', 'cyan');

  const results = [];

  // Run tests
  results.push(await test_connection_extraction());
  const test2Result = await test_full_graph_construction();
  results.push(test2Result);
  results.push(await test_graph_serialization(test2Result));
  results.push(await test_performance());

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
    log('\n✅ All tests passed! HOP 3.2b implementation is valid.', 'green');
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
