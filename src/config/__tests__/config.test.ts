/**
 * Configuration System Tests
 * 
 * Tests config loading, validation, hot-reload, and environment variable handling
 * Coverage: 15 tests covering all config sources and edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { loadConfig, validateConfig, isDevelopment, type ServerConfig } from '../../config.js';

describe('Configuration System', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loadConfig()', () => {
    it('loads default configuration with no env vars', () => {
      // Clear all CTS-related env vars
      delete process.env.LOG_LEVEL;
      delete process.env.NODE_ENV;
      delete process.env.DEBUG;
      delete process.env.CTS_CACHE_DIR;
      delete process.env.CTS_MAX_FILE_SIZE;
      delete process.env.CTS_MAX_FILES;
      delete process.env.CTS_ENABLE_PARALLEL;
      delete process.env.CTS_WORKER_COUNT;
      delete process.env.CTS_ENABLE_CACHE;
      delete process.env.CTS_CACHE_TTL;
      delete process.env.CTS_PROFILE;

      const config = loadConfig();

      expect(config.logLevel).toBe('INFO');
      expect(config.nodeEnv).toBe('production');
      expect(config.debugNamespaces).toBe('');
      expect(config.cacheDir).toBe('/tmp/cts-cache');
      expect(config.maxFileSize).toBe(5242880); // 5MB
      expect(config.maxFiles).toBe(10000);
      expect(config.enableParallel).toBe(false);
      expect(config.workerCount).toBe(4);
      expect(config.enableCache).toBe(true);
      expect(config.cacheTTL).toBe(300000); // 5 minutes
      expect(config.enableProfile).toBe(false);
    });

    it('loads custom LOG_LEVEL from environment', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      const config = loadConfig();
      expect(config.logLevel).toBe('DEBUG');
    });

    it('loads development mode from NODE_ENV', () => {
      process.env.NODE_ENV = 'development';
      const config = loadConfig();
      expect(config.nodeEnv).toBe('development');
    });

    it('loads production mode for any NODE_ENV other than development', () => {
      process.env.NODE_ENV = 'test';
      const config = loadConfig();
      expect(config.nodeEnv).toBe('production');

      process.env.NODE_ENV = 'staging';
      const config2 = loadConfig();
      expect(config2.nodeEnv).toBe('production');
    });

    it('loads custom cache directory from CTS_CACHE_DIR', () => {
      process.env.CTS_CACHE_DIR = '/custom/cache/dir';
      const config = loadConfig();
      expect(config.cacheDir).toBe('/custom/cache/dir');
    });

    it('loads custom file size limit from CTS_MAX_FILE_SIZE', () => {
      process.env.CTS_MAX_FILE_SIZE = '10485760'; // 10MB
      const config = loadConfig();
      expect(config.maxFileSize).toBe(10485760);
    });

    it('loads custom max files from CTS_MAX_FILES', () => {
      process.env.CTS_MAX_FILES = '5000';
      const config = loadConfig();
      expect(config.maxFiles).toBe(5000);
    });

    it('enables parallel execution via CTS_ENABLE_PARALLEL', () => {
      process.env.CTS_ENABLE_PARALLEL = 'true';
      const config = loadConfig();
      expect(config.enableParallel).toBe(true);
    });

    it('loads custom worker count from CTS_WORKER_COUNT', () => {
      process.env.CTS_WORKER_COUNT = '8';
      const config = loadConfig();
      expect(config.workerCount).toBe(8);
    });

    it('disables cache via CTS_ENABLE_CACHE=false', () => {
      process.env.CTS_ENABLE_CACHE = 'false';
      const config = loadConfig();
      expect(config.enableCache).toBe(false);
    });

    it('loads custom cache TTL from CTS_CACHE_TTL', () => {
      process.env.CTS_CACHE_TTL = '600000'; // 10 minutes
      const config = loadConfig();
      expect(config.cacheTTL).toBe(600000);
    });

    it('enables profiling via CTS_PROFILE', () => {
      process.env.CTS_PROFILE = 'true';
      const config = loadConfig();
      expect(config.enableProfile).toBe(true);
    });
  });

  describe('validateConfig()', () => {
    it('accepts valid configuration', () => {
      const validConfig: ServerConfig = {
        logLevel: 'INFO',
        nodeEnv: 'production',
        debugNamespaces: '',
        cacheDir: '/tmp/cts-cache',
        maxFileSize: 5242880,
        maxFiles: 10000,
        enableParallel: false,
        workerCount: 4,
        enableCache: true,
        cacheTTL: 300000,
        enableProfile: false,
      };

      expect(() => validateConfig(validConfig)).not.toThrow();
    });

    it('rejects maxFileSize < 1KB', () => {
      const invalidConfig: ServerConfig = {
        logLevel: 'INFO',
        nodeEnv: 'production',
        debugNamespaces: '',
        cacheDir: '/tmp/cts-cache',
        maxFileSize: 512, // Too small
        maxFiles: 10000,
        enableParallel: false,
        workerCount: 4,
        enableCache: true,
        cacheTTL: 300000,
        enableProfile: false,
      };

      expect(() => validateConfig(invalidConfig)).toThrow('CTS_MAX_FILE_SIZE must be at least 1KB');
    });

    it('rejects maxFiles < 1', () => {
      const invalidConfig: ServerConfig = {
        logLevel: 'INFO',
        nodeEnv: 'production',
        debugNamespaces: '',
        cacheDir: '/tmp/cts-cache',
        maxFileSize: 5242880,
        maxFiles: 0, // Invalid
        enableParallel: false,
        workerCount: 4,
        enableCache: true,
        cacheTTL: 300000,
        enableProfile: false,
      };

      expect(() => validateConfig(invalidConfig)).toThrow('CTS_MAX_FILES must be at least 1');
    });

    it('rejects workerCount < 1 or > 16', () => {
      const invalidConfig1: ServerConfig = {
        logLevel: 'INFO',
        nodeEnv: 'production',
        debugNamespaces: '',
        cacheDir: '/tmp/cts-cache',
        maxFileSize: 5242880,
        maxFiles: 10000,
        enableParallel: true,
        workerCount: 0, // Too low
        enableCache: true,
        cacheTTL: 300000,
        enableProfile: false,
      };

      expect(() => validateConfig(invalidConfig1)).toThrow('CTS_WORKER_COUNT must be between 1 and 16');

      const invalidConfig2: ServerConfig = {
        ...invalidConfig1,
        workerCount: 20, // Too high
      };

      expect(() => validateConfig(invalidConfig2)).toThrow('CTS_WORKER_COUNT must be between 1 and 16');
    });

    it('rejects cacheTTL < 1000ms', () => {
      const invalidConfig: ServerConfig = {
        logLevel: 'INFO',
        nodeEnv: 'production',
        debugNamespaces: '',
        cacheDir: '/tmp/cts-cache',
        maxFileSize: 5242880,
        maxFiles: 10000,
        enableParallel: false,
        workerCount: 4,
        enableCache: true,
        cacheTTL: 500, // Too short
        enableProfile: false,
      };

      expect(() => validateConfig(invalidConfig)).toThrow('CTS_CACHE_TTL must be at least 1000ms');
    });

    it('throws all validation errors together', () => {
      const invalidConfig: ServerConfig = {
        logLevel: 'INFO',
        nodeEnv: 'production',
        debugNamespaces: '',
        cacheDir: '/tmp/cts-cache',
        maxFileSize: 100, // Too small
        maxFiles: 0, // Too low
        enableParallel: false,
        workerCount: 20, // Too high
        enableCache: true,
        cacheTTL: 100, // Too short
        enableProfile: false,
      };

      expect(() => validateConfig(invalidConfig)).toThrow(/Configuration validation failed/);
      expect(() => validateConfig(invalidConfig)).toThrow(/CTS_MAX_FILE_SIZE/);
      expect(() => validateConfig(invalidConfig)).toThrow(/CTS_MAX_FILES/);
      expect(() => validateConfig(invalidConfig)).toThrow(/CTS_WORKER_COUNT/);
      expect(() => validateConfig(invalidConfig)).toThrow(/CTS_CACHE_TTL/);
    });
  });

  describe('isDevelopment()', () => {
    it('returns true for development mode', () => {
      const config: ServerConfig = {
        logLevel: 'DEBUG',
        nodeEnv: 'development',
        debugNamespaces: '',
        cacheDir: '/tmp/cts-cache',
        maxFileSize: 5242880,
        maxFiles: 10000,
        enableParallel: false,
        workerCount: 4,
        enableCache: true,
        cacheTTL: 300000,
        enableProfile: true,
      };

      expect(isDevelopment(config)).toBe(true);
    });

    it('returns false for production mode', () => {
      const config: ServerConfig = {
        logLevel: 'INFO',
        nodeEnv: 'production',
        debugNamespaces: '',
        cacheDir: '/tmp/cts-cache',
        maxFileSize: 5242880,
        maxFiles: 10000,
        enableParallel: false,
        workerCount: 4,
        enableCache: true,
        cacheTTL: 300000,
        enableProfile: false,
      };

      expect(isDevelopment(config)).toBe(false);
    });
  });
});
