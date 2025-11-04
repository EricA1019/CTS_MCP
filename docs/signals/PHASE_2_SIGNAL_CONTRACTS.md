# Phase 2 Signal Contracts

**Version**: 1.0.0  
**Date**: October 30, 2025  
**Phase**: CTS_MCP_2

This document defines the signal contracts for all new signals introduced in Phase 2 of the CTS MCP Server. Signal contracts ensure consistent communication patterns between components and provide type safety for event-driven interactions.

## Overview

Phase 2 introduces **8 new signals** to support advanced parsing, rendering, and performance monitoring capabilities:

1. `parser:tree_sitter_initialized` - Tree-sitter WASM runtime ready
2. `parser:signal_extracted` - Signal definition extracted from AST
3. `parser:parse_error` - AST parsing encountered an error
4. `renderer:clustering_started` - Community detection algorithm initiated
5. `renderer:clustering_completed` - Clustering algorithm finished
6. `renderer:hull_rendered` - Cluster convex hull visualization rendered
7. `metrics:performance_sample` - Performance metric sampled
8. `cache:invalidation_triggered` - Artifact cache invalidated

---

## Signal Definitions

### 1. `parser:tree_sitter_initialized`

**Emitted When**: Tree-sitter WASM runtime successfully loads and initializes

**Payload Schema**:
```typescript
interface TreeSitterInitializedPayload {
  wasmSize: number;           // WASM binary size in bytes
  initDuration: number;       // Initialization time in milliseconds
  languageVersion: string;    // tree-sitter-gdscript version
  timestamp: number;          // Unix timestamp (ms)
}
```

**Emission Context**:
- Emitted by `TreeSitterBridge` constructor after successful WASM load
- Only emitted once per server lifetime
- Used for monitoring startup performance

**Example Usage**:
```typescript
const bridge = new TreeSitterBridge();
// Signal emitted internally after WASM initialization

// Listeners can track initialization metrics
bridge.on('parser:tree_sitter_initialized', (payload) => {
  console.log(`Tree-sitter loaded (${payload.wasmSize} bytes, ${payload.initDuration}ms)`);
});
```

---

### 2. `parser:signal_extracted`

**Emitted When**: A signal definition is successfully extracted from the AST

**Payload Schema**:
```typescript
interface SignalExtractedPayload {
  signal: SignalDefinition;   // Extracted signal with params/types
  filePath: string;           // Absolute path to source file
  line: number;               // Line number where signal defined
  extractionMethod: 'tree-sitter' | 'regex';  // Parser used
  parseTime: number;          // Time to parse (ms)
}

interface SignalDefinition {
  name: string;
  source: 'EventBus' | 'SignalBus' | 'Component';
  filePath: string;
  line: number;
  params: string[];
  paramTypes: Record<string, string>;
}
```

**Emission Context**:
- Emitted by `SignalExtractor.extractFromFile()` for each signal found
- Multiple emissions per file (one per signal)
- Used for progress tracking and debugging

**Example Usage**:
```typescript
const extractor = new SignalExtractor(bridge);
const signals = await extractor.extractFromFile('/path/to/signals.gd');

// Internal emission during extraction:
// this.emit('parser:signal_extracted', {
//   signal: { name: 'player_damaged', ... },
//   filePath: '/path/to/signals.gd',
//   line: 42,
//   extractionMethod: 'tree-sitter',
//   parseTime: 12.5
// });
```

---

### 3. `parser:parse_error`

**Emitted When**: AST parsing encounters a syntax error or parsing failure

**Payload Schema**:
```typescript
interface ParseErrorPayload {
  filePath: string;           // File that failed to parse
  error: Error;               // Error object with details
  errorType: 'syntax' | 'timeout' | 'memory' | 'unknown';
  line?: number;              // Line where error occurred (if known)
  column?: number;            // Column where error occurred (if known)
  fallbackUsed: boolean;      // Whether regex parser was used as fallback
}
```

**Emission Context**:
- Emitted by `TreeSitterBridge.parse()` when parsing fails
- Triggers fallback to regex parser if available
- Used for error reporting and diagnostics

**Example Usage**:
```typescript
try {
  const ast = await bridge.parse(gdscriptCode);
} catch (error) {
  // Signal emitted:
  // this.emit('parser:parse_error', {
  //   filePath: '/path/to/file.gd',
  //   error: new Error('Unexpected token'),
  //   errorType: 'syntax',
  //   line: 15,
  //   fallbackUsed: true
  // });
}
```

---

### 4. `renderer:clustering_started`

**Emitted When**: Community detection algorithm begins processing nodes

**Payload Schema**:
```typescript
interface ClusteringStartedPayload {
  nodeCount: number;          // Number of nodes to cluster
  linkCount: number;          // Number of edges in graph
  algorithm: 'greedy-modularity' | 'louvain';
  timestamp: number;          // Unix timestamp (ms)
}
```

**Emission Context**:
- Emitted by `detectCommunities()` at algorithm start
- Used for performance monitoring
- Client-side emission in rendered HTML

**Example Usage**:
```typescript
// In clustered signal map renderer (client-side JavaScript)
const clusterResult = detectCommunities(nodes, links);

// Signal emitted:
// emit('renderer:clustering_started', {
//   nodeCount: 150,
//   linkCount: 1068,
//   algorithm: 'greedy-modularity',
//   timestamp: Date.now()
// });
```

---

### 5. `renderer:clustering_completed`

**Emitted When**: Community detection algorithm finishes

**Payload Schema**:
```typescript
interface ClusteringCompletedPayload {
  clusters: number;           // Number of clusters detected
  modularity: number;         // Modularity score (0-1, higher is better)
  duration: number;           // Clustering time in milliseconds
  iterations: number;         // Optimization iterations performed
  converged: boolean;         // Whether algorithm converged
}
```

**Emission Context**:
- Emitted by `detectCommunities()` after completion
- Provides clustering quality metrics
- Used for performance tracking and quality assurance

**Example Usage**:
```typescript
const result = detectCommunities(nodes, links);

// Signal emitted:
// emit('renderer:clustering_completed', {
//   clusters: 10,
//   modularity: 0.8831,
//   duration: 3.0,
//   iterations: 15,
//   converged: true
// });
```

---

### 6. `renderer:hull_rendered`

**Emitted When**: Cluster convex hull visualization is rendered

**Payload Schema**:
```typescript
interface HullRenderedPayload {
  clusterId: number;          // Cluster identifier
  nodeCount: number;          // Nodes in this cluster
  hullPoints: number;         // Vertices in convex hull
  color: string;              // Hull color (hex)
  renderTime: number;         // Time to compute hull (ms)
}
```

**Emission Context**:
- Emitted by `updateHulls()` in clustered signal map
- One emission per cluster hull rendered
- Used for debugging and performance analysis

**Example Usage**:
```typescript
// In updateHulls() function (client-side)
const hull = d3.polygonHull(clusterPoints);

// Signal emitted:
// emit('renderer:hull_rendered', {
//   clusterId: 3,
//   nodeCount: 15,
//   hullPoints: 8,
//   color: '#1f77b4',
//   renderTime: 0.5
// });
```

---

### 7. `metrics:performance_sample`

**Emitted When**: A performance metric is sampled during operation

**Payload Schema**:
```typescript
interface PerformanceSamplePayload {
  metric: string;             // Metric name (e.g., 'parse_time', 'render_time')
  value: number;              // Metric value
  unit: 'ms' | 'bytes' | 'count';  // Measurement unit
  context: {                  // Additional context
    fileSize?: number;        // File size for parse metrics
    nodeCount?: number;       // Node count for render metrics
    rendererType?: string;    // Renderer identifier
  };
  timestamp: number;          // Unix timestamp (ms)
}
```

**Emission Context**:
- Emitted by various components during operations
- Used for performance trend analysis
- Aggregated by `PerformanceTrendPipeline`

**Example Usage**:
```typescript
// In SignalExtractor
const startTime = performance.now();
const signals = await this.extractFromFile(filePath);
const parseTime = performance.now() - startTime;

emit('metrics:performance_sample', {
  metric: 'parse_time',
  value: parseTime,
  unit: 'ms',
  context: { fileSize: 1024 },
  timestamp: Date.now()
});
```

---

### 8. `cache:invalidation_triggered`

**Emitted When**: Artifact cache is invalidated due to version/content change

**Payload Schema**:
```typescript
interface CacheInvalidationPayload {
  reason: 'version_mismatch' | 'content_change' | 'manual';
  artifactType: string;       // Type of artifact invalidated
  oldVersion?: string;        // Previous schema version
  newVersion?: string;        // New schema version
  artifactsCleared: number;   // Number of cache entries removed
  timestamp: number;          // Unix timestamp (ms)
}
```

**Emission Context**:
- Emitted by `ArtifactVersionRegistry.invalidateCache()`
- Triggered when renderer schema versions change
- Used for cache management and monitoring

**Example Usage**:
```typescript
// In ArtifactVersionRegistry
const cleared = this.invalidateCache('signal_map', 'content_change');

emit('cache:invalidation_triggered', {
  reason: 'content_change',
  artifactType: 'signal_map',
  oldVersion: '1.0.0',
  newVersion: '1.1.0',
  artifactsCleared: 42,
  timestamp: Date.now()
});
```

---

## Signal Usage Patterns

### Pattern 1: Progress Tracking
```typescript
// Combine signals for comprehensive progress tracking
let totalSignals = 0;
let processedFiles = 0;

on('parser:signal_extracted', () => totalSignals++);
on('parser:parse_error', () => processedFiles++);

console.log(`Extracted ${totalSignals} signals from ${processedFiles} files`);
```

### Pattern 2: Performance Monitoring
```typescript
// Aggregate performance metrics
const metrics: number[] = [];

on('metrics:performance_sample', (payload) => {
  if (payload.metric === 'parse_time') {
    metrics.push(payload.value);
  }
});

const avgParseTime = metrics.reduce((a, b) => a + b, 0) / metrics.length;
console.log(`Average parse time: ${avgParseTime.toFixed(2)}ms`);
```

### Pattern 3: Error Recovery
```typescript
// Fallback to regex parser on tree-sitter failure
on('parser:parse_error', async (payload) => {
  if (!payload.fallbackUsed) {
    console.warn(`Parse error in ${payload.filePath}, using regex fallback`);
    const signals = await regexParser.parse(payload.filePath);
    return signals;
  }
});
```

---

## Signal Contract Compliance

All signals in Phase 2 must adhere to the following contract requirements:

1. **Type Safety**: All payloads must have TypeScript interfaces
2. **Documentation**: Each signal must document emission context and usage
3. **Versioning**: Payload schemas are versioned (breaking changes increment major version)
4. **Naming Convention**: `category:action_state` format (e.g., `parser:signal_extracted`)
5. **Timestamp**: All signals should include Unix timestamp for temporal ordering
6. **Error Handling**: Error signals must include error type and fallback status

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-30 | Initial Phase 2 signal contracts |

---

## Related Documentation

- [Phase 1 Signal Contracts](./PHASE_1_SIGNAL_CONTRACTS.md) (if exists)
- [ADR: Tree-sitter Adoption](../architecture/decisions/ADR_TREE_SITTER_ADOPTION.md)
- [ADR: Clustering Strategy](../architecture/decisions/ADR_CLUSTERING_STRATEGY.md)
- [Phase 2 Migration Guide](../guides/PHASE_2_MIGRATION.md)
