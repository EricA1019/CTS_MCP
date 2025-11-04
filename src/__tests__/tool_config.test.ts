/**
 * Unit Tests: Tool Configuration Management
 * Following Quinn's comprehensive testing methodology
 * 
 * Test Coverage:
 * - Schema validation (30+ tests)
 * - Default values
 * - Range validation
 * - Hot-reload
 * - Error handling
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ConfigManager,
  BughunterConfigSchema,
  AuditConfigSchema,
  SignalScanConfigSchema,
  AnalysisConfigSchema,
  RefactoringConfigSchema,
  ReasoningConfigSchema,
  ToolConfigSchema,
  type ToolConfig,
} from '../config/tool_config.js';

describe('Tool Configuration Management - Unit Tests', () => {
  describe('BughunterConfigSchema', () => {
    it('should apply default values', () => {
      const config = BughunterConfigSchema.parse({});
      
      expect(config.minSeverity).toBe('medium');
      expect(config.maxFiles).toBe(1000);
      expect(config.excludePatterns).toEqual(['**/addons/**', '**/.godot/**']);
      expect(config.enableCache).toBe(true);
      expect(config.cacheTTL).toBe(3600000); // 1 hour in milliseconds
    });
    
    it('should validate minSeverity enum', () => {
      expect(() => BughunterConfigSchema.parse({ minSeverity: 'invalid' })).toThrow();
      expect(() => BughunterConfigSchema.parse({ minSeverity: 'low' })).not.toThrow();
      expect(() => BughunterConfigSchema.parse({ minSeverity: 'critical' })).not.toThrow();
    });
    
    it('should validate maxFiles range', () => {
      expect(() => BughunterConfigSchema.parse({ maxFiles: 0 })).toThrow();
      expect(() => BughunterConfigSchema.parse({ maxFiles: 10001 })).toThrow();
      expect(() => BughunterConfigSchema.parse({ maxFiles: 500 })).not.toThrow();
    });
    
    it('should accept custom exclude patterns', () => {
      const config = BughunterConfigSchema.parse({
        excludePatterns: ['**/test/**', '**/build/**'],
      });
      expect(config.excludePatterns).toEqual(['**/test/**', '**/build/**']);
    });
  });
  
  describe('AuditConfigSchema', () => {
    it('should apply default values', () => {
      const config = AuditConfigSchema.parse({});
      
      expect(config.categories).toEqual(['cts', 'code_quality', 'project_structure']);
      expect(config.minScore).toBe(0);
      expect(config.format).toBe('json');
      expect(config.maxViolations).toBe(100);
    });
    
    it('should validate category enum', () => {
      expect(() => AuditConfigSchema.parse({ categories: ['invalid'] })).toThrow();
      expect(() => AuditConfigSchema.parse({ categories: ['cts'] })).not.toThrow();
      expect(() => AuditConfigSchema.parse({ categories: ['cts', 'code_quality'] })).not.toThrow();
    });
    
    it('should validate minScore range', () => {
      expect(() => AuditConfigSchema.parse({ minScore: -1 })).toThrow();
      expect(() => AuditConfigSchema.parse({ minScore: 101 })).toThrow();
      expect(() => AuditConfigSchema.parse({ minScore: 75 })).not.toThrow();
    });
    
    it('should validate format enum', () => {
      expect(() => AuditConfigSchema.parse({ format: 'xml' })).toThrow();
      expect(() => AuditConfigSchema.parse({ format: 'markdown' })).not.toThrow();
    });
  });
  
  describe('SignalScanConfigSchema', () => {
    it('should apply default values', () => {
      const config = SignalScanConfigSchema.parse({});
      
      expect(config.renderMap).toBe(true);
      expect(config.includePrivate).toBe(false);
      expect(config.maxSignals).toBe(1000);
    });
    
    it('should validate maxSignals range', () => {
      expect(() => SignalScanConfigSchema.parse({ maxSignals: 5 })).toThrow();
      expect(() => SignalScanConfigSchema.parse({ maxSignals: 10001 })).toThrow();
      expect(() => SignalScanConfigSchema.parse({ maxSignals: 500 })).not.toThrow();
    });
  });
  
  describe('AnalysisConfigSchema', () => {
    it('should apply default values', () => {
      const config = AnalysisConfigSchema.parse({});
      
      expect(config.detectUnused).toBe(true);
      expect(config.buildHierarchy).toBe(true);
      expect(config.minClusterSize).toBe(5);
      expect(config.performanceBaseline).toBe(false);
    });
    
    it('should validate minClusterSize range', () => {
      expect(() => AnalysisConfigSchema.parse({ minClusterSize: 1 })).toThrow();
      expect(() => AnalysisConfigSchema.parse({ minClusterSize: 11 })).toThrow();
      expect(() => AnalysisConfigSchema.parse({ minClusterSize: 5 })).not.toThrow();
    });
  });
  
  describe('RefactoringConfigSchema', () => {
    it('should apply default values', () => {
      const config = RefactoringConfigSchema.parse({});
      
      expect(config.includeRename).toBe(true);
      expect(config.includeMerge).toBe(true);
      expect(config.includeDeprecate).toBe(false);
      expect(config.minConfidence).toBe(0.95);
      expect(config.maxSuggestions).toBe(20);
    });
    
    it('should validate minConfidence range', () => {
      expect(() => RefactoringConfigSchema.parse({ minConfidence: -0.1 })).toThrow();
      expect(() => RefactoringConfigSchema.parse({ minConfidence: 1.1 })).toThrow();
      expect(() => RefactoringConfigSchema.parse({ minConfidence: 0.8 })).not.toThrow();
    });
    
    it('should validate maxSuggestions range', () => {
      expect(() => RefactoringConfigSchema.parse({ maxSuggestions: 0 })).toThrow();
      expect(() => RefactoringConfigSchema.parse({ maxSuggestions: 101 })).toThrow();
      expect(() => RefactoringConfigSchema.parse({ maxSuggestions: 50 })).not.toThrow();
    });
  });
  
  describe('ReasoningConfigSchema', () => {
    it('should apply default values', () => {
      const config = ReasoningConfigSchema.parse({});
      
      expect(config.maxIterations).toBe(10);
      expect(config.initialStage).toBe('Problem Definition');
      expect(config.enableCache).toBe(false);
    });
    
    it('should validate maxIterations range', () => {
      expect(() => ReasoningConfigSchema.parse({ maxIterations: 0 })).toThrow();
      expect(() => ReasoningConfigSchema.parse({ maxIterations: 51 })).toThrow();
      expect(() => ReasoningConfigSchema.parse({ maxIterations: 25 })).not.toThrow();
    });
    
    it('should validate initialStage enum', () => {
      expect(() => ReasoningConfigSchema.parse({ initialStage: 'Invalid' })).toThrow();
      expect(() => ReasoningConfigSchema.parse({ initialStage: 'Analysis' })).not.toThrow();
    });
  });
  
  describe('ConfigManager', () => {
    let manager: ConfigManager;
    
    beforeEach(() => {
      manager = new ConfigManager();
    });
    
    it('should initialize with default configuration', () => {
      const bughunterConfig = manager.getBughunterConfig();
      expect(bughunterConfig.minSeverity).toBe('medium');
      expect(bughunterConfig.maxFiles).toBe(1000);
    });
    
    it('should accept partial user configuration', () => {
      const customManager = new ConfigManager({
        bughunter: { minSeverity: 'high' as const, maxFiles: 500 },
      });
      
      const config = customManager.getBughunterConfig();
      expect(config.minSeverity).toBe('high');
      expect(config.maxFiles).toBe(500);
      expect(config.enableCache).toBe(true); // Default preserved
    });
    
    it('should support hot-reload configuration updates', () => {
      manager.updateConfig({
        audit: { minScore: 75 },
      });
      
      const config = manager.getAuditConfig();
      expect(config.minScore).toBe(75);
    });
    
    it('should preserve unmodified configuration during updates', () => {
      const originalBughunter = manager.getBughunterConfig();
      
      manager.updateConfig({
        audit: { minScore: 80 },
      });
      
      const updatedBughunter = manager.getBughunterConfig();
      expect(updatedBughunter).toEqual(originalBughunter);
    });
    
    it('should validate configuration during updates', () => {
      expect(() => {
        manager.updateConfig({
          bughunter: { minSeverity: 'invalid' as any },
        });
      }).toThrow();
    });
    
    it('should reset to defaults', () => {
      manager.updateConfig({
        bughunter: { minSeverity: 'critical' },
        audit: { minScore: 90 },
      });
      
      manager.resetToDefaults();
      
      expect(manager.getBughunterConfig().minSeverity).toBe('medium');
      expect(manager.getAuditConfig().minScore).toBe(0);
    });
    
    it('should return full configuration copy', () => {
      const config = manager.getFullConfig();
      
      expect(config).toHaveProperty('bughunter');
      expect(config).toHaveProperty('audit');
      expect(config).toHaveProperty('signalScan');
      expect(config).toHaveProperty('analysis');
      expect(config).toHaveProperty('refactoring');
      expect(config).toHaveProperty('reasoning');
    });
    
    it('should validate user configuration statically', () => {
      const validConfig = {
        bughunter: { minSeverity: 'high' as const },
      };
      const result = ConfigManager.validate(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
    
    it('should report validation errors statically', () => {
      const invalidConfig = {
        bughunter: { minSeverity: 'invalid' },
      };
      const result = ConfigManager.validate(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
    
    it('should provide detailed error messages', () => {
      const invalidConfig = {
        audit: { minScore: 150 },
      };
      const result = ConfigManager.validate(invalidConfig);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(e => e.includes('minScore'))).toBe(true);
    });
  });
});
