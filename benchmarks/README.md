# Performance Benchmarks

This directory contains performance benchmark results for the CTS MCP Server.

## Quick Start

```bash
# Run benchmarks
npm run benchmark

# View results
cat benchmarks/results.json
```

## Benchmark Suite

### Categories

**CACHE** - Cache operations (critical path for performance)
- Cache Write: <2ms target
- Cache Read: <2ms target  
- Key Generation: <1ms target

**SYNC** - Synchronous tools (user-visible, blocking)
- Config Read: <100ms target
- Config Update: <100ms target
- Sampling Small Arrays: <5ms target
- Sampling Large Arrays: <100ms target
- Response Size Check: <5ms target

**WORKFLOW** - Complete workflows (end-to-end)
- Cache Miss: <100ms target
- Cache Hit: <10ms target

### Results Format

```json
{
  "timestamp": "2025-11-01T12:00:00.000Z",
  "results": [
    {
      "name": "Cache Read",
      "category": "cache",
      "target": 2,
      "iterations": 1000,
      "mean": 0.01,
      "min": 0.00,
      "max": 0.05,
      "p95": 0.01,
      "p99": 0.02,
      "passed": true
    }
  ],
  "summary": {
    "total": 10,
    "passed": 10,
    "failed": 0,
    "passRate": 100
  }
}
```

## Performance Targets

From `docs/TIER_2C_IMPROVEMENTS.md`:

| Operation | Target | Rationale |
|-----------|--------|-----------|
| Cache read/write | <2ms | Critical path for all tool operations |
| Cache key gen | <1ms | Called on every cache access |
| Config read | <100ms | Startup overhead, not repeated |
| Sampling small | <5ms | Frequent operation on typical data |
| Sampling large | <100ms | Rare, only for very large responses |
| Workflow (cached) | <10ms | Optimal case, should be instant |
| Workflow (uncached) | <100ms | First run acceptable |

## CI/CD Integration

Benchmarks run automatically on:
- Pull requests (comparison with baseline)
- Main branch pushes (new baseline)

**Regression Detection**:
- Fails CI if >20% slower than baseline
- Alerts if P95 exceeds target by >10%

## Baseline Management

```bash
# Save current results as baseline
cp benchmarks/results.json benchmarks/baseline/results.json

# Compare with baseline (manual)
node scripts/compare-benchmarks.js benchmarks/baseline/results.json benchmarks/results.json
```

## Interpreting Results

### Mean vs Percentiles

- **Mean**: Average performance (can be skewed by outliers)
- **P95**: 95% of operations are faster (realistic "worst case")
- **P99**: 99% of operations are faster (extreme outliers)

**Use P95 for targets** - balances typical performance with edge cases.

### When Benchmarks Fail

1. **Identify the failing benchmark**:
   ```
   ❌ Cache Write: 2.5ms (target: <2ms)
   ```

2. **Check if it's a regression**:
   - Compare with `baseline/results.json`
   - Look for code changes in that area

3. **Profile the operation**:
   ```bash
   node --prof build/scripts/benchmark.js
   node --prof-process isolate-*-v8.log > profile.txt
   ```

4. **Common causes**:
   - Synchronous I/O (should be async)
   - Inefficient algorithms (O(n²) → O(n log n))
   - Memory allocations (reduce GC pressure)
   - External service calls (should be mocked in benchmarks)

## Historical Trends

Track performance over time:

```bash
# Save timestamped results
mkdir -p benchmarks/history
cp benchmarks/results.json "benchmarks/history/$(date +%Y%m%d-%H%M%S).json"

# View trends (future enhancement)
npm run benchmark:trends
```

## Advanced Benchmarking

### Custom Iterations

```typescript
// In src/scripts/benchmark.ts
const times = benchmark('Custom Test', () => {
  // Your code here
}, 10000); // 10,000 iterations for precision
```

### Memory Profiling

```bash
# Heap snapshots
node --expose-gc --inspect build/scripts/benchmark.js

# Open Chrome DevTools → Memory → Take Heap Snapshot
```

### CPU Profiling

```bash
# Generate CPU profile
node --cpu-prof build/scripts/benchmark.js

# Analyze in Chrome DevTools → Profiler → Load CPU Profile
```

## See Also

- [CI/CD Pipeline](../docs/CI_CD_PIPELINE.md) - Full pipeline documentation
- [Tier 2C Improvements](../docs/TIER_2C_IMPROVEMENTS.md) - Performance targets rationale
- [Quinn Testing Methodology](../../.github/prompts/Quinn%20(Testing%20Expert).prompt.md) - Testing philosophy
