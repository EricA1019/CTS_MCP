/**
 * Artifact Metadata and Versioning System
 * 
 * Provides schema versioning and cache invalidation infrastructure
 * to support multiple renderer versions coexisting.
 * 
 * Design Pattern: Registry + Strategy
 * - ArtifactVersionRegistry: Centralized version management
 * - CacheTagger: Version-aware cache key generation
 * 
 * @module artifact_metadata
 */

import { createHash } from 'crypto';

/**
 * Central registry for artifact renderer schema versions.
 * 
 * Tracks version strings for each renderer type, enabling cache
 * invalidation when renderer schemas change.
 * 
 * @example
 * ```typescript
 * const registry = new ArtifactVersionRegistry();
 * registry.registerVersion('signal_map', '2.0.0');
 * registry.registerVersion('hop_dashboard', '1.1.0');
 * 
 * const version = registry.getVersion('signal_map'); // '2.0.0'
 * ```
 */
export class ArtifactVersionRegistry {
  private versions: Map<string, string> = new Map();
  private readonly defaultVersion = '1.0.0';

  /**
   * Register or update a renderer's schema version.
   * 
   * @param {string} type - Renderer type identifier (e.g., 'signal_map')
   * @param {string} version - Semantic version string (e.g., '2.1.0')
   * 
   * @example
   * ```typescript
   * registry.registerVersion('signal_map_v2', '2.0.0');
   * ```
   */
  registerVersion(type: string, version: string): void {
    if (!type || type.trim().length === 0) {
      throw new Error('Renderer type cannot be empty');
    }

    if (!this.isValidVersion(version)) {
      throw new Error(
        `Invalid version format: ${version}. Expected semantic version (e.g., '1.0.0')`
      );
    }

    this.versions.set(type, version);
  }

  /**
   * Get registered version for a renderer type.
   * 
   * @param {string} type - Renderer type identifier
   * @returns {string} Version string or default '1.0.0' if not registered
   * 
   * @example
   * ```typescript
   * const version = registry.getVersion('signal_map'); // '2.0.0' or '1.0.0'
   * ```
   */
  getVersion(type: string): string {
    return this.versions.get(type) ?? this.defaultVersion;
  }

  /**
   * Check if a version is registered for a type.
   * 
   * @param {string} type - Renderer type identifier
   * @returns {boolean} True if version is explicitly registered
   */
  hasVersion(type: string): boolean {
    return this.versions.has(type);
  }

  /**
   * Get all registered type-version pairs.
   * 
   * @returns {Map<string, string>} Copy of versions map
   */
  getAllVersions(): Map<string, string> {
    return new Map(this.versions);
  }

  /**
   * Clear all registered versions (for testing).
   */
  clear(): void {
    this.versions.clear();
  }

  /**
   * Validate semantic version format.
   * 
   * @private
   */
  private isValidVersion(version: string): boolean {
    // Basic semver validation: X.Y.Z where X, Y, Z are integers
    const semverRegex = /^\d+\.\d+\.\d+$/;
    return semverRegex.test(version);
  }
}

/**
 * Cache key generation utility with schema version tagging.
 * 
 * Extends Phase 1 SHA-256 hashing to include renderer version,
 * ensuring cache invalidation when schemas change.
 */
export class CacheTagger {
  /**
   * Generate version-aware cache key.
   * 
   * Combines renderer type, data hash, and schema version into
   * a single cache key. Version changes invalidate cached artifacts.
   * 
   * @param {string} type - Renderer type identifier
   * @param {unknown} data - Artifact data to hash
   * @param {string} version - Renderer schema version
   * @returns {string} Cache key incorporating version
   * 
   * @example
   * ```typescript
   * const key1 = CacheTagger.generateKey('signal_map', data, '1.0.0');
   * const key2 = CacheTagger.generateKey('signal_map', data, '2.0.0');
   * // key1 !== key2 (version change invalidates cache)
   * ```
   */
  static generateKey(type: string, data: unknown, version: string): string {
    // Hash data + version together to ensure version changes invalidate cache
    const dataJson = JSON.stringify(data);
    const versionedInput = `${dataJson}::version=${version}`;
    
    const hash = createHash('sha256')
      .update(versionedInput)
      .digest('hex')
      .substring(0, 16);

    return `${type}:${hash}`;
  }

  /**
   * Generate cache key without version (backward compatibility).
   * 
   * Used for Phase 1 caches that don't have versioning.
   * 
   * @param {string} type - Renderer type identifier
   * @param {unknown} data - Artifact data to hash
   * @returns {string} Cache key without version
   */
  static generateKeyLegacy(type: string, data: unknown): string {
    const dataJson = JSON.stringify(data);
    const hash = createHash('sha256')
      .update(dataJson)
      .digest('hex')
      .substring(0, 16);

    return `${type}:${hash}`;
  }

  /**
   * Extract version from cache entry if present.
   * 
   * @param {any} entry - Cache entry potentially containing schemaVersion
   * @returns {string | undefined} Version string if present
   */
  static extractVersion(entry: any): string | undefined {
    return entry?.schemaVersion;
  }
}
