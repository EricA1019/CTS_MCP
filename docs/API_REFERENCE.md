# CTS MCP Server - API Reference

**Version**: 3.0.0  
**Last Updated**: November 2, 2025

## Table of Contents

1. [Core Infrastructure](#core-infrastructure)
2. [Tool Schemas](#tool-schemas)
3. [Error Types](#error-types)
4. [Observability API](#observability-api)
5. [Configuration API](#configuration-api)
6. [Cache API](#cache-api)
7. [Sampling API](#sampling-api)
8. [Type Definitions](#type-definitions)

---

## Core Infrastructure

### Server Initialization

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'cts-mcp-server',
  version: '3.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tool Registration

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'CTS_Export_to_Shrimp',
      description: 'Convert hop plan to Shrimp tasks',
      inputSchema: {
        type: 'object',
        properties: {
          hopPlan: { type: 'object' },
          generateSubTasks: { type: 'boolean' },
          updateMode: { type: 'string', enum: ['append', 'overwrite', 'selective', 'clearAllTasks'] },
        },
        required: ['hopPlan'],
      },
    },
    // ... other tools
  ],
}));
```

---

## Tool Schemas

### 1. CTS_Export_to_Shrimp

**Zod Schema**:
```typescript
const HopPlanSchema = z.object({
  hopId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  estimatedLOC: z.number().int().positive(),
  deliverables: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  subHops: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    estimatedLOC: z.number().int().positive(),
    deliverables: z.array(z.string()).optional(),
  })).optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  technicalNotes: z.string().optional(),
});

const ExportToShrimpInputSchema = z.object({
  hopPlan: HopPlanSchema,
  generateSubTasks: z.boolean().default(true),
  updateMode: z.enum(['append', 'overwrite', 'selective', 'clearAllTasks']).default('append'),
});

const ExportToShrimpOutputSchema = z.object({
  success: z.boolean(),
  tasksCreated: z.number().int().nonnegative(),
  taskIds: z.array(z.string().uuid()),
  updateMode: z.string(),
  shrimpResponse: z.string().optional(),
});
```

**TypeScript Types**:
```typescript
type HopPlan = z.infer<typeof HopPlanSchema>;
type ExportToShrimpInput = z.infer<typeof ExportToShrimpInputSchema>;
type ExportToShrimpOutput = z.infer<typeof ExportToShrimpOutputSchema>;
```

---

### 2. CTS_Render_Artifact

**Zod Schema**:
```typescript
const ArtifactMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

const RenderArtifactInputSchema = z.object({
  artifactType: z.enum([
    'signal_map',
    'signal_map_v2',
    'dependency_graph',
    'performance_trends',
    'hop_dashboard',
  ]),
  data: z.record(z.any()), // Structure varies by type
  metadata: ArtifactMetadataSchema.optional(),
});

const RenderArtifactOutputSchema = z.object({
  html: z.string(),
  artifactType: z.string(),
  metadata: ArtifactMetadataSchema.optional(),
  renderTime: z.number().optional(),
});
```

**Signal Map V2 Data Schema**:
```typescript
const SignalMapV2DataSchema = z.object({
  signals: z.array(z.object({
    name: z.string(),
    emitters: z.array(z.string()),
    receivers: z.array(z.string()),
    filePath: z.string().optional(),
    lineNumber: z.number().int().optional(),
  })),
  clusteringEnabled: z.boolean().default(true),
  showLabels: z.boolean().default(true),
  minClusterSize: z.number().int().min(2).max(10).default(5),
});
```

---

### 3. CTS_Scan_Project_Signals

**Zod Schema**:
```typescript
const ScanProjectInputSchema = z.object({
  projectPath: z.string().min(1),
  renderMap: z.boolean().default(true),
  _bypassCache: z.boolean().optional(),
});

const SignalDefinitionSchema = z.object({
  name: z.string(),
  emitters: z.array(z.string()),
  receivers: z.array(z.string()),
  filePath: z.string().optional(),
  lineNumber: z.number().int().optional(),
});

const ScanProjectOutputSchema = z.object({
  signals: z.array(SignalDefinitionSchema),
  projectPath: z.string(),
  scanDuration: z.number(),
  htmlArtifact: z.string().optional(),
  cacheHit: z.boolean().optional(),
});
```

---

### 4. CTS_Analyze_Project

**Zod Schema**:
```typescript
const AnalyzeProjectInputSchema = z.object({
  projectPath: z.string().min(1),
  detectUnused: z.boolean().default(true),
  buildHierarchy: z.boolean().default(true),
  performanceBaseline: z.boolean().default(false),
  minClusterSize: z.number().int().min(2).max(10).default(5),
  _bypassCache: z.boolean().optional(),
});

const UnusedSignalsSchema = z.object({
  orphans: z.array(z.string()),
  deadEmitters: z.array(z.string()),
  isolated: z.array(z.string()),
});

const SignalClusterSchema = z.object({
  id: z.string(),
  signals: z.array(z.string()),
  label: z.string(),
  size: z.number().int(),
});

const AnalyzeProjectOutputSchema = z.object({
  totalSignals: z.number().int(),
  unusedSignals: UnusedSignalsSchema.optional(),
  hierarchy: z.object({
    clusters: z.array(SignalClusterSchema),
    labels: z.array(z.string()),
  }).optional(),
  performance: z.object({
    parseTime: z.number(),
    clusteringTime: z.number(),
    memoryUsage: z.number(),
  }).optional(),
});
```

---

### 5. CTS_Suggest_Refactoring

**Zod Schema**:
```typescript
const SuggestRefactoringInputSchema = z.object({
  projectPath: z.string().min(1),
  includeRename: z.boolean().default(true),
  includeMerge: z.boolean().default(true),
  includeDeprecate: z.boolean().default(false),
  minConfidence: z.number().min(0.0).max(1.0).default(0.95),
  maxSuggestions: z.number().int().min(1).max(100).default(20),
  _bypassCache: z.boolean().optional(),
});

const RefactoringSuggestionSchema = z.object({
  type: z.enum(['rename', 'merge', 'deprecate']),
  signalName: z.string(),
  suggestion: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  impact: z.array(z.string()).optional(),
});

const SuggestRefactoringOutputSchema = z.object({
  suggestions: z.array(RefactoringSuggestionSchema),
  totalAnalyzed: z.number().int(),
});
```

---

### 6. CTS_Reasoning

**Zod Schema**:
```typescript
const ReasoningStageSchema = z.enum([
  'Problem Definition',
  'Information Gathering',
  'Research',
  'Analysis',
  'Synthesis',
  'Conclusion',
  'Critical Questioning',
  'Planning',
]);

const ReasoningInputSchema = z.object({
  topic: z.string().min(5),
  context: z.string().optional(),
  initialStage: ReasoningStageSchema.default('Problem Definition'),
  maxIterations: z.number().int().min(1).max(50).default(10),
  stageSequence: z.array(ReasoningStageSchema).optional(),
  previousThoughts: z.array(z.string()).optional(),
});

const ThoughtIterationSchema = z.object({
  iteration: z.number().int(),
  stage: ReasoningStageSchema,
  thought: z.string(),
  timestamp: z.number(),
});

const ReasoningOutputSchema = z.object({
  thoughts: z.array(ThoughtIterationSchema),
  finalConclusion: z.string(),
  converged: z.boolean(),
  totalIterations: z.number().int(),
});
```

---

### 7. CTS_Bughunter

**Zod Schema**:
```typescript
const BughunterInputSchema = z.object({
  projectPath: z.string().min(1),
  minSeverity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  exportFormat: z.enum(['json', 'markdown', 'cts_plan']).default('json'),
  excludePatterns: z.array(z.string()).default(['**/addons/**', '**/.godot/**']),
  maxFiles: z.number().int().min(1).max(10000).optional(),
});

const BugReportSchema = z.object({
  file: z.string(),
  line: z.number().int(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  pattern: z.string(),
  message: z.string(),
  suggestion: z.string(),
});

const BughunterOutputSchema = z.object({
  bugs: z.array(BugReportSchema),
  summary: z.object({
    totalFiles: z.number().int(),
    bugsFound: z.number().int(),
    severityBreakdown: z.record(z.string(), z.number().int()),
  }),
});
```

---

### 8. CTS_Cleanup

**Zod Schema**:
```typescript
const CleanupInputSchema = z.object({
  projectPath: z.string().min(1),
  dryRun: z.boolean().default(true),
  strategies: z.array(z.enum(['dead_code', 'duplicates'])).default(['dead_code']),
  exclusions: z.array(z.string()).default(['**/.godot/**', '*.import']),
  requireCleanGit: z.boolean().default(true),
  maxActions: z.number().int().default(100),
});

const CleanupActionSchema = z.object({
  type: z.enum(['remove_file', 'remove_import', 'remove_function']),
  file: z.string(),
  line: z.number().int().optional(),
  description: z.string(),
  savings: z.number().int().optional(), // Bytes
});

const CleanupOutputSchema = z.object({
  actions: z.array(CleanupActionSchema),
  summary: z.object({
    filesAnalyzed: z.number().int(),
    actionsProposed: z.number().int(),
    potentialSavings: z.number().int(),
  }),
  rollbackScript: z.string().optional(),
});
```

---

### 9. CTS_Audit_Project

**Zod Schema**:
```typescript
const AuditCategorySchema = z.enum(['cts', 'code_quality', 'project_structure']);

const AuditInputSchema = z.object({
  projectPath: z.string().min(1),
  categories: z.array(AuditCategorySchema).optional(),
  minScore: z.number().int().min(0).max(100).default(0),
  format: z.enum(['json', 'markdown']).default('json'),
});

const ViolationSchema = z.object({
  category: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  file: z.string(),
  line: z.number().int().optional(),
  message: z.string(),
});

const RecommendationSchema = z.object({
  priority: z.enum(['low', 'medium', 'high']),
  effort: z.enum(['small', 'medium', 'large']),
  description: z.string(),
  impact: z.string(),
});

const AuditOutputSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  categoryScores: z.record(z.string(), z.number().int()),
  violations: z.array(ViolationSchema),
  recommendations: z.array(RecommendationSchema),
  metrics: z.object({
    totalFiles: z.number().int(),
    totalLOC: z.number().int(),
    averageComplexity: z.number(),
    testCoverage: z.number(),
  }),
});
```

---

## Error Types

### Base Error Class

```typescript
export class CTSError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CTSError';
  }

  toMCPError(): McpError {
    return new McpError(
      ErrorCode.InternalError,
      `${this.code}: ${this.message}`,
      this.details
    );
  }
}
```

### Validation Error

```typescript
export class CTSValidationError extends CTSError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'CTSValidationError';
  }
}

// Usage
throw new CTSValidationError('Invalid hop plan', {
  field: 'estimatedLOC',
  value: -100,
  expected: 'positive integer',
});
```

### Parse Error

```typescript
export class CTSParseError extends CTSError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'PARSE_ERROR', details);
    this.name = 'CTSParseError';
  }
}

// Usage
throw new CTSParseError('Failed to parse GDScript file', {
  file: '/path/to/file.gd',
  line: 42,
  parser: 'tree-sitter',
});
```

### File System Error

```typescript
export class CTSFileSystemError extends CTSError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'FILESYSTEM_ERROR', details);
    this.name = 'CTSFileSystemError';
  }
}

// Usage
throw new CTSFileSystemError('Project path not found', {
  path: '/nonexistent/path',
  suggestion: 'Verify the project path exists and is accessible',
});
```

### Error Handling Pattern

```typescript
try {
  const result = await executeToolLogic(args);
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
} catch (error) {
  if (error instanceof CTSError) {
    throw error.toMCPError();
  }
  throw new McpError(
    ErrorCode.InternalError,
    `Unexpected error: ${error.message}`
  );
}
```

---

## Observability API

### Logger

```typescript
import { Logger, LogLevel } from './observability/index.js';

// Create logger with minimum level and default context
const logger = new Logger(LogLevel.INFO, { service: 'cts-mcp' });

// Log messages
logger.debug('Debug message', { operation: 'cache_read' });
logger.info('Tool executed', { toolName: 'CTS_Scan_Project', duration: 245 });
logger.warn('Cache size approaching limit', { currentSize: 95, maxSize: 100 });
logger.error('Tool execution failed', { error: 'Project path not found' });

// Create child logger with additional context
const childLogger = logger.child({ component: 'bughunter' });
childLogger.info('Starting bug scan', { files: 50 });
```

**Logger Constructor**:
```typescript
constructor(
  minLevel: LogLevel = LogLevel.INFO,
  context: Record<string, any> = {}
)
```

**LogLevel Enum**:
```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}
```

**Methods**:
- `debug(message: string, context?: LogContext): void`
- `info(message: string, context?: LogContext): void`
- `warn(message: string, context?: LogContext): void`
- `error(message: string, context?: LogContext): void`
- `child(context: Record<string, any>): Logger`

---

### MetricsCollector

```typescript
import { MetricsCollector } from './observability/index.js';

const metrics = new MetricsCollector();

// Record basic metric
metrics.recordMetric('cache_size', 95, 'count', { cache: 'result' });

// Record tool execution
metrics.recordToolExecution(
  'CTS_Scan_Project',
  245,        // duration (ms)
  true,       // success
  true        // cache hit
);

// Get metrics for specific tool
const toolMetrics = metrics.getToolMetrics('CTS_Scan_Project');
console.log(toolMetrics);
// {
//   toolName: 'CTS_Scan_Project',
//   executionCount: 10,
//   totalDuration: 2450,
//   averageDuration: 245,
//   minDuration: 120,
//   maxDuration: 500,
//   errorCount: 0,
//   cacheHitRate: 0.8,
//   lastExecuted: 1698765432000
// }

// Get summary across all tools
const summary = metrics.getSummary();
console.log(summary);
// {
//   totalTools: 9,
//   totalExecutions: 1234,
//   errorCount: 12,
//   averageCacheHitRate: 0.67
// }

// Reset all metrics
metrics.reset();
```

**Methods**:
- `recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void`
- `recordToolExecution(toolName: string, duration: number, success: boolean, cacheHit: boolean): void`
- `getToolMetrics(toolName?: string): ToolMetrics | ToolMetrics[]`
- `getSummary(): MetricsSummary`
- `reset(): void`

---

### Prometheus Export

```typescript
import { exportPrometheusMetrics } from './observability/index.js';

const metricsText = exportPrometheusMetrics();
console.log(metricsText);
```

**Output Format**:
```
# HELP cts_tool_executions_total Total number of tool executions
# TYPE cts_tool_executions_total counter
cts_tool_executions_total{tool="CTS_Scan_Project"} 456

# HELP cts_tool_duration_seconds Tool execution duration
# TYPE cts_tool_duration_seconds histogram
cts_tool_duration_seconds_sum{tool="CTS_Scan_Project"} 112.34
cts_tool_duration_seconds_count{tool="CTS_Scan_Project"} 456

# HELP cts_tool_errors_total Total number of tool errors
# TYPE cts_tool_errors_total counter
cts_tool_errors_total{tool="CTS_Scan_Project"} 3

# HELP cts_cache_hit_rate Cache hit rate per tool
# TYPE cts_cache_hit_rate gauge
cts_cache_hit_rate{tool="CTS_Scan_Project"} 0.82
```

---

### Performance Monitoring Decorator

```typescript
import { monitored } from './observability/index.js';

class MyTool {
  @monitored
  async expensiveOperation() {
    // Automatically logs execution time and errors
    await doWork();
  }
}
```

**Manual Instrumentation** (if decorators not supported):
```typescript
import { logger, metrics } from './observability/index.js';

async function expensiveOperation() {
  const startTime = performance.now();
  let success = true;
  
  try {
    await doWork();
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    logger.info('Operation complete', { duration, success });
    metrics.recordToolExecution('MyTool', duration, success, false);
  }
}
```

---

## Configuration API

### ConfigManager

```typescript
import { ConfigManager } from './config/manager.js';

const config = new ConfigManager();

// Load configuration from file
await config.load('.cts-mcp.json');

// Get configuration value
const cacheSize = config.get('cache.maxSize');  // 100
const logLevel = config.get('logging.level');   // 'info'

// Get with default
const customValue = config.get('custom.value', 'default');

// Update configuration
config.update({
  cache: {
    maxSize: 200,
    ttlMs: 600000,
  },
});

// Save configuration to file
await config.save('.cts-mcp.json');

// Watch for file changes (hot-reload)
config.watch('.cts-mcp.json', (newConfig) => {
  logger.info('Configuration reloaded', newConfig);
});
```

**Methods**:
- `load(path: string): Promise<void>`
- `get<T>(key: string, defaultValue?: T): T`
- `update(partial: Partial<Config>): void`
- `save(path: string): Promise<void>`
- `watch(path: string, callback: (config: Config) => void): void`
- `validate(): void` - Throws CTSValidationError if invalid

**Configuration Schema**:
```typescript
interface Config {
  cache: {
    maxSize: number;
    ttlMs: number;
    enablePersistence?: boolean;
  };
  sampling: {
    largeArrayThreshold: number;
    sampleSize: number;
    strategy: 'random' | 'stratified';
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'human' | 'json';
    enableConsole: boolean;
    enableFile?: boolean;
    filePath?: string;
  };
  performance: {
    enableMetrics: boolean;
    exportPrometheus: boolean;
    metricsPort?: number;
    budgets: {
      syncToolMaxMs: number;
      asyncToolMaxMs: number;
    };
  };
  parser: {
    wasmPath: string;
    fallbackToRegex: boolean;
    cacheParseResults: boolean;
  };
  tools: Record<string, any>;
}
```

---

## Cache API

### ResultCache

```typescript
import { ResultCache } from './cache/result-cache.js';

const cache = new ResultCache(
  100,      // maxSize
  300000    // ttlMs (5 minutes)
);

// Generate cache key
const key = cache.generateKey('CTS_Scan_Project', { projectPath: '/path' });
// 'tool:CTS_Scan_Project:sha256...'

// Set value
cache.set(key, { signals: [...], scanDuration: 245 });

// Get value
const cachedResult = cache.get(key);
if (cachedResult) {
  logger.info('Cache hit', { key });
} else {
  logger.info('Cache miss', { key });
}

// Check if key exists
const exists = cache.has(key);

// Delete specific key
cache.delete(key);

// Clear all entries
cache.clear();

// Get cache statistics
const stats = cache.getStats();
console.log(stats);
// {
//   size: 50,
//   maxSize: 100,
//   hitRate: 0.75,
//   hits: 300,
//   misses: 100
// }
```

**Methods**:
- `generateKey(toolName: string, args: any): string` - SHA-256 hash
- `get<T>(key: string): T | undefined`
- `set<T>(key: string, value: T): void`
- `has(key: string): boolean`
- `delete(key: string): boolean`
- `clear(): void`
- `getStats(): CacheStats`

**CacheStats Interface**:
```typescript
interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
}
```

---

## Sampling API

### StratifiedSampler

```typescript
import { StratifiedSampler } from './sampling/stratified.js';

const sampler = new StratifiedSampler(1000, 100); // threshold, sampleSize

// Sample large array
const largeArray = Array.from({ length: 5000 }, (_, i) => ({ id: i }));
const sample = sampler.sample(largeArray);
console.log(sample.length); // 100

// Small arrays pass through unchanged
const smallArray = Array.from({ length: 500 }, (_, i) => ({ id: i }));
const result = sampler.sample(smallArray);
console.log(result.length); // 500 (not sampled)

// Check if array needs sampling
const needsSampling = sampler.shouldSample(largeArray);
console.log(needsSampling); // true
```

**Methods**:
- `sample<T>(array: T[]): T[]` - Stratified sampling
- `shouldSample(array: any[]): boolean`

**Sampling Strategy**:
1. Divide array into `sampleSize` equal strata
2. Randomly select one item from each stratum
3. Preserves distribution while reducing size

---

## Type Definitions

### Common Types

```typescript
// Signal Definition
interface SignalDefinition {
  name: string;
  emitters: string[];
  receivers: string[];
  filePath?: string;
  lineNumber?: number;
}

// Signal Cluster
interface SignalCluster {
  id: string;
  signals: string[];
  label: string;
  size: number;
}

// Tool Metrics
interface ToolMetrics {
  toolName: string;
  executionCount: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  errorCount: number;
  cacheHitRate: number;
  lastExecuted: number;
}

// Metrics Summary
interface MetricsSummary {
  totalTools: number;
  totalExecutions: number;
  errorCount: number;
  averageCacheHitRate: number;
}

// Log Context
interface LogContext {
  [key: string]: any;
}

// Metric Data
interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}
```

### MCP Protocol Types

```typescript
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Tool Request
interface ToolRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments?: Record<string, any>;
  };
}

// Tool Response
interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// Error Response
interface ErrorResponse {
  error: {
    code: number;
    message: string;
    data?: any;
  };
}
```

---

## Usage Examples

### Complete Tool Execution Flow

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ResultCache } from './cache/result-cache.js';
import { logger, metrics } from './observability/index.js';
import { ExportToShrimpInputSchema, ExportToShrimpOutputSchema } from './schemas.js';

// Initialize infrastructure
const cache = new ResultCache(100, 300000);

// Register tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'CTS_Export_to_Shrimp') {
    const startTime = performance.now();
    let success = true;
    let cacheHit = false;

    try {
      // Validate input
      const validatedInput = ExportToShrimpInputSchema.parse(args);

      // Check cache
      const cacheKey = cache.generateKey(name, args);
      let result = cache.get(cacheKey);

      if (result) {
        cacheHit = true;
        logger.info('Cache hit', { tool: name });
      } else {
        // Execute tool logic
        result = await exportToShrimp(validatedInput);

        // Cache result
        cache.set(cacheKey, result);
        logger.info('Result cached', { tool: name, key: cacheKey });
      }

      // Validate output
      const validatedOutput = ExportToShrimpOutputSchema.parse(result);

      // Record metrics
      const duration = performance.now() - startTime;
      metrics.recordToolExecution(name, duration, true, cacheHit);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(validatedOutput),
        }],
      };
    } catch (error) {
      success = false;
      const duration = performance.now() - startTime;
      metrics.recordToolExecution(name, duration, false, false);

      if (error instanceof z.ZodError) {
        logger.error('Validation error', { tool: name, errors: error.errors });
        throw new CTSValidationError('Invalid input', { errors: error.errors }).toMCPError();
      }

      logger.error('Tool execution failed', { tool: name, error: error.message });
      throw new McpError(ErrorCode.InternalError, error.message);
    }
  }
});
```

---

**For additional examples and guides, see**:
- [MCP Server Guide](./MCP_SERVER_GUIDE.md) - Complete usage guide
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Tier 2C Improvements](./TIER_2C_IMPROVEMENTS.md) - Technical details
