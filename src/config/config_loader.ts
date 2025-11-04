/**
 * Configuration Loader for CTS MCP
 * 
 * Loads .ctsrc.json configuration files with cascading resolution:
 * 1. Project-level: <projectPath>/.ctsrc.json
 * 2. User-level: ~/.ctsrc.json
 * 3. Defaults: hardcoded in schemas
 * 
 * Features:
 * - File-based configuration (JSON)
 * - Hot-reload with file watching
 * - Cascading config resolution
 * - CTS rule customization (file size, hop size, etc.)
 * - Team-specific standards
 * 
 * Following Quinn's testing methodology:
 * - Comprehensive validation with Zod
 * - Type-safe configuration
 * - Error handling for missing/invalid files
 * - Observable config changes
 */

import { z } from 'zod';
import { readFileSync, existsSync, watchFile, unwatchFile } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { ToolConfigSchema, ToolConfig, ConfigManager } from './tool_config.js';

/**
 * CTS Rule Thresholds
 * Customizable limits for CTS compliance rules
 */
export const CTSRuleThresholdsSchema = z.object({
  // File size limits
  maxFileLines: z.number().min(100).max(2000).default(500),
  maxFunctionLines: z.number().min(10).max(200).default(50),
  maxClassLines: z.number().min(50).max(1000).default(300),
  
  // Hop size limits
  maxHopLOC: z.number().min(100).max(5000).default(1500),
  maxSubHops: z.number().min(1).max(10).default(5),
  
  // Complexity thresholds
  maxCyclomaticComplexity: z.number().min(5).max(50).default(10),
  maxNestingDepth: z.number().min(2).max(10).default(4),
  
  // Signal architecture
  minSignalUsage: z.number().min(0).max(100).default(70), // % of events that use signals
  maxDirectCalls: z.number().min(0).max(100).default(30), // % of direct function calls allowed
  
  // Code quality
  requireTypeHints: z.boolean().default(true),
  requireDocstrings: z.boolean().default(false),
  minTestCoverage: z.number().min(0).max(100).default(0), // % coverage
});

export type CTSRuleThresholds = z.infer<typeof CTSRuleThresholdsSchema>;

/**
 * Project-level .ctsrc.json schema
 * 
 * Example:
 * ```json
 * {
 *   "rules": {
 *     "maxFileLines": 750,
 *     "requireTypeHints": false
 *   },
 *   "exclusions": ["..tests/..", "..examples/.."],
 *   "tools": {
 *     "audit": {
 *       "minScore": 75
 *     }
 *   }
 * }
 * ```
 */
export const ProjectConfigSchema = z.object({
  // CTS rule customization
  rules: CTSRuleThresholdsSchema.partial().optional(),
  
  // File/directory exclusions (glob patterns)
  exclusions: z.array(z.string()).optional(),
  
  // Tool-specific configuration
  tools: ToolConfigSchema.optional(),
  
  // Team metadata
  team: z.object({
    name: z.string().optional(),
    standards: z.string().optional(), // Link to team standards doc
  }).optional(),
  
  // Version (for future compatibility)
  version: z.string().default('1.0'),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

/**
 * Merged configuration after cascading resolution
 */
export interface MergedConfig {
  rules: CTSRuleThresholds;
  exclusions: string[];
  tools: ToolConfig;
  team?: {
    name?: string;
    standards?: string;
  };
  sources: {
    project?: string;
    user?: string;
    defaults: true;
  };
}

/**
 * Configuration change event
 */
export type ConfigChangeHandler = (config: MergedConfig) => void;

/**
 * Configuration Loader
 * 
 * Manages cascading configuration loading and hot-reload
 */
export class ConfigLoader {
  private mergedConfig: MergedConfig;
  private configManager: ConfigManager;
  private projectConfigPath?: string;
  private userConfigPath: string;
  private watchers: Set<string> = new Set();
  private changeHandlers: Set<ConfigChangeHandler> = new Set();
  
  constructor() {
    this.userConfigPath = join(homedir(), '.ctsrc.json');
    this.mergedConfig = this.getDefaultConfig();
    this.configManager = new ConfigManager();
  }
  
  /**
   * Load configuration for a specific project
   * 
   * Cascading resolution:
   * 1. Load user config (~/.ctsrc.json)
   * 2. Load project config (<projectPath>/.ctsrc.json)
   * 3. Merge with defaults
   * 
   * @param projectPath - Absolute path to project directory
   * @returns Merged configuration
   */
  loadConfig(projectPath: string): MergedConfig {
    // Start with defaults
    let config = this.getDefaultConfig();
    const sources: MergedConfig['sources'] = { defaults: true };
    
    // Layer 1: User-level config
    const userConfig = this.loadConfigFile(this.userConfigPath);
    if (userConfig) {
      config = this.mergeConfigs(config, userConfig);
      sources.user = this.userConfigPath;
    }
    
    // Layer 2: Project-level config
    this.projectConfigPath = join(projectPath, '.ctsrc.json');
    const projectConfig = this.loadConfigFile(this.projectConfigPath);
    if (projectConfig) {
      config = this.mergeConfigs(config, projectConfig);
      sources.project = this.projectConfigPath;
    }
    
    config.sources = sources;
    this.mergedConfig = config;
    
    // Update tool config manager
    this.configManager.updateConfig(config.tools);
    
    return config;
  }
  
  /**
   * Enable hot-reload for configuration files
   * 
   * Watches project and user config files for changes
   * and automatically reloads configuration
   * 
   * @param projectPath - Project directory to watch
   */
  enableHotReload(projectPath: string): void {
    this.stopWatching();
    
    const filesToWatch = [
      this.userConfigPath,
      join(projectPath, '.ctsrc.json'),
    ].filter(existsSync);
    
    for (const file of filesToWatch) {
      watchFile(file, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          console.log(`[ConfigLoader] Config file changed: ${file}`);
          const newConfig = this.loadConfig(projectPath);
          this.notifyConfigChange(newConfig);
        }
      });
      this.watchers.add(file);
    }
    
    console.log(`[ConfigLoader] Hot-reload enabled (watching ${this.watchers.size} files)`);
  }
  
  /**
   * Stop watching configuration files
   */
  stopWatching(): void {
    for (const file of this.watchers) {
      unwatchFile(file);
    }
    this.watchers.clear();
  }
  
  /**
   * Register a handler for configuration changes
   * 
   * @param handler - Callback function called when config changes
   */
  onConfigChange(handler: ConfigChangeHandler): void {
    this.changeHandlers.add(handler);
  }
  
  /**
   * Unregister a configuration change handler
   */
  offConfigChange(handler: ConfigChangeHandler): void {
    this.changeHandlers.delete(handler);
  }
  
  /**
   * Get current merged configuration
   */
  getConfig(): MergedConfig {
    return this.mergedConfig;
  }
  
  /**
   * Get tool configuration manager
   */
  getToolConfigManager(): ConfigManager {
    return this.configManager;
  }
  
  /**
   * Load configuration from a file
   * 
   * @param filePath - Path to .ctsrc.json file
   * @returns Parsed config or null if file doesn't exist/invalid
   */
  private loadConfigFile(filePath: string): ProjectConfig | null {
    if (!existsSync(filePath)) {
      return null;
    }
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const json = JSON.parse(content);
      const validated = ProjectConfigSchema.parse(json);
      return validated;
    } catch (error) {
      console.error(`[ConfigLoader] Failed to load config from ${filePath}:`, error);
      return null;
    }
  }
  
  /**
   * Merge two configurations (right overrides left)
   */
  private mergeConfigs(base: MergedConfig, override: ProjectConfig): MergedConfig {
    return {
      rules: {
        ...base.rules,
        ...(override.rules || {}),
      },
      exclusions: override.exclusions || base.exclusions,
      tools: {
        ...base.tools,
        ...(override.tools || {}),
      },
      team: override.team || base.team,
      sources: base.sources,
    };
  }
  
  /**
   * Get default configuration
   */
  private getDefaultConfig(): MergedConfig {
    return {
      rules: CTSRuleThresholdsSchema.parse({}),
      exclusions: ['**/addons/**', '**/.godot/**', '**/build/**', '**/dist/**'],
      tools: {},
      sources: { defaults: true },
    };
  }
  
  /**
   * Notify all handlers of configuration change
   */
  private notifyConfigChange(newConfig: MergedConfig): void {
    for (const handler of this.changeHandlers) {
      try {
        handler(newConfig);
      } catch (error) {
        console.error('[ConfigLoader] Error in config change handler:', error);
      }
    }
  }
  
  /**
   * Create example .ctsrc.json file content
   * 
   * @returns JSON string with all configuration options documented
   */
  static generateExampleConfig(): string {
    return JSON.stringify({
      "$schema": "https://example.com/ctsrc-schema.json",
      "version": "1.0",
      
      "rules": {
        "maxFileLines": 500,
        "maxFunctionLines": 50,
        "maxClassLines": 300,
        "maxHopLOC": 1500,
        "maxSubHops": 5,
        "maxCyclomaticComplexity": 10,
        "maxNestingDepth": 4,
        "minSignalUsage": 70,
        "maxDirectCalls": 30,
        "requireTypeHints": true,
        "requireDocstrings": false,
        "minTestCoverage": 0
      },
      
      "exclusions": [
        "**/addons/**",
        "**/.godot/**",
        "**/tests/**",
        "**/examples/**"
      ],
      
      "tools": {
        "bughunter": {
          "minSeverity": "medium",
          "maxFiles": 1000,
          "excludePatterns": ["**/addons/**", "**/.godot/**"],
          "enableCache": true
        },
        "audit": {
          "categories": ["cts", "code_quality", "project_structure"],
          "minScore": 75,
          "format": "json"
        },
        "signalScan": {
          "renderMap": true,
          "includePrivate": false
        },
        "analysis": {
          "detectUnused": true,
          "buildHierarchy": true,
          "minClusterSize": 5
        },
        "refactoring": {
          "includeRename": true,
          "includeMerge": true,
          "minConfidence": 0.95,
          "maxSuggestions": 20
        },
        "reasoning": {
          "maxIterations": 10,
          "initialStage": "Problem Definition"
        }
      },
      
      "team": {
        "name": "Your Team Name",
        "standards": "https://link-to-your-coding-standards.com"
      }
    }, null, 2);
  }
}

/**
 * Global config loader instance
 */
export const globalConfigLoader = new ConfigLoader();

