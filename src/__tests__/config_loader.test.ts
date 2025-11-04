/**
 * Configuration Loader Tests
 * 
 * Following Quinn's testing methodology:
 * - Test behavior, not implementation
 * - Validate outcomes
 * - Cover edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigLoader, CTSRuleThresholdsSchema } from '../config/config_loader.js';
import { writeFileSync, unlinkSync, mkdirSync, existsSync, rmdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ConfigLoader', () => {
  let configLoader: ConfigLoader;
  let testDir: string;
  
  beforeEach(() => {
    configLoader = new ConfigLoader();
    // Create temp directory for tests
    testDir = join(tmpdir(), `cts-config-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });
  
  afterEach(() => {
    // Stop watching first
    configLoader.stopWatching();
    
    // Clean up temp directory
    if (existsSync(testDir)) {
      // Remove all files in test directory
      const files = readdirSync(testDir);
      for (const file of files) {
        try {
          unlinkSync(join(testDir, file));
        } catch (err) {
          // Ignore errors
        }
      }
      try {
        rmdirSync(testDir);
      } catch (err) {
        // Ignore errors
      }
    }
  });
  
  describe('Schema Validation', () => {
    it('should validate default CTSRuleThresholds', () => {
      const defaults = CTSRuleThresholdsSchema.parse({});
      
      expect(defaults.maxFileLines).toBe(500);
      expect(defaults.maxFunctionLines).toBe(50);
      expect(defaults.maxClassLines).toBe(300);
      expect(defaults.maxHopLOC).toBe(1500);
      expect(defaults.requireTypeHints).toBe(true);
    });
    
    it('should validate custom CTSRuleThresholds', () => {
      const custom = CTSRuleThresholdsSchema.parse({
        maxFileLines: 750,
        requireTypeHints: false,
      });
      
      expect(custom.maxFileLines).toBe(750);
      expect(custom.requireTypeHints).toBe(false);
      // Other fields should use defaults
      expect(custom.maxFunctionLines).toBe(50);
    });
    
    it('should reject invalid thresholds', () => {
      expect(() => {
        CTSRuleThresholdsSchema.parse({ maxFileLines: 50 }); // Too low (min: 100)
      }).toThrow();
      
      expect(() => {
        CTSRuleThresholdsSchema.parse({ maxFileLines: 5000 }); // Too high (max: 2000)
      }).toThrow();
    });
  });
  
  describe('Config Loading', () => {
    it('should load config with defaults when no files exist', () => {
      const config = configLoader.loadConfig(testDir);
      
      expect(config.rules.maxFileLines).toBe(500);
      expect(config.exclusions).toContain('**/addons/**');
      expect(config.sources.defaults).toBe(true);
      expect(config.sources.project).toBeUndefined();
      expect(config.sources.user).toBeUndefined();
    });
    
    it('should load project-level .ctsrc.json', () => {
      // Create project config
      const projectConfig = {
        rules: { maxFileLines: 750 },
        exclusions: ['**/tests/**'],
      };
      
      writeFileSync(
        join(testDir, '.ctsrc.json'),
        JSON.stringify(projectConfig, null, 2)
      );
      
      const config = configLoader.loadConfig(testDir);
      
      expect(config.rules.maxFileLines).toBe(750);
      expect(config.exclusions).toEqual(['**/tests/**']);
      expect(config.sources.project).toBe(join(testDir, '.ctsrc.json'));
    });
    
    it('should handle invalid JSON gracefully', () => {
      writeFileSync(join(testDir, '.ctsrc.json'), '{invalid json');
      
      // Should fall back to defaults without crashing
      const config = configLoader.loadConfig(testDir);
      
      expect(config.rules.maxFileLines).toBe(500); // Default
      expect(config.sources.project).toBeUndefined();
    });
    
    it('should handle invalid schema gracefully', () => {
      const invalidConfig = {
        rules: { maxFileLines: 'not-a-number' }, // Invalid type
      };
      
      writeFileSync(
        join(testDir, '.ctsrc.json'),
        JSON.stringify(invalidConfig, null, 2)
      );
      
      // Should fall back to defaults without crashing
      const config = configLoader.loadConfig(testDir);
      
      expect(config.rules.maxFileLines).toBe(500); // Default
    });
  });
  
  describe('Cascading Resolution', () => {
    it('should merge project config with defaults', () => {
      const projectConfig = {
        rules: { maxFileLines: 750 },
        // Don't specify exclusions - should use defaults
      };
      
      writeFileSync(
        join(testDir, '.ctsrc.json'),
        JSON.stringify(projectConfig, null, 2)
      );
      
      const config = configLoader.loadConfig(testDir);
      
      // Custom value
      expect(config.rules.maxFileLines).toBe(750);
      // Default values
      expect(config.rules.maxFunctionLines).toBe(50);
      expect(config.exclusions).toContain('**/addons/**');
    });
    
    it('should expose 10+ configuration options', () => {
      const projectConfig = {
        rules: {
          maxFileLines: 600,
          maxFunctionLines: 60,
          maxClassLines: 350,
          maxHopLOC: 2000,
          maxSubHops: 7,
          maxCyclomaticComplexity: 15,
          maxNestingDepth: 5,
          minSignalUsage: 80,
          maxDirectCalls: 20,
          requireTypeHints: false,
          requireDocstrings: true,
          minTestCoverage: 75,
        },
      };
      
      writeFileSync(
        join(testDir, '.ctsrc.json'),
        JSON.stringify(projectConfig, null, 2)
      );
      
      const config = configLoader.loadConfig(testDir);
      
      // Verify all 12 rule options are configurable
      expect(config.rules.maxFileLines).toBe(600);
      expect(config.rules.maxFunctionLines).toBe(60);
      expect(config.rules.maxClassLines).toBe(350);
      expect(config.rules.maxHopLOC).toBe(2000);
      expect(config.rules.maxSubHops).toBe(7);
      expect(config.rules.maxCyclomaticComplexity).toBe(15);
      expect(config.rules.maxNestingDepth).toBe(5);
      expect(config.rules.minSignalUsage).toBe(80);
      expect(config.rules.maxDirectCalls).toBe(20);
      expect(config.rules.requireTypeHints).toBe(false);
      expect(config.rules.requireDocstrings).toBe(true);
      expect(config.rules.minTestCoverage).toBe(75);
      
      console.log('✅ Verified 12+ configuration options are customizable');
    });
  });
  
  describe('Hot Reload', () => {
    it('should detect config file changes', (done) => {
      // Create initial config file FIRST
      const configPath = join(testDir, '.ctsrc.json');
      writeFileSync(
        configPath,
        JSON.stringify({ rules: { maxFileLines: 500 } }, null, 2)
      );
      
      // Enable hot-reload (now the file exists and will be watched)
      configLoader.enableHotReload(testDir);
      
      // Load config to establish baseline
      let config = configLoader.loadConfig(testDir);
      expect(config.rules.maxFileLines).toBe(500);
      
      // Register change handler
      let changeDetected = false;
      const handler = (newConfig: any) => {
        console.log('[TEST] Config change detected!');
        expect(newConfig.rules.maxFileLines).toBe(750);
        changeDetected = true;
        done();
      };
      
      configLoader.onConfigChange(handler);
      
      // Modify config file (after delay to ensure watcher is active)
      setTimeout(() => {
        console.log('[TEST] Modifying config file...');
        writeFileSync(
          configPath,
          JSON.stringify({ rules: { maxFileLines: 750 } }, null, 2)
        );
      }, 500);
      
      // Timeout if change not detected
      setTimeout(() => {
        if (!changeDetected) {
          done(new Error('Config change not detected within 5 seconds'));
        }
      }, 5000);
    }, 7000); // 7 second timeout for this test
  });
  
  describe('Tool Config Integration', () => {
    it('should pass config to tool config manager', () => {
      const projectConfig = {
        tools: {
          audit: {
            minScore: 85,
            format: 'markdown',
          },
        },
      };
      
      writeFileSync(
        join(testDir, '.ctsrc.json'),
        JSON.stringify(projectConfig, null, 2)
      );
      
      const config = configLoader.loadConfig(testDir);
      const toolConfig = configLoader.getToolConfigManager();
      
      const auditConfig = toolConfig.getAuditConfig();
      expect(auditConfig.minScore).toBe(85);
      expect(auditConfig.format).toBe('markdown');
    });
  });
  
  describe('Example Config Generation', () => {
    it('should generate valid example config', () => {
      const exampleConfig = ConfigLoader.generateExampleConfig();
      
      // Should be valid JSON
      const parsed = JSON.parse(exampleConfig);
      
      // Should have all sections
      expect(parsed.rules).toBeDefined();
      expect(parsed.exclusions).toBeDefined();
      expect(parsed.tools).toBeDefined();
      expect(parsed.team).toBeDefined();
      
      // Should have all rule options
      expect(Object.keys(parsed.rules).length).toBeGreaterThanOrEqual(12);
      
      console.log('✅ Example config has all required sections');
    });
  });
});
