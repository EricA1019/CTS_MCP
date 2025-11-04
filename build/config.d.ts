/**
 * CTS MCP Server Configuration
 * Centralized environment variable handling
 */
export interface ServerConfig {
    logLevel: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
    nodeEnv: 'production' | 'development';
    debugNamespaces: string;
    cacheDir: string;
    maxFileSize: number;
    maxFiles: number;
    enableParallel: boolean;
    workerCount: number;
    enableCache: boolean;
    cacheTTL: number;
    enableProfile: boolean;
}
/**
 * Load configuration from environment variables
 */
export declare function loadConfig(): ServerConfig;
/**
 * Validate configuration values
 */
export declare function validateConfig(config: ServerConfig): void;
/**
 * Get development mode status
 */
export declare function isDevelopment(config: ServerConfig): boolean;
/**
 * Get debug mode status
 */
export declare function isDebugEnabled(config: ServerConfig): boolean;
/**
 * Format configuration for logging
 */
export declare function formatConfig(config: ServerConfig): string;
export declare function getConfig(): ServerConfig;
export declare function resetConfig(): void;
//# sourceMappingURL=config.d.ts.map