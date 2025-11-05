/**
 * Tests for ExportCoordinator
 * Validates export HTML generation and button creation
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ExportCoordinator } from '../../artifacts/export/ExportCoordinator.js';

describe('ExportCoordinator', () => {
  let coordinator: ExportCoordinator;
  
  beforeEach(() => {
    coordinator = new ExportCoordinator();
  });
  
  describe('CDN Scripts', () => {
    it('should generate html2canvas CDN script', () => {
      const scripts = coordinator.generateCDNScripts();
      
      expect(scripts).toContain('html2canvas@1.4.1');
      expect(scripts).toContain('cdn.jsdelivr.net');
    });
    
    it('should generate jsPDF CDN script', () => {
      const scripts = coordinator.generateCDNScripts();
      
      expect(scripts).toContain('jspdf@2.5.1');
      expect(scripts).toContain('cdn.jsdelivr.net');
    });
    
    it('should include script tags', () => {
      const scripts = coordinator.generateCDNScripts();
      
      expect(scripts).toContain('<script src=');
      expect(scripts).toContain('</script>');
    });
  });
  
  describe('Export Controls', () => {
    it('should generate export controls div', () => {
      const controls = coordinator.generateExportControls();
      
      expect(controls).toContain('<div class="export-controls"');
      expect(controls).toContain('</div>');
    });
    
    it('should include PNG export button', () => {
      const controls = coordinator.generateExportControls();
      
      expect(controls).toContain('exportArtifact(\'png\')');
      expect(controls).toContain('📷 PNG');
    });
    
    it('should include SVG export button', () => {
      const controls = coordinator.generateExportControls();
      
      expect(controls).toContain('exportArtifact(\'svg\')');
      expect(controls).toContain('📐 SVG');
    });
    
    it('should include PDF export button', () => {
      const controls = coordinator.generateExportControls();
      
      expect(controls).toContain('exportArtifact(\'pdf\')');
      expect(controls).toContain('📄 PDF');
    });
    
    it('should position controls in bottom-right', () => {
      const controls = coordinator.generateExportControls();
      
      expect(controls).toContain('position: fixed');
      expect(controls).toContain('bottom: 10px');
      expect(controls).toContain('right: 10px');
    });
  });
  
  describe('Export Scripts', () => {
    it('should generate exportArtifact function', () => {
      const scripts = coordinator.generateExportScripts();
      
      expect(scripts).toContain('async function exportArtifact(format)');
    });
    
    it('should generate exportToPNG function', () => {
      const scripts = coordinator.generateExportScripts();
      
      expect(scripts).toContain('async function exportToPNG(filename)');
      expect(scripts).toContain('html2canvas');
    });
    
    it('should generate exportToSVG function', () => {
      const scripts = coordinator.generateExportScripts();
      
      expect(scripts).toContain('function exportToSVG(filename)');
      expect(scripts).toContain('querySelector(\'svg\')');
    });
    
    it('should generate exportToPDF function', () => {
      const scripts = coordinator.generateExportScripts();
      
      expect(scripts).toContain('async function exportToPDF(filename)');
      expect(scripts).toContain('jspdf.jsPDF');
    });
    
    it('should generate downloadBlob function', () => {
      const scripts = coordinator.generateExportScripts();
      
      expect(scripts).toContain('function downloadBlob(blob, filename)');
      expect(scripts).toContain('URL.createObjectURL');
    });
    
    it('should use 2x scale for PNG quality', () => {
      const scripts = coordinator.generateExportScripts();
      
      expect(scripts).toContain('scale: 2');
    });
    
    it('should include error handling', () => {
      const scripts = coordinator.generateExportScripts();
      
      expect(scripts).toContain('try {');
      expect(scripts).toContain('catch (error)');
      expect(scripts).toContain('console.error');
    });
  });
  
  describe('Complete Export HTML', () => {
    it('should generate complete export HTML', () => {
      const html = coordinator.generateExportHTML();
      
      expect(html).toContain('html2canvas');
      expect(html).toContain('jspdf');
      expect(html).toContain('export-controls');
      expect(html).toContain('exportArtifact');
    });
    
    it('should include all three export formats', () => {
      const html = coordinator.generateExportHTML();
      
      expect(html).toContain('png');
      expect(html).toContain('svg');
      expect(html).toContain('pdf');
    });
  });
  
  describe('Individual Export Buttons', () => {
    it('should create PNG button', () => {
      const button = coordinator.createExportButton('png');
      
      expect(button).toContain('exportArtifact(\'png\')');
      expect(button).toContain('📷');
      expect(button).toContain('PNG');
    });
    
    it('should create SVG button', () => {
      const button = coordinator.createExportButton('svg');
      
      expect(button).toContain('exportArtifact(\'svg\')');
      expect(button).toContain('📐');
      expect(button).toContain('SVG');
    });
    
    it('should create PDF button', () => {
      const button = coordinator.createExportButton('pdf');
      
      expect(button).toContain('exportArtifact(\'pdf\')');
      expect(button).toContain('📄');
      expect(button).toContain('PDF');
    });
    
    it('should include tooltip titles', () => {
      const button = coordinator.createExportButton('png');
      
      expect(button).toContain('title=');
      expect(button).toContain('2x resolution');
    });
  });
  
  describe('Export Styles', () => {
    it('should generate export button styles', () => {
      const styles = coordinator.generateExportStyles();
      
      expect(styles).toContain('<style>');
      expect(styles).toContain('.export-btn');
      expect(styles).toContain('</style>');
    });
    
    it('should use theme variables for colors', () => {
      const styles = coordinator.generateExportStyles();
      
      expect(styles).toContain('var(--accent');
      expect(styles).toContain('var(--text-primary');
    });
    
    it('should include hover effects', () => {
      const styles = coordinator.generateExportStyles();
      
      expect(styles).toContain('.export-btn:hover');
      expect(styles).toContain('transform:');
    });
  });
});
