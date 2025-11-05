/**
 * Integration tests for MCPUIAdapter export functionality
 * Tests export HTML and styles injection
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MCPUIAdapter } from '../../adapters/mcp_ui_adapter.js';

describe('MCPUIAdapter - Export Integration', () => {
  let adapter: MCPUIAdapter;
  
  beforeEach(() => {
    adapter = new MCPUIAdapter();
  });
  
  describe('Export HTML Injection', () => {
    it('should inject CDN scripts into artifact', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      expect(html).toContain('html2canvas@1.4.1');
      expect(html).toContain('jspdf@2.5.1');
    });
    
    it('should inject export controls into artifact', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      expect(html).toContain('export-controls');
      expect(html).toContain('exportArtifact(\'png\')');
      expect(html).toContain('exportArtifact(\'svg\')');
      expect(html).toContain('exportArtifact(\'pdf\')');
    });
    
    it('should inject export functions into artifact', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      expect(html).toContain('async function exportArtifact(format)');
      expect(html).toContain('async function exportToPNG(filename)');
      expect(html).toContain('function exportToSVG(filename)');
      expect(html).toContain('async function exportToPDF(filename)');
    });
    
    it('should include artifact-container wrapper', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      expect(html).toContain('<div id="artifact-container">');
    });
  });
  
  describe('Export Styles Injection', () => {
    it('should inject export button styles', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      expect(html).toContain('.export-btn');
    });
    
    it('should use theme variables in export styles', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      expect(html).toContain('var(--accent');
      expect(html).toContain('var(--text-primary');
    });
  });
  
  describe('Export with Real-Time Updates', () => {
    it('should include export when real-time enabled', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
        realtime: true,
      });
      
      expect(html).toContain('export-controls');
      expect(html).toContain('function pollForUpdates');
    });
  });
  
  describe('Export with Theme', () => {
    it('should include export with dark theme', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
        theme: 'dark',
      });
      
      expect(html).toContain('export-controls');
      expect(html).toContain('--bg-primary');
    });
    
    it('should include export with light theme', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
        theme: 'light',
      });
      
      expect(html).toContain('export-controls');
      expect(html).toContain('--bg-primary');
    });
  });
  
  describe('Backward Compatibility', () => {
    it('should work without export breaking existing functionality', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      // Should still have Phase 1 placeholder content
      expect(html).toContain('MCP-UI Adapter - Phase 1 Placeholder');
      expect(html).toContain('Adapter wiring successful');
      
      // And now also have export functionality
      expect(html).toContain('export-controls');
    });
  });
  
  describe('HTML Structure', () => {
    it('should maintain valid HTML structure with export', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toMatch(/<html[^>]*>/);
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
      expect(html).toContain('</html>');
    });
    
    it('should place export scripts before closing body tag', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      const exportScriptIndex = html.indexOf('async function exportArtifact');
      const bodyCloseIndex = html.indexOf('</body>');
      
      expect(exportScriptIndex).toBeGreaterThan(0);
      expect(exportScriptIndex).toBeLessThan(bodyCloseIndex);
    });
    
    it('should place export controls inside body', async () => {
      const html = await adapter.createArtifact({
        artifactType: 'signal_map',
        data: { signals: [] },
      });
      
      const bodyOpenIndex = html.indexOf('<body>');
      const bodyCloseIndex = html.indexOf('</body>');
      const exportControlsIndex = html.indexOf('export-controls');
      
      expect(exportControlsIndex).toBeGreaterThan(bodyOpenIndex);
      expect(exportControlsIndex).toBeLessThan(bodyCloseIndex);
    });
  });
});
