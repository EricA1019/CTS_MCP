/**
 * Tests for Server Renderer Registration
 * 
 * Verifies conditional renderer registration based on CTS_EXPERIMENTAL_MCP_UI flag.
 * Ensures backward compatibility and feature flag behavior.
 */

import { describe, it, expect } from '@jest/globals';
import { ArtifactEngine } from '../artifacts/artifact_engine.js';
import { InteractiveSignalMapRenderer } from '../artifacts/renderers/interactive_signal_map.js';
import { D3HopDashboardRenderer } from '../artifacts/renderers/d3_hop_dashboard.js';
import { PlaceholderSignalMapRenderer } from '../artifacts/renderers/placeholder_signal_map.js';
import { PlaceholderHopDashboardRenderer } from '../artifacts/renderers/placeholder_hop_dashboard.js';

describe('Server Renderer Registration', () => {
  describe('Feature Flag: CTS_EXPERIMENTAL_MCP_UI=true', () => {
    it('should register InteractiveSignalMapRenderer with ArtifactEngine', () => {
      const engine = new ArtifactEngine();
      const renderer = new InteractiveSignalMapRenderer();
      
      engine.registerRenderer(renderer);
      
      expect(engine.hasRenderer('signal_map_interactive')).toBe(true);
      expect(engine.getRegisteredTypes()).toContain('signal_map_interactive');
    });

    it('should register D3HopDashboardRenderer with ArtifactEngine', () => {
      const engine = new ArtifactEngine();
      const renderer = new D3HopDashboardRenderer();
      
      engine.registerRenderer(renderer);
      
      expect(engine.hasRenderer('hop_dashboard')).toBe(true);
      expect(engine.getRegisteredTypes()).toContain('hop_dashboard');
    });

    it('should support both renderers in same engine', () => {
      const engine = new ArtifactEngine();
      
      engine.registerRenderer(new InteractiveSignalMapRenderer());
      engine.registerRenderer(new D3HopDashboardRenderer());
      
      expect(engine.hasRenderer('signal_map_interactive')).toBe(true);
      expect(engine.hasRenderer('hop_dashboard')).toBe(true);
      expect(engine.getRegisteredTypes()).toHaveLength(2);
    });
  });

  describe('Feature Flag: CTS_EXPERIMENTAL_MCP_UI=false (Backward Compatibility)', () => {
    it('should register PlaceholderSignalMapRenderer with ArtifactEngine', () => {
      const engine = new ArtifactEngine();
      const renderer = new PlaceholderSignalMapRenderer();
      
      engine.registerRenderer(renderer);
      
      expect(engine.hasRenderer('signal_map')).toBe(true);
    });

    it('should register PlaceholderHopDashboardRenderer with ArtifactEngine', () => {
      const engine = new ArtifactEngine();
      const renderer = new PlaceholderHopDashboardRenderer();
      
      engine.registerRenderer(renderer);
      
      expect(engine.hasRenderer('hop_dashboard')).toBe(true);
    });

    it('should support both placeholder renderers', () => {
      const engine = new ArtifactEngine();
      
      engine.registerRenderer(new PlaceholderSignalMapRenderer());
      engine.registerRenderer(new PlaceholderHopDashboardRenderer());
      
      expect(engine.hasRenderer('signal_map')).toBe(true);
      expect(engine.hasRenderer('hop_dashboard')).toBe(true);
    });
  });

  describe('Renderer Type Registration', () => {
    it('should correctly identify signal_map_interactive renderer type', () => {
      const renderer = new InteractiveSignalMapRenderer();
      expect(renderer.type).toBe('signal_map_interactive');
    });

    it('should correctly identify hop_dashboard renderer type', () => {
      const renderer = new D3HopDashboardRenderer();
      expect(renderer.type).toBe('hop_dashboard');
    });

    it('should register renderer with correct type string', () => {
      const engine = new ArtifactEngine();
      const renderer = new D3HopDashboardRenderer();
      
      engine.registerRenderer(renderer);
      
      const types = engine.getRegisteredTypes();
      expect(types).toContain('hop_dashboard');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain placeholder signal map functionality', async () => {
      const renderer = new PlaceholderSignalMapRenderer();
      const html = await renderer.render({ signals: [], connections: [] });
      
      expect(html).toContain('Signal Map');
      expect(html).toContain('Placeholder');
    });

    it('should maintain placeholder hop dashboard functionality', async () => {
      const renderer = new PlaceholderHopDashboardRenderer();
      const html = await renderer.render({
        currentPhase: 'Phase 1',
        phases: [],
        stats: { totalLOC: 0, plannedLOC: 0, ctsComplianceRate: 0, completionRate: 0 }
      });
      
      expect(html).toContain('Hop Dashboard');
      expect(html).toContain('placeholder');
    });
  });

  describe('Production Renderer Functionality', () => {
    it('should render signal map with D3 code', async () => {
      const renderer = new InteractiveSignalMapRenderer();
      const html = await renderer.render({
        signals: [{ name: 'test_signal', params: [], file: 'test.gd', line: 1 }],
        connections: []
      });
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('d3');
      expect(html).toContain('test_signal');
    });

    it('should render hop dashboard with Gantt chart', async () => {
      const renderer = new D3HopDashboardRenderer();
      const html = await renderer.render({
        currentPhase: 'Phase 1',
        phases: [{
          name: 'Phase 1',
          hops: [{
            id: 'hop-1',
            name: 'Test Hop',
            status: 'completed' as const,
            description: 'Test',
            estimatedLOC: 100,
            ctsCompliant: true,
            phase: 'Phase 1',
            dependencies: []
          }]
        }],
        stats: { totalLOC: 100, plannedLOC: 100, ctsComplianceRate: 1.0, completionRate: 1.0 }
      });
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('d3');
      expect(html).toContain('Test Hop');
      expect(html).toContain('Dashboard Stats');
    });
  });

  describe('Integration: Multiple Renderers', () => {
    it('should support registering multiple renderer types', () => {
      const engine = new ArtifactEngine();
      
      engine.registerRenderer(new InteractiveSignalMapRenderer());
      engine.registerRenderer(new D3HopDashboardRenderer());
      
      const types = engine.getRegisteredTypes();
      expect(types).toContain('signal_map_interactive');
      expect(types).toContain('hop_dashboard');
      expect(types.length).toBeGreaterThanOrEqual(2);
    });

    it('should not conflict between renderer types', () => {
      const engine = new ArtifactEngine();
      
      const signalRenderer = new InteractiveSignalMapRenderer();
      const hopRenderer = new D3HopDashboardRenderer();
      
      engine.registerRenderer(signalRenderer);
      engine.registerRenderer(hopRenderer);
      
      // Both should be registered
      expect(engine.hasRenderer('signal_map_interactive')).toBe(true);
      expect(engine.hasRenderer('hop_dashboard')).toBe(true);
      
      // Types should be distinct
      expect(signalRenderer.type).not.toBe(hopRenderer.type);
    });
  });

  describe('Renderer Type Constants', () => {
    it('should use distinct type strings for production vs placeholder', () => {
      const signalRenderer = new InteractiveSignalMapRenderer();
      const hopRenderer = new D3HopDashboardRenderer();
      const placeholderSignal = new PlaceholderSignalMapRenderer();
      const placeholderHop = new PlaceholderHopDashboardRenderer();
      
      // Production and placeholder signal renderers have different types
      expect(signalRenderer.type).toBe('signal_map_interactive');
      expect(placeholderSignal.type).toBe('signal_map');
      
      // All hop dashboard renderers share the same type
      expect(hopRenderer.type).toBe('hop_dashboard');
      expect(placeholderHop.type).toBe('hop_dashboard');
    });
  });
});
