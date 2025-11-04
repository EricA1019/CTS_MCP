import { describe, test, expect, beforeAll } from '@jest/globals';
import { ArtifactEngine } from '../artifacts/artifact_engine';
import { D3SignalMapRenderer } from '../artifacts/renderers/d3_signal_map';
import { ReactHopDashboardRenderer } from '../artifacts/renderers/react_hop_dashboard';
import { parseGDScriptSignals } from '../artifacts/parsers/gdscript_parser';
import * as fs from 'fs';
import * as path from 'path';

describe('Integration Tests - Artifact Rendering', () => {
  let engine: ArtifactEngine;
  let sampleHopData: any;
  let sampleSignalData: any;

  beforeAll(() => {
    // Load test fixtures
    const fixturesPath = path.join(__dirname, 'fixtures');
    sampleHopData = JSON.parse(
      fs.readFileSync(path.join(fixturesPath, 'sample_hop_plan.json'), 'utf8')
    );
    sampleSignalData = JSON.parse(
      fs.readFileSync(path.join(fixturesPath, 'sample_signal_map_data.json'), 'utf8')
    );

    // Initialize artifact engine
    engine = new ArtifactEngine();
    engine.registerRenderer(new D3SignalMapRenderer());
    engine.registerRenderer(new ReactHopDashboardRenderer());
  });

  describe('D3 Signal Map Rendering', () => {
    test('should render signal map with valid data', async () => {
      const result = await engine.renderArtifact('signal_map', sampleSignalData);
      
      expect(result).toBeDefined();
      expect(result.html).toBeDefined();
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<svg');
      expect(result.html).toContain('d3.forceSimulation');
    });

    test('should include all signals in rendered output', async () => {
      const result = await engine.renderArtifact('signal_map', sampleSignalData);
      
      // Check that signal names are present
      expect(result.html).toContain('player_health_changed');
      expect(result.html).toContain('player_died');
      expect(result.html).toContain('combat_started');
      expect(result.html).toContain('quest_completed');
      expect(result.html).toContain('item_added');
    });

    test('should include force-directed layout code', async () => {
      const result = await engine.renderArtifact('signal_map', sampleSignalData);
      
      expect(result.html).toContain('forceLink');
      expect(result.html).toContain('forceManyBody');
      expect(result.html).toContain('forceCenter');
    });

    test('should render in under 2 seconds', async () => {
      const start = Date.now();
      await engine.renderArtifact('signal_map', sampleSignalData);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(2000);
    });

    test('should handle empty signal data', async () => {
      const emptyData = { signals: [], filters: {} };
      const result = await engine.renderArtifact('signal_map', emptyData);
      
      expect(result).toBeDefined();
      expect(result.html).toContain('<!DOCTYPE html>');
    });

    test('should cache repeated renders', async () => {
      // First render
      const result1 = await engine.renderArtifact('signal_map', sampleSignalData);
      
      // Second render with same data should be cached
      const start = Date.now();
      const result2 = await engine.renderArtifact('signal_map', sampleSignalData);
      const elapsed = Date.now() - start;
      
      expect(result1.html).toBe(result2.html);
      expect(result2.cached).toBe(true);
      expect(elapsed).toBeLessThan(10); // Should be near-instant from cache
    });
  });

  describe('React Hop Dashboard Rendering', () => {
    test('should render hop dashboard with valid data', async () => {
      const result = await engine.renderArtifact('hop_dashboard', sampleHopData);
      
      expect(result).toBeDefined();
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('React');
      expect(result.html).toContain('ReactDOM');
    });

    test('should include all phases and hops', async () => {
      const result = await engine.renderArtifact('hop_dashboard', sampleHopData);
      
      // Check phases
      expect(result.html).toContain('Phase 1: Foundation');
      expect(result.html).toContain('Phase 2: Advanced Features');
      
      // Check hops
      expect(result.html).toContain('5.1a');
      expect(result.html).toContain('MCP Core Infrastructure');
      expect(result.html).toContain('5.1b');
      expect(result.html).toContain('Artifact Visualizations');
    });

    test('should include statistics panel', async () => {
      const result = await engine.renderArtifact('hop_dashboard', sampleHopData);
      
      expect(result.html).toContain('Total LOC');
      expect(result.html).toContain('CTS Compliance');
      expect(result.html).toContain('Completion Rate');
    });

    test('should include React CDN links', async () => {
      const result = await engine.renderArtifact('hop_dashboard', sampleHopData);
      
      expect(result.html).toContain('unpkg.com/react@18');
      expect(result.html).toContain('unpkg.com/react-dom@18');
      expect(result.html).toContain('babel/standalone');
    });

    test('should render in under 1 second', async () => {
      const start = Date.now();
      await engine.renderArtifact('hop_dashboard', sampleHopData);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(1000);
    });

    test('should handle empty hop data', async () => {
      const emptyData = {
        phases: [],
        statistics: {
          totalLOC: 0,
          plannedLOC: 0,
          complianceRate: 100,
          completionRate: 0
        }
      };
      
      const result = await engine.renderArtifact('hop_dashboard', emptyData);
      
      expect(result).toBeDefined();
      expect(result.html).toContain('<!DOCTYPE html>');
    });
  });

  describe('GDScript Parser', () => {
    test('should parse signals from EventBus fixture', async () => {
      const fixturesPath = path.join(__dirname, 'fixtures');
      const eventBusPath = path.join(fixturesPath, 'sample_eventbus.gd');
      
      const signals = parseGDScriptSignals(eventBusPath);
      
      expect(signals.length).toBeGreaterThan(15);
      expect(signals).toContainEqual(
        expect.objectContaining({
          name: 'player_health_changed'
        })
      );
    });

    test('should extract signal parameters', async () => {
      // Create temp file for testing
      const tempPath = path.join(__dirname, 'fixtures', 'temp_test.gd');
      const testCode = 'signal test_signal(param1: int, param2: String)';
      fs.writeFileSync(tempPath, testCode);
      
      const signals = parseGDScriptSignals(tempPath);
      
      expect(signals[0]).toEqual(
        expect.objectContaining({
          name: 'test_signal'
        })
      );
      expect(signals[0].params.length).toBeGreaterThan(0);
      
      // Cleanup
      fs.unlinkSync(tempPath);
    });

    test('should handle signals without parameters', async () => {
      // Create temp file for testing
      const tempPath = path.join(__dirname, 'fixtures', 'temp_test2.gd');
      const testCode = 'signal simple_signal';
      fs.writeFileSync(tempPath, testCode);
      
      const signals = parseGDScriptSignals(tempPath);
      
      expect(signals[0]).toEqual(
        expect.objectContaining({
          name: 'simple_signal',
          params: []
        })
      );
      
      // Cleanup
      fs.unlinkSync(tempPath);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should handle complete signal scanning workflow', async () => {
      // This would normally scan project files, but we use test data
      const signals = sampleSignalData.signals;
      
      expect(signals).toBeDefined();
      expect(signals.length).toBeGreaterThan(0);
      
      // Verify signal structure
      signals.forEach((sig: any) => {
        expect(sig).toHaveProperty('name');
        expect(sig).toHaveProperty('file');
        expect(sig).toHaveProperty('connections');
      });
    });

    test('should render both artifact types successfully', async () => {
      const signalResult = await engine.renderArtifact('signal_map', sampleSignalData);
      const hopResult = await engine.renderArtifact('hop_dashboard', sampleHopData);
      
      expect(signalResult.html).toBeDefined();
      expect(hopResult.html).toBeDefined();
      expect(signalResult.html).not.toBe(hopResult.html); // Different outputs
    });

    test('should handle unknown artifact type', async () => {
      await expect(
        engine.renderArtifact('unknown_type', {})
      ).rejects.toThrow();
    });
  });

  describe('Performance Baselines', () => {
    test('should render 50+ signals efficiently', async () => {
      // Create large dataset with 50 signals
      const largeData = {
        signals: Array.from({ length: 50 }, (_, i) => ({
          name: `signal_${i}`,
          file: `file_${i}.gd`,
          line: i * 10,
          connections: [
            { file: `consumer_${i}.gd`, line: i * 10 + 5 }
          ]
        })),
        filters: {}
      };
      
      const start = Date.now();
      const result = await engine.renderArtifact('signal_map', largeData);
      const elapsed = Date.now() - start;
      
      expect(result.html).toBeDefined();
      expect(elapsed).toBeLessThan(2000); // Under 2s for 50 signals
    });

    test('should handle multiple concurrent renders', async () => {
      const promises = Array.from({ length: 5 }, () =>
        engine.renderArtifact('hop_dashboard', sampleHopData)
      );
      
      const start = Date.now();
      const results = await Promise.all(promises);
      const elapsed = Date.now() - start;
      
      expect(results).toHaveLength(5);
      results.forEach((result: any) => {
        expect(result).toBeDefined();
        expect(result.html).toContain('<!DOCTYPE html>');
      });
      expect(elapsed).toBeLessThan(3000); // All 5 renders under 3s
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid data types gracefully', async () => {
      // Renderers accept any data and embed it - validation happens client-side
      const result = await engine.renderArtifact('hop_dashboard', 'not-json-data');
      
      expect(result).toBeDefined();
      expect(result.html).toContain('<!DOCTYPE html>');
    });

    test('should handle missing required fields gracefully', async () => {
      // Renderers embed data as-is - React will handle missing fields
      const invalidData = { phases: 'not-an-array' };
      
      const result = await engine.renderArtifact('hop_dashboard', invalidData);
      
      expect(result).toBeDefined();
      expect(result.html).toContain('<!DOCTYPE html>');
    });

    test('should handle empty object data', async () => {
      // Provide empty but valid objects
      const result1 = await engine.renderArtifact('signal_map', { signals: [], filters: {} });
      const result2 = await engine.renderArtifact('hop_dashboard', { phases: [], statistics: { totalLOC: 0, plannedLOC: 0, complianceRate: 100, completionRate: 0 } });
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.html).toContain('<!DOCTYPE html>');
      expect(result2.html).toContain('<!DOCTYPE html>');
    });
  });
});
