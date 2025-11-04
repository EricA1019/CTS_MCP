/**
 * CTS MCP Server Configuration
 * Centralized environment variable handling
 */

export interface ServerConfig {
  // Logging
  logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  nodeEnv: 'production' | 'development';
  debugNamespaces: string;

  // Paths
  cacheDir: string;
  maxFileSize: number;
  maxFiles: number;

  // Performance
  enableParallel: boolean;
  workerCount: number;
  enableCache: boolean;
  cacheTTL: number;
  enableProfile: boolean;
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): ServerConfig {
  return {
    // Logging
    logLevel: (process.env.LOG_LEVEL as ServerConfig['logLevel']) || 'INFO',
    nodeEnv: (process.env.NODE_ENV === 'development' ? 'development' : 'production'),
    debugNamespaces: process.env.DEBUG || '',

    // Paths
    cacheDir: process.env.CTS_CACHE_DIR || '/tmp/cts-cache',
    maxFileSize: parseInt(process.env.CTS_MAX_FILE_SIZE || '5242880', 10),
    maxFiles: parseInt(process.env.CTS_MAX_FILES || '10000', 10),

    // Performance
    enableParallel: process.env.CTS_ENABLE_PARALLEL === 'true',
    workerCount: parseInt(process.env.CTS_WORKER_COUNT || '4', 10),
    enableCache: process.env.CTS_ENABLE_CACHE !== 'false',
    cacheTTL: parseInt(process.env.CTS_CACHE_TTL || '300000', 10),
    enableProfile: process.env.CTS_PROFILE === 'true',
  };
}

/**
 * Validate configuration values
 */
export function validateConfig(config: ServerConfig): void {
  const errors: string[] = [];

  if (config.maxFileSize < 1024) {
    errors.push('CTS_MAX_FILE_SIZE must be at least 1KB');
  }

  if (config.maxFiles < 1) {
    errors.push('CTS_MAX_FILES must be at least 1');
  }

  if (config.workerCount < 1 || config.workerCount > 16) {
    errors.push('CTS_WORKER_COUNT must be between 1 and 16');
  }

  if (config.cacheTTL < 1000) {
    errors.push('CTS_CACHE_TTL must be at least 1000ms (1 second)');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get development mode status
 */
export function isDevelopment(config: ServerConfig): boolean {
  return config.nodeEnv === 'development';
}

/**
 * Get debug mode status
 */
export function isDebugEnabled(config: ServerConfig): boolean {
  return config.logLevel === 'DEBUG' || config.debugNamespaces.length > 0;
}

/**
 * Format configuration for logging
 */
export function formatConfig(config: ServerConfig): string {
  return JSON.stringify({
    logLevel: config.logLevel,
    nodeEnv: config.nodeEnv,
    cacheDir: config.cacheDir,
    maxFileSize: `${(config.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
    maxFiles: config.maxFiles,
    enableParallel: config.enableParallel,
    workerCount: config.workerCount,
    enableCache: config.enableCache,
    cacheTTL: `${(config.cacheTTL / 1000).toFixed(0)}s`,
    enableProfile: config.enableProfile,
  }, null, 2);
}

// Export singleton instance
let configInstance: ServerConfig | null = null;

export function getConfig(): ServerConfig {
  if (!configInstance) {
    configInstance = loadConfig();
    validateConfig(configInstance);
  }
  return configInstance;
}

export function resetConfig(): void {
  configInstance = null;
}
