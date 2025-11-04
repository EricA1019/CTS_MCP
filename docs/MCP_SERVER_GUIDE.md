# CTS MCP Server - Complete Guide

**Version**: 3.0.0  
**Last Updated**: November 2, 2025  
**Protocol**: Model Context Protocol 2024-11-05

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Architecture Overview](#architecture-overview)
5. [Tool Reference](#tool-reference)
6. [Configuration](#configuration)
7. [Observability](#observability)
8. [Performance Optimization](#performance-optimization)
9. [Development Workflow](#development-workflow)
10. [Deployment](#deployment)

---

## Introduction

The CTS MCP Server is a production-ready Model Context Protocol server that automates Close-to-Shore (CTS) methodology for Godot game development. It provides:

- **Automated Task Creation**: Convert hop plans to Shrimp tasks
- **Signal Architecture Analysis**: Parse and visualize EventBus/SignalBus connections
- **Interactive Visualizations**: D3.js signal maps, hop dashboards, dependency graphs
- **Code Quality Tools**: Bug hunting, code cleanup, project auditing
- **Template-Driven Reasoning**: Multi-stage thinking with state management

### Key Features (v3.0.0)

**Tier 2C Improvements** (Production Hardening):
- ✅ **Result Caching**: LRU cache with SHA-256 hashing (<2ms cache operations)
- ✅ **Hot-Reload Configuration**: JSON-based config with validation
- ✅ **Stratified Sampling**: Efficient large dataset handling (<5ms for small arrays)
- ✅ **Enhanced Error Handling**: Actionable error messages with recovery suggestions
- ✅ **Schema Validation**: Zod schemas for all tool inputs/outputs
- ✅ **Tool Integration**: Consistent interface across all 9 tools

**Tier 3 Infrastructure**:
- ✅ **CI/CD Pipeline**: GitHub Actions with test, performance, quality, security jobs
- ✅ **NPM Package**: Scoped package `@broken-divinity/cts-mcp-server`
- ✅ **Docker Support**: Multi-stage Alpine image (150-200MB)
- ✅ **Observability**: Structured logging, metrics collection, Prometheus export

**Performance Metrics**:
- Cache operations: <2ms (P99)
- Configuration reads: <100ms
- Sampling (small arrays): <5ms
- Sampling (large arrays): <100ms
- AST parsing: <50ms per file, <1ms cached

---

## Installation

### Prerequisites

- **Node.js**: ≥18.0.0 (for ESM and WASM support)
- **npm**: ≥8.0.0
- **Operating System**: Linux, macOS, Windows (WSL recommended)

### Standard Installation

```bash
# Clone the repository
cd cts_mcp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify installation
npm test
```

### Docker Installation

```bash
# Build Docker image
docker build -t cts-mcp-server:3.0.0 .

# Run container
docker run -i cts-mcp-server:3.0.0

# Using docker-compose (development)
docker-compose up dev

# Using docker-compose (production)
docker-compose up prod
```

See [PACKAGING.md](./PACKAGING.md) for complete Docker deployment guide.

### NPM Package (Scoped)

```bash
# Install from npm (when published)
npm install -g @broken-divinity/cts-mcp-server

# Run server
cts-mcp-server
```

---

## Quick Start

### Starting the Server

The CTS MCP Server uses **stdio transport** (JSON-RPC 2.0 over stdin/stdout):

```bash
node build/index.js
```

**Expected Output**:
```
[2025-11-02T12:00:00.000Z] INFO CTS MCP Server starting {"version":"3.0.0"}
[2025-11-02T12:00:00.010Z] INFO Configuration loaded {"cacheSize":100,"logLevel":"info"}
[2025-11-02T12:00:00.020Z] INFO Server ready on stdio transport
```

### Configuration

Create `.cts-mcp.json` in your project root:

```json
{
  "cache": {
    "maxSize": 100,
    "ttlMs": 300000
  },
  "sampling": {
    "largeArrayThreshold": 1000,
    "sampleSize": 100
  },
  "logging": {
    "level": "info",
    "format": "human"
  },
  "performance": {
    "enableMetrics": true,
    "exportPrometheus": true
  }
}
```

See [Configuration](#configuration) section for all options.

### Basic Tool Call

```bash
# List available tools
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}' | node build/index.js

# Call CTS_Export_to_Shrimp
echo '{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "CTS_Export_to_Shrimp",
    "arguments": {
      "hopPlan": {
        "hopId": "5.2a",
        "name": "Expert Collaboration MCP",
        "description": "Build expert meeting system",
        "estimatedLOC": 400,
        "deliverables": ["Meeting templates", "Expert roster"],
        "dependencies": []
      }
    }
  }
}' | node build/index.js
```

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Client (VS Code)                    │
└────────────────────┬────────────────────────────────────────┘
                     │ JSON-RPC 2.0 (stdio)
┌────────────────────▼────────────────────────────────────────┐
│                  CTS MCP Server (Node.js)                   │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   Result   │  │   Config   │  │   Observability      │  │
│  │   Cache    │  │  Manager   │  │  (Logger/Metrics)    │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     Tool Registry (9 tools)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CTS_Export_to_Shrimp │ CTS_Render_Artifact          │  │
│  │ CTS_Scan_Project     │ CTS_Analyze_Project          │  │
│  │ CTS_Suggest_Refactor │ CTS_Reasoning                │  │
│  │ CTS_Bughunter        │ CTS_Cleanup                  │  │
│  │ CTS_Audit_Project                                     │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Core Infrastructure                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │  Tree-     │  │  Schema    │  │   Error Handling     │  │
│  │  Sitter    │  │  Validator │  │  (CTSError types)    │  │
│  │  (WASM)    │  │  (Zod)     │  │                      │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │ Shrimp  │         │  Godot  │         │  File   │
    │   MCP   │         │ Project │         │ System  │
    └─────────┘         └─────────┘         └─────────┘
```

### Data Flow

1. **Client Request**: VS Code MCP client sends JSON-RPC request via stdin
2. **Cache Check**: Result cache checks for cached response (SHA-256 hash)
3. **Validation**: Zod schemas validate input parameters
4. **Tool Execution**: Tool logic executes with observability tracking
5. **Sampling** (if applicable): Large datasets sampled using stratified sampling
6. **Response**: JSON-RPC response sent via stdout
7. **Metrics**: Performance metrics recorded for Prometheus export

### Caching Strategy (Tier 2C.5)

**LRU Cache with SHA-256 Hashing**:
- Cache key: SHA-256(toolName + JSON.stringify(args))
- Max size: Configurable (default 100 entries)
- TTL: Configurable (default 5 minutes)
- Performance: <2ms cache read/write (P99)

**Cacheable Tools**:
- `CTS_Scan_Project`: Expensive AST parsing
- `CTS_Analyze_Project`: Complex signal analysis
- `CTS_Suggest_Refactoring`: Levenshtein similarity matrix
- `CTS_Render_Artifact`: Large D3.js visualizations

**Cache Bypass**:
```json
{
  "arguments": {
    "projectPath": "/path/to/project",
    "_bypassCache": true
  }
}
```

---

## Tool Reference

### 1. CTS_Export_to_Shrimp

**Purpose**: Convert CTS hop plans to Shrimp task format for automated task creation.

**Input Schema**:
```typescript
{
  hopPlan: {
    hopId: string;            // e.g., "5.2a"
    name: string;
    description: string;
    estimatedLOC: number;
    deliverables?: string[];
    dependencies?: string[];
    subHops?: SubHop[];
    acceptanceCriteria?: string[];
    technicalNotes?: string;
  };
  generateSubTasks?: boolean; // Default: true
  updateMode?: 'append' | 'overwrite' | 'selective' | 'clearAllTasks';
}
```

**Output Schema**:
```typescript
{
  success: boolean;
  tasksCreated: number;
  taskIds: string[];
  updateMode: string;
  shrimpResponse?: string;
}
```

**Example**:
```json
{
  "hopPlan": {
    "hopId": "5.2a",
    "name": "Expert Collaboration MCP",
    "description": "Build expert meeting system with templates",
    "estimatedLOC": 400,
    "deliverables": ["Meeting templates", "Expert roster", "Export to Shrimp"],
    "dependencies": ["5.1a"]
  },
  "generateSubTasks": true,
  "updateMode": "append"
}
```

**Performance**: <100ms (meets sync budget)

---

### 2. CTS_Render_Artifact

**Purpose**: Generate interactive HTML visualizations (signal maps, hop dashboards, dependency graphs).

**Supported Artifact Types**:
- `signal_map`: Force-directed signal graph (D3.js)
- `signal_map_v2`: Clustered signal map with community detection
- `dependency_graph`: Hierarchical signal connections
- `performance_trends`: Time-series performance monitoring
- `hop_dashboard`: CTS hop status board (React)

**Input Schema**:
```typescript
{
  artifactType: 'signal_map' | 'signal_map_v2' | 'dependency_graph' | 'performance_trends' | 'hop_dashboard';
  data: object;  // Structure varies by type
  metadata?: {
    title?: string;
    description?: string;
  };
}
```

**Example (Signal Map V2)**:
```json
{
  "artifactType": "signal_map_v2",
  "data": {
    "signals": [
      {"name": "player_health_changed", "emitters": ["Player"], "receivers": ["HealthUI", "GameManager"]},
      {"name": "enemy_defeated", "emitters": ["Enemy"], "receivers": ["ScoreManager", "QuestSystem"]}
    ],
    "clusteringEnabled": true,
    "showLabels": true
  },
  "metadata": {
    "title": "Combat System Signals",
    "description": "Health and enemy defeat event flow"
  }
}
```

**Output**: HTML string with embedded D3.js visualization

**Performance**: <400ms for 150-300 signals (clustered)

---

### 3. CTS_Scan_Project_Signals

**Purpose**: Scan Godot project for EventBus/SignalBus signal definitions using Tree-sitter AST parsing.

**Input Schema**:
```typescript
{
  projectPath: string;
  renderMap?: boolean;  // Default: true
}
```

**Output Schema**:
```typescript
{
  signals: SignalDefinition[];
  projectPath: string;
  scanDuration: number;
  htmlArtifact?: string;
}

interface SignalDefinition {
  name: string;
  emitters: string[];
  receivers: string[];
  filePath?: string;
  lineNumber?: number;
}
```

**Performance**: 
- AST parsing: <50ms per file (first scan), <1ms (cached)
- Full project scan: ~500ms for 20-30 files

**Caching**: Results cached for 5 minutes (configurable)

---

### 4. CTS_Analyze_Project

**Purpose**: Comprehensive signal intelligence with unused detection, hierarchical clustering, and performance monitoring.

**Input Schema**:
```typescript
{
  projectPath: string;
  detectUnused?: boolean;      // Default: true
  buildHierarchy?: boolean;    // Default: true
  performanceBaseline?: boolean; // Default: false
  minClusterSize?: number;     // Default: 5, range: 2-10
}
```

**Output Schema**:
```typescript
{
  totalSignals: number;
  unusedSignals?: {
    orphans: string[];        // No emitters or receivers
    deadEmitters: string[];   // Has emitters but no receivers
    isolated: string[];       // No connections to other signals
  };
  hierarchy?: {
    clusters: SignalCluster[];
    labels: string[];         // TF-IDF generated cluster labels
  };
  performance?: {
    parseTime: number;
    clusteringTime: number;
    memoryUsage: number;
  };
}
```

**Performance**:
- Clustering: <3ms for 150 nodes (greedy modularity optimization)
- Full analysis: <2s for medium projects (50-100 files)

---

### 5. CTS_Suggest_Refactoring

**Purpose**: AI-powered refactoring suggestions using Levenshtein similarity and GDScript naming validation.

**Input Schema**:
```typescript
{
  projectPath: string;
  includeRename?: boolean;      // Default: true
  includeMerge?: boolean;       // Default: true
  includeDeprecate?: boolean;   // Default: false
  minConfidence?: number;       // Default: 0.95, range: 0.0-1.0
  maxSuggestions?: number;      // Default: 20, max: 100
}
```

**Output Schema**:
```typescript
{
  suggestions: RefactoringSuggestion[];
  totalAnalyzed: number;
}

interface RefactoringSuggestion {
  type: 'rename' | 'merge' | 'deprecate';
  signalName: string;
  suggestion: string;
  confidence: number;
  reason: string;
  impact?: string[];  // Files affected
}
```

**Example Suggestions**:
- **Rename**: `playerHealth` → `player_health_changed` (snake_case convention)
- **Merge**: `enemyDied` + `enemyDefeated` → `enemy_defeated` (similar names)
- **Deprecate**: `oldSignal` → Unused for >90 days

**Performance**: <1s for 100-200 signals

---

### 6. CTS_Reasoning

**Purpose**: Template-driven reasoning engine with state management and convergence detection.

**Input Schema**:
```typescript
{
  topic: string;                // Min 5 characters
  context?: string;
  initialStage?: 'Problem Definition' | 'Information Gathering' | 'Research' | 'Analysis' | 'Synthesis' | 'Conclusion' | 'Critical Questioning' | 'Planning';
  maxIterations?: number;       // Default: 10, range: 1-50
  stageSequence?: string[];     // Custom stage order
  previousThoughts?: string[];  // Build on prior reasoning
}
```

**Reasoning Stages**:
1. **Problem Definition**: Clarify the problem space
2. **Information Gathering**: Collect relevant data
3. **Research**: Deep investigation of technical details
4. **Analysis**: Break down complex information
5. **Synthesis**: Combine insights into solutions
6. **Conclusion**: Formulate final recommendations
7. **Critical Questioning**: Challenge assumptions
8. **Planning**: Create actionable steps

**Output Schema**:
```typescript
{
  thoughts: ThoughtIteration[];
  finalConclusion: string;
  converged: boolean;
  totalIterations: number;
}
```

**Performance**: <5s per iteration, <50s for full reasoning cycle

---

### 7. CTS_Bughunter

**Purpose**: Heuristic pattern detection for common GDScript bugs.

**Input Schema**:
```typescript
{
  projectPath: string;
  minSeverity?: 'low' | 'medium' | 'high' | 'critical'; // Default: 'medium'
  exportFormat?: 'json' | 'markdown' | 'cts_plan';      // Default: 'json'
  excludePatterns?: string[];  // Default: ['**/addons/**', '**/.godot/**']
  maxFiles?: number;           // Range: 1-10000
}
```

**Bug Patterns Detected**:
- **Null Checks**: Missing null checks before dereferencing
- **Error Handling**: Unchecked error returns
- **Type Mismatches**: Incompatible type assignments
- **Signal Leaks**: Unfreed signal connections
- **Unfreed Nodes**: Missing `queue_free()` calls
- **Ready Checks**: Accessing nodes before `_ready()`

**Output Schema**:
```typescript
{
  bugs: BugReport[];
  summary: {
    totalFiles: number;
    bugsFound: number;
    severityBreakdown: Record<string, number>;
  };
}

interface BugReport {
  file: string;
  line: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern: string;
  message: string;
  suggestion: string;
}
```

**Performance**: <3s for 100-file projects

---

### 8. CTS_Cleanup

**Purpose**: Safe filesystem cleanup with dead code detection, duplicate removal, and rollback support.

**Input Schema**:
```typescript
{
  projectPath: string;
  dryRun?: boolean;            // Default: true (safety)
  strategies?: ('dead_code' | 'duplicates')[]; // Default: ['dead_code']
  exclusions?: string[];       // Default: ['**/.godot/**', '*.import']
  requireCleanGit?: boolean;   // Default: true
  maxActions?: number;         // Default: 100
}
```

**Cleanup Strategies**:
- **dead_code**: Remove unused imports, unreferenced functions
- **duplicates**: Remove identical files (SHA-256 matching)

**Output Schema**:
```typescript
{
  actions: CleanupAction[];
  summary: {
    filesAnalyzed: number;
    actionsProposed: number;
    potentialSavings: number;  // Bytes
  };
  rollbackScript?: string;  // Bash script to undo changes
}
```

**Safety Features**:
- Dry-run mode by default
- Git status validation
- Automatic rollback script generation
- Preview mode with diff output

**Performance**: <5s for medium projects

---

### 9. CTS_Audit_Project

**Purpose**: CTS compliance audit with actionable recommendations.

**Input Schema**:
```typescript
{
  projectPath: string;
  categories?: ('cts' | 'code_quality' | 'project_structure')[];
  minScore?: number;           // Default: 0, range: 0-100
  format?: 'json' | 'markdown'; // Default: 'json'
}
```

**Audit Categories**:
- **cts**: CTS standards (file size <500 LOC, signal-first, hop size, templates)
- **code_quality**: Type hints, error handling, complexity, naming conventions
- **project_structure**: Addon integration, directory organization

**Output Schema**:
```typescript
{
  overallScore: number;        // 0-100
  categoryScores: Record<string, number>;
  violations: Violation[];
  recommendations: Recommendation[];
  metrics: {
    totalFiles: number;
    totalLOC: number;
    averageComplexity: number;
    testCoverage: number;
  };
}

interface Violation {
  category: string;
  severity: 'low' | 'medium' | 'high';
  file: string;
  line?: number;
  message: string;
}

interface Recommendation {
  priority: 'low' | 'medium' | 'high';
  effort: 'small' | 'medium' | 'large';
  description: string;
  impact: string;
}
```

**Performance**: <10s for large projects

---

## Configuration

### Configuration File (.cts-mcp.json)

Place `.cts-mcp.json` in your project root or the directory where you run the MCP server.

**Full Configuration Schema**:

```json
{
  "cache": {
    "maxSize": 100,           // Max cached entries
    "ttlMs": 300000,          // Cache TTL (5 minutes)
    "enablePersistence": false // Persist cache to disk (future)
  },
  "sampling": {
    "largeArrayThreshold": 1000, // Arrays larger than this get sampled
    "sampleSize": 100,           // Sample size for large arrays
    "strategy": "stratified"     // 'random' | 'stratified'
  },
  "logging": {
    "level": "info",          // 'debug' | 'info' | 'warn' | 'error'
    "format": "human",        // 'human' | 'json'
    "enableConsole": true,
    "enableFile": false,
    "filePath": "logs/cts-mcp.log"
  },
  "performance": {
    "enableMetrics": true,
    "exportPrometheus": true,
    "metricsPort": 9090,      // Prometheus scrape endpoint (future)
    "budgets": {
      "syncToolMaxMs": 100,   // Max time for sync tools
      "asyncToolMaxMs": 5000  // Max time for async tools
    }
  },
  "parser": {
    "wasmPath": "./build/tree-sitter-gdscript.wasm",
    "fallbackToRegex": true,  // Fallback if WASM unavailable
    "cacheParseResults": true
  },
  "tools": {
    "CTS_Scan_Project": {
      "maxConcurrentFiles": 10,
      "excludePatterns": ["**/addons/**", "**/.godot/**"]
    },
    "CTS_Bughunter": {
      "defaultMinSeverity": "medium",
      "maxFiles": 1000
    },
    "CTS_Cleanup": {
      "dryRunDefault": true,
      "requireGitClean": true
    }
  }
}
```

### Environment Variables

Override configuration with environment variables:

```bash
# Logging
export LOG_LEVEL=debug        # Overrides config.logging.level
export LOG_FORMAT=json        # Overrides config.logging.format

# Cache
export CACHE_MAX_SIZE=200     # Overrides config.cache.maxSize
export CACHE_TTL_MS=600000    # Overrides config.cache.ttlMs

# Performance
export ENABLE_METRICS=true    # Overrides config.performance.enableMetrics

# Run server
node build/index.js
```

### Hot-Reload Configuration

The server watches `.cts-mcp.json` for changes and reloads automatically:

```bash
# Terminal 1: Start server
node build/index.js

# Terminal 2: Edit config
echo '{"logging":{"level":"debug"}}' > .cts-mcp.json

# Server log shows:
# [2025-11-02T12:00:00.000Z] INFO Configuration reloaded {"level":"debug"}
```

**Reloadable Settings**: logging, cache, sampling, performance budgets  
**Non-Reloadable**: parser, tools (requires restart)

---

## Observability

### Structured Logging

**Log Levels**:
- `DEBUG`: Detailed execution traces (disabled in production)
- `INFO`: Normal operations, tool execution, config changes
- `WARN`: Recoverable errors, performance warnings
- `ERROR`: Unrecoverable errors, tool failures

**Human-Readable Format** (default):
```
[2025-11-02T12:00:00.000Z] INFO Tool executed {"toolName":"CTS_Scan_Project","duration":245,"cacheHit":false}
[2025-11-02T12:00:01.000Z] WARN Cache size approaching limit {"currentSize":95,"maxSize":100}
[2025-11-02T12:00:02.000Z] ERROR Tool execution failed {"toolName":"CTS_Analyze_Project","error":"Project path not found"}
```

**JSON Format** (for log aggregation):
```json
{"timestamp":"2025-11-02T12:00:00.000Z","level":"info","message":"Tool executed","toolName":"CTS_Scan_Project","duration":245,"cacheHit":false}
```

Enable JSON format:
```bash
export LOG_FORMAT=json
node build/index.js
```

### Metrics Collection

**Tool Execution Metrics**:
- Execution count
- Average/min/max duration
- Error rate
- Cache hit rate

**Access Metrics Programmatically**:
```typescript
import { metrics } from './observability/index.js';

const summary = metrics.getSummary();
console.log(summary);
// {
//   totalTools: 9,
//   totalExecutions: 1234,
//   errorCount: 12,
//   averageCacheHitRate: 0.67
// }

const toolMetrics = metrics.getToolMetrics('CTS_Scan_Project');
console.log(toolMetrics);
// {
//   toolName: 'CTS_Scan_Project',
//   executionCount: 456,
//   averageDuration: 245,
//   minDuration: 120,
//   maxDuration: 890,
//   errorCount: 3,
//   cacheHitRate: 0.82,
//   lastExecuted: 1698765432000
// }
```

### Prometheus Export

**Expose metrics in Prometheus format**:

```typescript
import { exportPrometheusMetrics } from './observability/index.js';

const metrics = exportPrometheusMetrics();
console.log(metrics);
```

**Output**:
```
# HELP cts_tool_executions_total Total number of tool executions
# TYPE cts_tool_executions_total counter
cts_tool_executions_total{tool="CTS_Scan_Project"} 456
cts_tool_executions_total{tool="CTS_Analyze_Project"} 234

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

**Future**: HTTP endpoint for Prometheus scraping (Tier 4)

---

## Performance Optimization

### Caching Best Practices

1. **Use cache for expensive operations**:
   - AST parsing (`CTS_Scan_Project`)
   - Signal analysis (`CTS_Analyze_Project`)
   - Large visualizations (`CTS_Render_Artifact`)

2. **Bypass cache when needed**:
   ```json
   {"arguments": {"projectPath": "/path", "_bypassCache": true}}
   ```

3. **Monitor cache hit rate**:
   ```typescript
   const metrics = metrics.getToolMetrics('CTS_Scan_Project');
   console.log(`Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
   ```

4. **Adjust cache size**:
   ```json
   {"cache": {"maxSize": 200}}
   ```

### Sampling Large Datasets

**Stratified Sampling** (default for arrays >1000 items):

```typescript
// Automatic sampling in CTS_Render_Artifact
{
  "artifactType": "signal_map_v2",
  "data": {
    "signals": [...2000 signals...],  // Automatically sampled to 100
    "_disableSampling": false          // Set true to disable
  }
}
```

**Manual Sampling Control**:
```json
{
  "sampling": {
    "largeArrayThreshold": 500,  // Sample arrays >500 items
    "sampleSize": 50             // Sample size
  }
}
```

### Performance Budgets

**Tier 2C Performance Targets** (all met in v3.0.0):

| Operation | Target | Actual (P99) |
|-----------|--------|--------------|
| Cache Read | <2ms | 0.01ms ✅ |
| Cache Write | <2ms | 0.01ms ✅ |
| Config Read | <100ms | 0.00ms ✅ |
| Config Update | <100ms | 0.04ms ✅ |
| Sampling (small) | <5ms | 0.00ms ✅ |
| Sampling (large) | <100ms | 0.00ms ✅ |

**Tool Performance Budgets**:
- **Sync tools** (<100ms): `CTS_Export_to_Shrimp`, config operations
- **Async tools** (<5s): `CTS_Scan_Project`, `CTS_Analyze_Project`, `CTS_Bughunter`

**Monitor Performance**:
```bash
# Run benchmarks
npm run benchmark

# Check results
cat benchmarks/results.json
```

---

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript (watch mode)
npm run build:watch

# Run tests (watch mode)
npm test -- --watch

# Run specific test suite
npm test -- --testPathPattern="cache"
npm test -- --testPathPattern="observability"

# Run with coverage
npm test -- --coverage

# Lint code
npm run lint

# Type check
npm run type-check
```

### Testing Guidelines (Quinn's Methodology)

Follow Quinn's comprehensive testing approach:

1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Test Names**: "should [expected behavior] when [condition]"
3. **Edge Cases**: Test boundaries, null, empty, large inputs
4. **Error Paths**: Test validation errors, parsing errors, file I/O errors
5. **Integration**: Test tool composition, cache interaction, config hot-reload

**Example Test**:
```typescript
describe('ResultCache', () => {
  it('should return cached value when key exists', () => {
    // Arrange
    const cache = new ResultCache(100, 60000);
    cache.set('tool:scan:args123', { data: 'cached' });

    // Act
    const result = cache.get('tool:scan:args123');

    // Assert
    expect(result).toEqual({ data: 'cached' });
  });
});
```

### Code Quality Standards

- **TypeScript Strict Mode**: Enabled in `tsconfig.json`
- **ESLint**: Airbnb style guide + custom CTS rules
- **Prettier**: 2-space indentation, single quotes
- **CTS Compliance**: All files <500 LOC
- **Test Coverage**: ≥75% overall, ≥85% for cache/config

**Pre-Commit Checks**:
```bash
# Run all checks
npm run check

# Individual checks
npm run lint
npm run type-check
npm test -- --coverage
```

---

## Deployment

### NPM Package Deployment

See [PACKAGING.md](./PACKAGING.md) for complete guide.

**Quick Publish**:
```bash
# Bump version
npm version patch  # or minor, major

# Build and test
npm run build
npm test

# Publish to npm
npm publish --access public
```

### Docker Deployment

**Build Image**:
```bash
docker build -t cts-mcp-server:3.0.0 .
```

**Run Container**:
```bash
# Interactive mode (stdio)
docker run -i cts-mcp-server:3.0.0

# With volume mount (access host filesystem)
docker run -i -v /path/to/godot/projects:/projects cts-mcp-server:3.0.0

# Production mode (docker-compose)
docker-compose up -d prod
```

**Health Check**:
```bash
docker ps  # Check container status
docker logs <container-id>  # View logs
```

### CI/CD Pipeline

**GitHub Actions Workflow** (`.github/workflows/ci.yml`):

1. **Test Job**: Run all tests, upload coverage to Codecov
2. **Performance Job**: Run benchmarks, check regression
3. **Quality Job**: TypeScript checks, linting
4. **Security Job**: npm audit, dependency scanning

**Trigger**: Push to `main`, pull requests

See [CI_CD_PIPELINE.md](./CI_CD_PIPELINE.md) for details.

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

**Quick Fixes**:

| Issue | Solution |
|-------|----------|
| Server won't start | Check Node.js ≥18, `npm install`, `npm run build` |
| Tool execution timeout | Increase performance budget in config |
| Cache not working | Enable `enableMetrics`, check cache hit rate |
| WASM parsing errors | Set `fallbackToRegex: true` in config |
| High memory usage | Reduce cache size, enable sampling |

---

## Additional Resources

- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [CHANGELOG](../CHANGELOG.md) - Version history
- [CI/CD Pipeline](./CI_CD_PIPELINE.md) - Continuous integration guide
- [Packaging Guide](./PACKAGING.md) - NPM and Docker deployment
- [Tier 2C Improvements](./TIER_2C_IMPROVEMENTS.md) - Production hardening details
- [Phase 2 Migration](./guides/PHASE_2_MIGRATION.md) - Upgrade from v1.0 to v2.0

---

**Questions?** Open an issue on GitHub or consult the [MCP Protocol Documentation](https://modelcontextprotocol.io/docs).
