/**
 * Theme Management System
 * 
 * CSS custom properties (CSS variables) for themeable values.
 * No framework dependencies - pure CSS + TypeScript.
 * 
 * Features:
 * - Dark/Light mode presets
 * - Custom theme registration
 * - CSS variable generation
 * - Client-side localStorage persistence
 */

export interface Theme {
  name: string;
  displayName: string;
  variables: Record<string, string>; // CSS custom properties
}

/**
 * Dark theme preset (default)
 * Optimized for low-light environments, reduced eye strain
 */
export const DARK_THEME: Theme = {
  name: 'dark',
  displayName: 'Dark Mode',
  variables: {
    // Background colors
    '--bg-primary': '#1e1e1e',
    '--bg-secondary': '#252526',
    '--bg-tertiary': '#2d2d30',
    
    // Text colors
    '--text-primary': '#d4d4d4',
    '--text-secondary': '#858585',
    '--text-muted': '#5c5c5c',
    
    // Accent colors
    '--accent': '#007acc',
    '--accent-hover': '#005a9e',
    '--accent-active': '#004578',
    
    // Border colors
    '--border': '#3c3c3c',
    '--border-focus': '#007acc',
    
    // Semantic colors
    '--success': '#16825d',
    '--warning': '#f9a825',
    '--error': '#d32f2f',
    '--info': '#2196f3',
    
    // Node type colors (for signal maps)
    '--node-eventbus': '#1f77b4',
    '--node-signalbus': '#ff7f0e',
    '--node-component': '#2ca02c',
    '--node-unknown': '#999999',
    
    // Graph visualization
    '--link-color': '#999999',
    '--link-opacity': '0.6',
    '--cluster-fill-opacity': '0.1',
    '--cluster-stroke': '#007acc',
    
    // UI component colors
    '--button-bg': '#007acc',
    '--button-hover': '#005a9e',
    '--input-bg': '#3c3c3c',
    '--input-border': '#5c5c5c',
    
    // Shadows
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.5)'
  }
};

/**
 * Light theme preset
 * Optimized for bright environments, high contrast
 */
export const LIGHT_THEME: Theme = {
  name: 'light',
  displayName: 'Light Mode',
  variables: {
    // Background colors
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f5f5f5',
    '--bg-tertiary': '#e0e0e0',
    
    // Text colors
    '--text-primary': '#1e1e1e',
    '--text-secondary': '#5c5c5c',
    '--text-muted': '#858585',
    
    // Accent colors
    '--accent': '#0066cc',
    '--accent-hover': '#004499',
    '--accent-active': '#003366',
    
    // Border colors
    '--border': '#d4d4d4',
    '--border-focus': '#0066cc',
    
    // Semantic colors
    '--success': '#1a8754',
    '--warning': '#f57c00',
    '--error': '#c62828',
    '--info': '#1976d2',
    
    // Node type colors (for signal maps)
    '--node-eventbus': '#2563eb',
    '--node-signalbus': '#ea580c',
    '--node-component': '#16a34a',
    '--node-unknown': '#666666',
    
    // Graph visualization
    '--link-color': '#666666',
    '--link-opacity': '0.4',
    '--cluster-fill-opacity': '0.1',
    '--cluster-stroke': '#0066cc',
    
    // UI component colors
    '--button-bg': '#0066cc',
    '--button-hover': '#004499',
    '--input-bg': '#ffffff',
    '--input-border': '#d4d4d4',
    
    // Shadows
    '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
    '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.15)',
    '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.2)'
  }
};

/**
 * Theme Manager
 * 
 * Manages theme registration, CSS generation, and preference loading.
 */
export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  
  constructor() {
    // Register built-in themes
    this.registerTheme(DARK_THEME);
    this.registerTheme(LIGHT_THEME);
  }
  
  /**
   * Register a custom theme
   * 
   * @param theme Theme definition with CSS variables
   */
  registerTheme(theme: Theme): void {
    if (!theme.name || theme.name.trim() === '') {
      throw new Error('Theme name is required');
    }
    
    if (!theme.displayName || theme.displayName.trim() === '') {
      throw new Error('Theme displayName is required');
    }
    
    if (!theme.variables || Object.keys(theme.variables).length === 0) {
      throw new Error('Theme variables are required');
    }
    
    this.themes.set(theme.name, theme);
  }
  
  /**
   * Get theme by name
   * 
   * @param themeName Theme identifier
   * @returns Theme object or undefined if not found
   */
  getTheme(themeName: string): Theme | undefined {
    return this.themes.get(themeName);
  }
  
  /**
   * Get all registered theme names
   * 
   * @returns Array of theme names
   */
  getAvailableThemes(): string[] {
    return Array.from(this.themes.keys());
  }
  
  /**
   * Generate CSS with theme variables for embedding in HTML
   * 
   * @param themeName Theme to generate CSS for (defaults to 'dark')
   * @returns CSS string with :root variables
   */
  generateThemeCSS(themeName: string = 'dark'): string {
    const theme = this.themes.get(themeName) || DARK_THEME;
    
    // Generate CSS custom properties
    const cssVars = Object.entries(theme.variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');
    
    return `
      <style id="theme-css">
        :root {
${cssVars}
        }
        
        /* Base styles using CSS variables */
        body {
          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        
        /* UI components */
        .filter-panel, .search-box, .zoom-controls, .controls-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          border-radius: 4px;
          padding: 12px;
        }
        
        button {
          background: var(--button-bg);
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s ease;
        }
        
        button:hover {
          background: var(--button-hover);
        }
        
        button:active {
          background: var(--accent-active);
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        input[type="text"], input[type="search"] {
          background: var(--input-bg);
          border: 1px solid var(--input-border);
          color: var(--text-primary);
          padding: 8px;
          border-radius: 4px;
          font-size: 14px;
        }
        
        input:focus {
          outline: none;
          border-color: var(--border-focus);
        }
        
        /* Node type colors (for D3 visualizations) */
        .node-eventbus { fill: var(--node-eventbus); }
        .node-signalbus { fill: var(--node-signalbus); }
        .node-component { fill: var(--node-component); }
        .node-unknown { fill: var(--node-unknown); }
        
        /* Graph links */
        .link {
          stroke: var(--link-color);
          stroke-opacity: var(--link-opacity);
        }
        
        /* Cluster boundaries */
        .cluster-boundary {
          fill-opacity: var(--cluster-fill-opacity);
          stroke: var(--cluster-stroke);
        }
        
        /* Semantic color utilities */
        .text-success { color: var(--success); }
        .text-warning { color: var(--warning); }
        .text-error { color: var(--error); }
        .text-info { color: var(--info); }
        .text-muted { color: var(--text-muted); }
      </style>
    `.trim();
  }
  
  /**
   * Generate theme switcher UI (embedded HTML)
   * 
   * @returns HTML string with theme switcher buttons
   */
  generateThemeSwitcherHTML(): string {
    const themeButtons = Array.from(this.themes.values())
      .map(theme => {
        const icon = theme.name === 'dark' ? '🌙' : '☀️';
        return `<button onclick="setTheme('${theme.name}')" id="theme-${theme.name}" class="theme-btn">${icon} ${theme.displayName}</button>`;
      })
      .join('\n        ');
    
    // Serialize themes for client-side switching
    const themesJSON = JSON.stringify(
      Array.from(this.themes.values()).reduce((acc, theme) => {
        acc[theme.name] = theme.variables;
        return acc;
      }, {} as Record<string, Record<string, string>>)
    );
    
    return `
      <div class="theme-switcher" style="position: fixed; top: 10px; right: 10px; z-index: 1000; display: flex; gap: 8px;">
        ${themeButtons}
      </div>
      
      <script>
        // Theme data (embedded from server)
        const THEMES = ${themesJSON};
        
        /**
         * Set theme by applying CSS variables
         * @param {string} themeName - Theme identifier
         */
        function setTheme(themeName) {
          const theme = THEMES[themeName];
          if (!theme) {
            console.error('Unknown theme:', themeName);
            return;
          }
          
          // Apply CSS variables to :root
          Object.entries(theme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
          });
          
          // Update active button styling
          document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.opacity = '0.7';
          });
          
          const activeBtn = document.getElementById('theme-' + themeName);
          if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.opacity = '1';
            activeBtn.style.fontWeight = 'bold';
          }
          
          // Persist to localStorage (client-side only)
          try {
            localStorage.setItem('cts-theme-preference', themeName);
          } catch (e) {
            console.warn('Failed to save theme preference:', e);
          }
        }
        
        /**
         * Load saved theme preference on page load
         */
        window.addEventListener('DOMContentLoaded', () => {
          let savedTheme = 'dark'; // Default
          
          try {
            savedTheme = localStorage.getItem('cts-theme-preference') || 'dark';
          } catch (e) {
            console.warn('Failed to load theme preference:', e);
          }
          
          setTheme(savedTheme);
        });
      </script>
    `.trim();
  }
  
  /**
   * Get user's theme preference (server-side placeholder)
   * 
   * NOTE: MCP stdio mode has no user context.
   * Preferences stored in browser localStorage only.
   * 
   * @returns Default theme name
   */
  getUserPreference(): string {
    // Server-side default (client will override from localStorage)
    return 'dark';
  }
}
