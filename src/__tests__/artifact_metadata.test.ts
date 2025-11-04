/**
 * Artifact Metadata and Versioning Tests
 * 
 * Validates version registry, cache tagging, and invalidation logic.
 * 
 * @module artifact_metadata.test
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ArtifactVersionRegistry, CacheTagger } from '../artifacts/artifact_metadata';
import { ArtifactEngine } from '../artifacts/artifact_engine';
import { ArtifactRenderer } from '../artifacts/types';

describe('ArtifactVersionRegistry', () => {
  let registry: ArtifactVersionRegistry;

  beforeEach(() => {
    registry = new ArtifactVersionRegistry();
  });

  describe('Version Registration', () => {
    it('should register renderer versions successfully', () => {
      registry.registerVersion('signal_map', '2.0.0');
      registry.registerVersion('hop_dashboard', '1.5.0');

      expect(registry.getVersion('signal_map')).toBe('2.0.0');
      expect(registry.getVersion('hop_dashboard')).toBe('1.5.0');
    });

    it('should return default version for unregistered types', () => {
      const version = registry.getVersion('unknown_type');
      
      expect(version).toBe('1.0.0');
    });

    it('should update version when re-registered', () => {
      registry.registerVersion('signal_map', '1.0.0');
      registry.registerVersion('signal_map', '2.0.0');

      expect(registry.getVersion('signal_map')).toBe('2.0.0');
    });

    it('should validate semantic version format', () => {
      expect(() => {
        registry.registerVersion('test', 'invalid');
      }).toThrow('Invalid version format');

      expect(() => {
        registry.registerVersion('test', '1.2');
      }).toThrow('Invalid version format');

      expect(() => {
        registry.registerVersion('test', 'v1.0.0');
      }).toThrow('Invalid version format');
    });

    it('should reject empty renderer types', () => {
      expect(() => {
        registry.registerVersion('', '1.0.0');
      }).toThrow('Renderer type cannot be empty');

      expect(() => {
        registry.registerVersion('   ', '1.0.0');
      }).toThrow('Renderer type cannot be empty');
    });
  });

  describe('Version Retrieval', () => {
    it('should check if version is registered', () => {
      registry.registerVersion('signal_map', '2.0.0');

      expect(registry.hasVersion('signal_map')).toBe(true);
      expect(registry.hasVersion('unknown')).toBe(false);
    });

    it('should get all registered versions', () => {
      registry.registerVersion('signal_map', '2.0.0');
      registry.registerVersion('hop_dashboard', '1.5.0');

      const allVersions = registry.getAllVersions();

      expect(allVersions.size).toBe(2);
      expect(allVersions.get('signal_map')).toBe('2.0.0');
      expect(allVersions.get('hop_dashboard')).toBe('1.5.0');
    });

    it('should clear all versions', () => {
      registry.registerVersion('signal_map', '2.0.0');
      registry.registerVersion('hop_dashboard', '1.5.0');

      registry.clear();

      expect(registry.hasVersion('signal_map')).toBe(false);
      expect(registry.hasVersion('hop_dashboard')).toBe(false);
    });
  });
});

describe('CacheTagger', () => {
  const testData = { signals: ['signal1', 'signal2'], count: 2 };

  describe('Cache Key Generation', () => {
    it('should generate cache keys with version', () => {
      const key1 = CacheTagger.generateKey('signal_map', testData, '1.0.0');
      const key2 = CacheTagger.generateKey('signal_map', testData, '2.0.0');

      expect(key1).toContain('signal_map:');
      expect(key2).toContain('signal_map:');
      expect(key1).not.toBe(key2); // Different versions produce different keys
    });

    it('should include version in hash computation', () => {
      const sameData = { signals: ['signal1', 'signal2'], count: 2 };
      
      const keyV1 = CacheTagger.generateKey('signal_map', sameData, '1.0.0');
      const keyV2 = CacheTagger.generateKey('signal_map', sameData, '2.0.0');

      // Same data, different versions -> different cache keys
      expect(keyV1).not.toBe(keyV2);
    });

    it('should produce consistent keys for same data and version', () => {
      const key1 = CacheTagger.generateKey('signal_map', testData, '1.0.0');
      const key2 = CacheTagger.generateKey('signal_map', testData, '1.0.0');

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different data', () => {
      const data1 = { signals: ['signal1'], count: 1 };
      const data2 = { signals: ['signal2'], count: 1 };

      const key1 = CacheTagger.generateKey('signal_map', data1, '1.0.0');
      const key2 = CacheTagger.generateKey('signal_map', data2, '1.0.0');

      expect(key1).not.toBe(key2);
    });
  });

  describe('Legacy Cache Key Generation', () => {
    it('should generate keys without version for backward compatibility', () => {
      const legacyKey = CacheTagger.generateKeyLegacy('signal_map', testData);
      const versionedKey = CacheTagger.generateKey('signal_map', testData, '1.0.0');

      expect(legacyKey).toContain('signal_map:');
      expect(legacyKey).not.toBe(versionedKey); // Legacy keys differ from versioned
    });

    it('should produce consistent legacy keys', () => {
      const key1 = CacheTagger.generateKeyLegacy('signal_map', testData);
      const key2 = CacheTagger.generateKeyLegacy('signal_map', testData);

      expect(key1).toBe(key2);
    });
  });

  describe('Version Extraction', () => {
    it('should extract version from cache entry', () => {
      const entry = {
        metadata: { type: 'signal_map', title: 'Test', timestamp: 123 },
        html: '<div>test</div>',
        dataHash: 'abc123',
        schemaVersion: '2.0.0',
      };

      const version = CacheTagger.extractVersion(entry);
      expect(version).toBe('2.0.0');
    });

    it('should return undefined for entries without version', () => {
      const entry = {
        metadata: { type: 'signal_map', title: 'Test', timestamp: 123 },
        html: '<div>test</div>',
        dataHash: 'abc123',
      };

      const version = CacheTagger.extractVersion(entry);
      expect(version).toBeUndefined();
    });
  });
});

describe('ArtifactEngine Integration', () => {
  let engine: ArtifactEngine;
  let mockRenderer: ArtifactRenderer;

  beforeEach(() => {
    engine = new ArtifactEngine();
    
    mockRenderer = {
      type: 'test_renderer',
      render: async (data: unknown) => {
        return `<div>Rendered: ${JSON.stringify(data)}</div>`;
      },
    };
  });

  describe('Version-Aware Rendering', () => {
    it('should register renderer with version', () => {
      engine.registerRenderer(mockRenderer, '2.0.0');

      const registry = engine.getVersionRegistry();
      expect(registry.getVersion('test_renderer')).toBe('2.0.0');
    });

    it('should use default version if not specified', () => {
      engine.registerRenderer(mockRenderer);

      const registry = engine.getVersionRegistry();
      expect(registry.getVersion('test_renderer')).toBe('1.0.0');
    });

    it('should cache artifacts with schema version', async () => {
      engine.registerRenderer(mockRenderer, '2.0.0');

      const testData = { value: 42 };
      const result = await engine.renderArtifact('test_renderer', testData);

      expect(result.cached).toBe(false);
      expect(result.html).toContain('Rendered');

      // Second render should hit cache
      const cachedResult = await engine.renderArtifact('test_renderer', testData);
      expect(cachedResult.cached).toBe(true);
    });

    it('should invalidate cache when version changes', async () => {
      const testData = { value: 42 };

      // First render with v1.0.0
      engine.registerRenderer(mockRenderer, '1.0.0');
      const result1 = await engine.renderArtifact('test_renderer', testData);
      expect(result1.cached).toBe(false);

      // Second render with same version should hit cache
      const result2 = await engine.renderArtifact('test_renderer', testData);
      expect(result2.cached).toBe(true);

      // Create new engine with v2.0.0
      const engine2 = new ArtifactEngine();
      engine2.registerRenderer(mockRenderer, '2.0.0');

      // Should NOT hit cache (version changed)
      const result3 = await engine2.renderArtifact('test_renderer', testData);
      expect(result3.cached).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle Phase 1 renderers without versions', async () => {
      engine.registerRenderer(mockRenderer); // No version specified

      const testData = { value: 42 };
      const result = await engine.renderArtifact('test_renderer', testData);

      expect(result.cached).toBe(false);
      expect(result.html).toContain('Rendered');
    });

    it('should not collide with Phase 2 cached artifacts', async () => {
      const testData = { value: 42 };

      // Phase 1 style (no version)
      const engine1 = new ArtifactEngine();
      engine1.registerRenderer(mockRenderer);
      await engine1.renderArtifact('test_renderer', testData);

      // Phase 2 style (with version)
      const engine2 = new ArtifactEngine();
      engine2.registerRenderer(mockRenderer, '2.0.0');
      const result = await engine2.renderArtifact('test_renderer', testData);

      // Should be separate cache entries (different engines, different keys)
      expect(result.cached).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should add <1ms overhead for cache key generation', async () => {
      engine.registerRenderer(mockRenderer, '2.0.0');

      const testData = { value: 42 };
      const iterations = 100;

      const startTime = Date.now();
      for (let i = 0; i < iterations; i++) {
        // Generate cache key (this is what adds overhead)
        CacheTagger.generateKey('test_renderer', testData, '2.0.0');
      }
      const duration = Date.now() - startTime;

      // 100 iterations should complete in well under 100ms (1ms per iteration)
      expect(duration).toBeLessThan(100);

      // Average should be <1ms per key generation
      const avgPerIteration = duration / iterations;
      expect(avgPerIteration).toBeLessThan(1);
    });
  });
});
