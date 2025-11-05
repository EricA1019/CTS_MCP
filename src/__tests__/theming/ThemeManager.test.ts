/**
 * Tests for ThemeManager
 * 
 * Verifies theme registration, CSS generation, and preference handling.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ThemeManager, DARK_THEME, LIGHT_THEME, type Theme } from '../../artifacts/theming/ThemeManager.js';

describe('ThemeManager', () => {
  let manager: ThemeManager;

  beforeEach(() => {
    manager = new ThemeManager();
  });

  describe('Constructor', () => {
    it('should initialize with built-in themes', () => {
      expect(manager).toBeDefined();
      expect(manager.getAvailableThemes()).toContain('dark');
      expect(manager.getAvailableThemes()).toContain('light');
    });
  });

  describe('Theme Registration', () => {
    it('should register custom theme', () => {
      const customTheme: Theme = {
        name: 'custom',
        displayName: 'Custom Theme',
        variables: {
          '--bg-primary': '#000000',
          '--text-primary': '#ffffff'
        }
      };

      manager.registerTheme(customTheme);

      expect(manager.getAvailableThemes()).toContain('custom');
      expect(manager.getTheme('custom')).toEqual(customTheme);
    });

    it('should throw error for theme without name', () => {
      const invalidTheme: Theme = {
        name: '',
        displayName: 'Invalid',
        variables: {}
      };

      expect(() => manager.registerTheme(invalidTheme)).toThrow('Theme name is required');
    });

    it('should throw error for theme without displayName', () => {
      const invalidTheme: Theme = {
        name: 'invalid',
        displayName: '',
        variables: {}
      };

      expect(() => manager.registerTheme(invalidTheme)).toThrow('Theme displayName is required');
    });

    it('should throw error for theme without variables', () => {
      const invalidTheme: Theme = {
        name: 'invalid',
        displayName: 'Invalid',
        variables: {}
      };

      expect(() => manager.registerTheme(invalidTheme)).toThrow('Theme variables are required');
    });

    it('should overwrite existing theme on re-registration', () => {
      const theme1: Theme = {
        name: 'test',
        displayName: 'Test 1',
        variables: { '--color': 'red' }
      };

      const theme2: Theme = {
        name: 'test',
        displayName: 'Test 2',
        variables: { '--color': 'blue' }
      };

      manager.registerTheme(theme1);
      manager.registerTheme(theme2);

      expect(manager.getTheme('test')).toEqual(theme2);
    });
  });

  describe('Theme Retrieval', () => {
    it('should get dark theme by default', () => {
      const theme = manager.getTheme('dark');
      expect(theme).toBeDefined();
      expect(theme?.name).toBe('dark');
    });

    it('should get light theme', () => {
      const theme = manager.getTheme('light');
      expect(theme).toBeDefined();
      expect(theme?.name).toBe('light');
    });

    it('should return undefined for unknown theme', () => {
      const theme = manager.getTheme('nonexistent');
      expect(theme).toBeUndefined();
    });

    it('should list all available themes', () => {
      const themes = manager.getAvailableThemes();
      expect(themes).toHaveLength(2);
      expect(themes).toEqual(expect.arrayContaining(['dark', 'light']));
    });
  });

  describe('CSS Generation', () => {
    it('should generate valid CSS with :root variables', () => {
      const css = manager.generateThemeCSS('dark');

      expect(css).toContain('<style id="theme-css">');
      expect(css).toContain(':root {');
      expect(css).toContain('--bg-primary: #1e1e1e;');
      expect(css).toContain('--text-primary: #d4d4d4;');
      expect(css).toContain('</style>');
    });

    it('should include all dark theme variables', () => {
      const css = manager.generateThemeCSS('dark');

      Object.entries(DARK_THEME.variables).forEach(([key, value]) => {
        expect(css).toContain(`${key}: ${value};`);
      });
    });

    it('should include all light theme variables', () => {
      const css = manager.generateThemeCSS('light');

      Object.entries(LIGHT_THEME.variables).forEach(([key, value]) => {
        expect(css).toContain(`${key}: ${value};`);
      });
    });

    it('should include base styles using CSS variables', () => {
      const css = manager.generateThemeCSS('dark');

      expect(css).toContain('background: var(--bg-primary);');
      expect(css).toContain('color: var(--text-primary);');
      expect(css).toContain('background: var(--button-bg);');
    });

    it('should include node type color classes', () => {
      const css = manager.generateThemeCSS('dark');

      expect(css).toContain('.node-eventbus { fill: var(--node-eventbus); }');
      expect(css).toContain('.node-signalbus { fill: var(--node-signalbus); }');
      expect(css).toContain('.node-component { fill: var(--node-component); }');
    });

    it('should default to dark theme for unknown theme name', () => {
      const css = manager.generateThemeCSS('nonexistent');

      expect(css).toContain('--bg-primary: #1e1e1e;'); // Dark theme default
    });

    it('should default to dark theme when no theme specified', () => {
      const css = manager.generateThemeCSS();

      expect(css).toContain('--bg-primary: #1e1e1e;'); // Dark theme default
    });
  });

  describe('Theme Switcher HTML Generation', () => {
    it('should generate theme switcher with buttons', () => {
      const html = manager.generateThemeSwitcherHTML();

      expect(html).toContain('<div class="theme-switcher"');
      expect(html).toContain('id="theme-dark"');
      expect(html).toContain('id="theme-light"');
    });

    it('should include setTheme function', () => {
      const html = manager.generateThemeSwitcherHTML();

      expect(html).toContain('function setTheme(themeName)');
      expect(html).toContain('const THEMES =');
    });

    it('should embed theme data as JSON', () => {
      const html = manager.generateThemeSwitcherHTML();

      expect(html).toContain('"dark"');
      expect(html).toContain('"light"');
      expect(html).toContain('--bg-primary');
    });

    it('should include localStorage persistence code', () => {
      const html = manager.generateThemeSwitcherHTML();

      expect(html).toContain('localStorage.setItem');
      expect(html).toContain('localStorage.getItem');
      expect(html).toContain('cts-theme-preference');
    });

    it('should include DOMContentLoaded event listener', () => {
      const html = manager.generateThemeSwitcherHTML();

      expect(html).toContain('DOMContentLoaded');
      expect(html).toContain('setTheme(savedTheme)');
    });

    it('should have dark mode icon for dark theme button', () => {
      const html = manager.generateThemeSwitcherHTML();

      expect(html).toContain('🌙 Dark Mode');
    });

    it('should have light mode icon for light theme button', () => {
      const html = manager.generateThemeSwitcherHTML();

      expect(html).toContain('☀️ Light Mode');
    });
  });

  describe('User Preference', () => {
    it('should return dark as default preference', () => {
      const pref = manager.getUserPreference();
      expect(pref).toBe('dark');
    });
  });

  describe('Built-in Themes', () => {
    describe('DARK_THEME', () => {
      it('should have all required variables', () => {
        const requiredVars = [
          '--bg-primary',
          '--bg-secondary',
          '--text-primary',
          '--text-secondary',
          '--accent',
          '--border',
          '--success',
          '--warning',
          '--error',
          '--node-eventbus',
          '--node-signalbus',
          '--node-component',
          '--link-color'
        ];

        requiredVars.forEach(varName => {
          expect(DARK_THEME.variables).toHaveProperty(varName);
        });
      });

      it('should have dark background colors', () => {
        expect(DARK_THEME.variables['--bg-primary']).toBe('#1e1e1e');
        expect(DARK_THEME.variables['--bg-secondary']).toBe('#252526');
      });

      it('should have light text colors', () => {
        expect(DARK_THEME.variables['--text-primary']).toBe('#d4d4d4');
      });
    });

    describe('LIGHT_THEME', () => {
      it('should have all required variables', () => {
        const requiredVars = [
          '--bg-primary',
          '--bg-secondary',
          '--text-primary',
          '--text-secondary',
          '--accent',
          '--border',
          '--success',
          '--warning',
          '--error',
          '--node-eventbus',
          '--node-signalbus',
          '--node-component',
          '--link-color'
        ];

        requiredVars.forEach(varName => {
          expect(LIGHT_THEME.variables).toHaveProperty(varName);
        });
      });

      it('should have light background colors', () => {
        expect(LIGHT_THEME.variables['--bg-primary']).toBe('#ffffff');
        expect(LIGHT_THEME.variables['--bg-secondary']).toBe('#f5f5f5');
      });

      it('should have dark text colors', () => {
        expect(LIGHT_THEME.variables['--text-primary']).toBe('#1e1e1e');
      });
    });
  });
});
