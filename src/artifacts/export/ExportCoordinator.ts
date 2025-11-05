/**
 * Export Coordinator
 * Generates client-side export functionality for PNG, SVG, and PDF formats
 * 
 * Architecture: Client-side only (avoids Puppeteer dependency)
 * Libraries: html2canvas (PNG), jsPDF (PDF), native browser (SVG)
 * Performance: PNG <2s, SVG instant, PDF <5s
 */

export type ExportFormat = 'png' | 'svg' | 'pdf';

/**
 * Coordinates artifact export functionality with embedded CDN libraries
 */
export class ExportCoordinator {
  /**
   * Generate complete export HTML with CDN libraries and controls
   * Embeds html2canvas and jsPDF via CDN for client-side export
   * 
   * @returns HTML string with export buttons and scripts
   */
  generateExportHTML(): string {
    const cdnScripts = this.generateCDNScripts();
    const exportControls = this.generateExportControls();
    const exportScripts = this.generateExportScripts();
    
    return `${cdnScripts}
${exportControls}
${exportScripts}`;
  }
  
  /**
   * Generate CDN script tags for export libraries
   * html2canvas: ~50KB gzipped (PNG export)
   * jsPDF: ~120KB gzipped (PDF export)
   * 
   * @returns Script tags for CDN libraries
   */
  generateCDNScripts(): string {
    return `    <!-- Export Libraries (CDN) -->
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>`;
  }
  
  /**
   * Generate export control buttons UI
   * Fixed position in bottom-right corner with z-index above graph
   * 
   * @returns HTML for export buttons
   */
  generateExportControls(): string {
    return `    <!-- Export Controls -->
    <div class="export-controls" style="position: fixed; bottom: 10px; right: 10px; z-index: 1000; display: flex; gap: 8px; background: var(--bg-secondary, #252526); padding: 8px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <button onclick="exportArtifact('png')" class="export-btn" title="Export as PNG (2x resolution)">📷 PNG</button>
      <button onclick="exportArtifact('svg')" class="export-btn" title="Export as SVG (vector graphics)">📐 SVG</button>
      <button onclick="exportArtifact('pdf')" class="export-btn" title="Export as PDF (landscape)">📄 PDF</button>
    </div>`;
  }
  
  /**
   * Generate client-side export scripts
   * Implements exportArtifact() function and format-specific exporters
   * 
   * @returns Script tag with export functions
   */
  generateExportScripts(): string {
    return `    <script>
      /**
       * Export artifact to specified format
       * @param {string} format - 'png', 'svg', or 'pdf'
       */
      async function exportArtifact(format) {
        try {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
          const filename = 'cts-artifact-' + timestamp;
          
          switch(format) {
            case 'png':
              await exportToPNG(filename);
              break;
            case 'svg':
              exportToSVG(filename);
              break;
            case 'pdf':
              await exportToPDF(filename);
              break;
            default:
              console.error('Unknown export format:', format);
          }
        } catch (error) {
          console.error('Export failed:', error);
          alert('Export failed: ' + error.message);
        }
      }
      
      /**
       * Export artifact to PNG using html2canvas
       * 2x scale for high-resolution output
       */
      async function exportToPNG(filename) {
        if (typeof html2canvas === 'undefined') {
          throw new Error('html2canvas library not loaded');
        }
        
        const element = document.getElementById('artifact-container') || document.body;
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#1e1e1e';
        
        const canvas = await html2canvas(element, {
          backgroundColor: bgColor.trim(),
          scale: 2, // 2x resolution for quality
          logging: false,
          useCORS: true
        });
        
        canvas.toBlob(blob => {
          if (blob) {
            downloadBlob(blob, filename + '.png');
          }
        }, 'image/png');
      }
      
      /**
       * Export artifact SVG to file
       * Extracts first SVG element and serializes to XML
       */
      function exportToSVG(filename) {
        const svg = document.querySelector('svg');
        if (!svg) {
          throw new Error('No SVG element found in artifact');
        }
        
        // Clone SVG to avoid modifying original
        const svgClone = svg.cloneNode(true);
        
        // Add XML namespace if missing
        if (!svgClone.hasAttribute('xmlns')) {
          svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(svgBlob, filename + '.svg');
      }
      
      /**
       * Export artifact to PDF using jsPDF
       * Converts to canvas first, then embeds in PDF
       */
      async function exportToPDF(filename) {
        if (typeof html2canvas === 'undefined') {
          throw new Error('html2canvas library not loaded');
        }
        if (typeof jspdf === 'undefined' || !jspdf.jsPDF) {
          throw new Error('jsPDF library not loaded');
        }
        
        const element = document.getElementById('artifact-container') || document.body;
        const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary') || '#1e1e1e';
        
        const canvas = await html2canvas(element, {
          backgroundColor: bgColor.trim(),
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2] // Adjust for 2x scale
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(filename + '.pdf');
      }
      
      /**
       * Download blob as file
       * Creates temporary anchor element and triggers download
       */
      function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    </script>`;
  }
  
  /**
   * Create individual export button HTML
   * Used for custom export UI layouts
   * 
   * @param format - Export format ('png', 'svg', 'pdf')
   * @returns HTML button element
   */
  createExportButton(format: ExportFormat): string {
    const icons: Record<ExportFormat, string> = { 
      png: '📷', 
      svg: '📐', 
      pdf: '📄' 
    };
    const labels: Record<ExportFormat, string> = { 
      png: 'PNG', 
      svg: 'SVG', 
      pdf: 'PDF' 
    };
    const titles: Record<ExportFormat, string> = {
      png: 'Export as PNG (2x resolution)',
      svg: 'Export as SVG (vector graphics)',
      pdf: 'Export as PDF (landscape)'
    };
    
    return `<button onclick="exportArtifact('${format}')" class="export-btn" title="${titles[format]}">${icons[format]} ${labels[format]}</button>`;
  }
  
  /**
   * Generate CSS for export buttons
   * Styled to match theme variables
   * 
   * @returns CSS style block
   */
  generateExportStyles(): string {
    return `    <style>
      .export-btn {
        background: var(--accent, #007acc);
        color: var(--text-primary, #d4d4d4);
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-family: system-ui, -apple-system, sans-serif;
        transition: background 0.2s, transform 0.1s;
      }
      
      .export-btn:hover {
        background: var(--accent-hover, #005a9e);
        transform: translateY(-1px);
      }
      
      .export-btn:active {
        background: var(--accent-active, #004578);
        transform: translateY(0);
      }
    </style>`;
  }
}
