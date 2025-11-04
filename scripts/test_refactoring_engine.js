#!/usr/bin/env node
/**
 * Integration Test for Refactoring Engine
 * 
 * Simple end-to-end test to verify refactoring suggestions work.
 */

import { RefactoringEngine } from '../build/artifacts/refactoring/suggestion_engine.js';
import { RefactorType } from '../build/artifacts/refactoring/types.js';

async function main() {
  console.log('Testing Refactoring Engine...\n');

  const engine = new RefactoringEngine();

  // Create test graph with both similarity and naming issues
  const graph = {
    definitions: new Map([
      // Similarity: health_changed vs health_change (distance 1)
      ['health_changed', [
        { name: 'health_changed', params: [], filePath: '/player.gd', line: 5, source: 'player' },
      ]],
      ['health_change', [
        { name: 'health_change', params: [], filePath: '/player.gd', line: 10, source: 'player' },
      ]],
      
      // Similarity: player_died vs player_dead (distance 2)
      ['player_died', [
        { name: 'player_died', params: [], filePath: '/player.gd', line: 15, source: 'player' },
      ]],
      ['player_dead', [
        { name: 'player_dead', params: [], filePath: '/player.gd', line: 20, source: 'player' },
      ]],
      
      // Naming violation: camelCase
      ['healthChanged', [
        { name: 'healthChanged', params: [], filePath: '/enemy.gd', line: 5, source: 'enemy' },
      ]],
      
      // Naming violation: PascalCase
      ['PlayerDied', [
        { name: 'PlayerDied', params: [], filePath: '/enemy.gd', line: 10, source: 'enemy' },
      ]],
      
      // Valid signal (no suggestions)
      ['on_button_pressed', [
        { name: 'on_button_pressed', params: [], filePath: '/ui.gd', line: 5, source: 'ui' },
      ]],
    ]),
    emissions: new Map(),
    connections: new Map(),
    metadata: {
      version: '3.0.0',
      timestamp: Date.now(),
      fileCount: 3,
      signalCount: 7,
      emissionCount: 0,
      connectionCount: 0,
    },
  };

  const suggestions = await engine.generateSuggestions(graph);
  const stats = engine.getStats();

  console.log(`Generated ${suggestions.length} suggestions:\n`);

  // Group by type
  const mergeSuggestions = suggestions.filter(s => s.type === RefactorType.Merge);
  const renameSuggestions = suggestions.filter(s => s.type === RefactorType.Rename);

  if (mergeSuggestions.length > 0) {
    console.log('Merge Suggestions (Similar Names):');
    mergeSuggestions.forEach(s => {
      console.log(`  - ${s.target} → ${s.replacement}`);
      console.log(`    Distance: ${s.distance}, Confidence: ${(s.confidence * 100).toFixed(0)}%`);
      console.log(`    Reason: ${s.reason}`);
    });
    console.log();
  }

  if (renameSuggestions.length > 0) {
    console.log('Rename Suggestions (Naming Conventions):');
    renameSuggestions.forEach(s => {
      console.log(`  - ${s.target} → ${s.replacement}`);
      console.log(`    Confidence: ${(s.confidence * 100).toFixed(0)}%`);
      console.log(`    Reason: ${s.reason}`);
    });
    console.log();
  }

  console.log('Statistics:');
  console.log(`  Total suggestions: ${stats.totalSuggestions}`);
  console.log(`  Merge suggestions: ${stats.mergeSuggestions}`);
  console.log(`  Rename suggestions: ${stats.renameSuggestions}`);
  console.log(`  Duration: ${stats.durationMs.toFixed(2)}ms`);
  console.log(`  Avg confidence: ${(stats.avgConfidence * 100).toFixed(0)}%`);
  console.log();
  console.log('Similarity Stats:');
  console.log(`  Signals analyzed: ${stats.similarityStats.signalsAnalyzed}`);
  console.log(`  Comparisons performed: ${stats.similarityStats.comparisonsPerformed}`);
  console.log(`  Comparisons skipped: ${stats.similarityStats.comparisonsSkipped}`);
  console.log(`  Similar pairs found: ${stats.similarityStats.similarPairsFound}`);

  // Verify results
  if (suggestions.length < 4) {
    throw new Error(`Expected at least 4 suggestions, got ${suggestions.length}`);
  }

  const healthMerge = suggestions.find(
    s => s.type === RefactorType.Merge && 
         (s.target === 'health_changed' || s.target === 'health_change')
  );
  if (!healthMerge || healthMerge.distance !== 1) {
    throw new Error('health_changed/health_change merge not detected');
  }

  const playerMerge = suggestions.find(
    s => s.type === RefactorType.Merge && 
         (s.target === 'player_died' || s.target === 'player_dead')
  );
  if (!playerMerge || playerMerge.distance !== 2) {
    throw new Error('player_died/player_dead merge not detected');
  }

  const camelRename = suggestions.find(
    s => s.type === RefactorType.Rename && s.target === 'healthChanged'
  );
  if (!camelRename || camelRename.replacement !== 'health_changed') {
    throw new Error('healthChanged rename not detected');
  }

  const pascalRename = suggestions.find(
    s => s.type === RefactorType.Rename && s.target === 'PlayerDied'
  );
  if (!pascalRename || pascalRename.replacement !== 'player_died') {
    throw new Error('PlayerDied rename not detected');
  }

  // Verify confidence threshold
  const lowConfidence = suggestions.find(s => s.confidence < 0.98);
  if (lowConfidence) {
    throw new Error(`Found suggestion with confidence < 0.98: ${lowConfidence.confidence}`);
  }

  console.log('\n✅ All tests passed!');
}

main().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
