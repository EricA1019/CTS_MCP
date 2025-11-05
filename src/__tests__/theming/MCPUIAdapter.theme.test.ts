/**
 * Integration tests for MCPUIAdapter with Theme Support
 * 
 * Verifies theme CSS and switcher injection into artifacts.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MCPUIAdapter } from '../../adapters/mcp_ui_adapter.js';

describe('MCPUIAdapter - Theme Integration', () => {
  let adapter: MCPUIAdapter;

  beforeEach(() => {
    adapter = new MCPUIAdapter();
  });

  describe('Theme CSS Injection', () => {
    it('should inject dark theme CSS by default', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {}
      });

      expect(html).toContain('<style id="theme-css">');
      expect(html).toContain(':root {');
      expect(html).toContain('--bg-primary: #1e1e1e;'); // Dark theme
    });

    it('should inject light theme CSS when specified', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {},
        theme: 'light'
      });

      expect(html).toContain('<style id="theme-css">');
      expect(html).toContain('--bg-primary: #ffffff;'); // Light theme
    });

    it('should include all CSS variable definitions', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {}
      });

      expect(html).toContain('--bg-primary');
      expect(html).toContain('--text-primary');
      expect(html).toContain('--accent');
      expect(html).toContain('--node-eventbus');
      expect(html).toContain('--node-signalbus');
    });

    it('should include base styles using CSS variables', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {}
      });

      expect(html).toContain('background: var(--bg-primary);');
      expect(html).toContain('color: var(--text-primary);');
    });
  });

  describe('Theme Switcher Injection', () => {
    it('should inject theme switcher UI', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {}
      });

      expect(html).toContain('<div class="theme-switcher"');
      expect(html).toContain('id="theme-dark"');
      expect(html).toContain('id="theme-light"');
    });

    it('should inject setTheme function', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {}
      });

      expect(html).toContain('function setTheme(themeName)');
      expect(html).toContain('const THEMES =');
    });

    it('should embed theme data in switcher', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {}
      });

      expect(html).toContain('"dark"');
      expect(html).toContain('"light"');
    });

    it('should include localStorage persistence', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {}
      });

      expect(html).toContain('localStorage.setItem');
      expect(html).toContain('cts-theme-preference');
    });
  });

  describe('Theme with Real-Time Updates', () => {
    it('should include theme when real-time enabled', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {},
        realtime: true,
        theme: 'light'
      });

      expect(html).toContain('--bg-primary: #ffffff;'); // Light theme
      expect(html).toContain('id="theme-light"'); // Switcher
      expect(html).toContain('function pollForUpdates'); // Polling script (correct function name)
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without theme option (defaults to dark)', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {}
      });

      expect(html).toContain('--bg-primary: #1e1e1e;'); // Dark theme default
    });

    it('should maintain placeholder HTML structure', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: {},
        metadata: { title: 'Test Artifact' }
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('Test Artifact');
      expect(html).toContain('placeholder-container');
    });
  });
});
