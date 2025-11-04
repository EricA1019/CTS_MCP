# CI/CD Pipeline Documentation

## Overview

The CTS MCP Server CI/CD pipeline provides comprehensive quality assurance through automated testing, coverage reporting, performance benchmarking, and security auditing.

---

## Pipeline Jobs

### 1. Test & Coverage

**Purpose**: Validate code correctness and measure test coverage

**Steps**:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Build TypeScript
5. Run tests with coverage
6. Generate coverage report
7. Upload to Codecov
8. Archive coverage artifacts

**Coverage Thresholds**:
- **Global**: 75-80% (branches, functions, lines, statements)
- **Tier 2C Components**: 80-90% (cache, config, sampling)
  - `src/cache/`: 85% branches, 85% functions, 90% lines
  - `src/config/`: 85% branches, 70% functions, 85% lines
  - `src/sampling/`: 80% branches, 85% functions, 85% lines

**Artifacts**:
- Coverage reports (HTML, LCOV, JSON)
- Retention: 30 days

---

### 2. Performance Benchmarks

**Purpose**: Validate performance targets from Tier 2C improvements

**Performance Targets** (from `docs/TIER_2C_IMPROVEMENTS.md`):
- **Sync Tools**: <100ms (config read, schema validation)
- **Cache Operations**: <2ms (read/write), <1ms (key generation)
- **Sampling**: <5ms (small data), <100ms (large data)
- **Complete Workflow**: <100ms (with cache hit), <10ms (cache hit only)

**Benchmark Suite** (`src/scripts/benchmark.ts`):
```typescript
// 10 benchmarks across 4 categories
- Cache: Write, Read, Key Generation
- Config: Read, Update
- Sampling: Small arrays, Large arrays, Size check
- Workflow: Cache miss, Cache hit
```

**Output**:
```
📊 Results:
Category     Benchmark                 Target    Mean      P95       Status
CACHE        Cache Write               <2ms      0.01ms    0.01ms    ✅ PASS
CACHE        Cache Read                <2ms      0.01ms    0.01ms    ✅ PASS
...
📈 Summary: 10/10 passed (100.0%)
```

**Artifacts**:
- `benchmarks/results.json` - Detailed performance metrics
- Retention: 90 days (for trend analysis)

**Regression Detection**:
- Downloads baseline from previous run
- Fails CI if performance degrades >20%

---

### 3. Code Quality & Linting

**Purpose**: Ensure code quality standards

**Checks**:
1. TypeScript type checking (`tsc --noEmit`)
2. Linting (when configured)
3. Code formatting (when configured)

**Future Enhancements**:
- ESLint with TypeScript rules
- Prettier formatting validation
- Complexity analysis (e.g., maximum cyclomatic complexity)

---

### 4. Security Audit

**Purpose**: Detect vulnerabilities in dependencies

**Checks**:
1. `npm audit` (moderate level and above)
2. Vulnerability summary in GitHub Actions summary

**Output**:
```markdown
## Security Audit
**Vulnerabilities**: 0 total (0 critical, 0 high)
```

---

## Local Development

### Running Tests
```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific pattern
npm test -- --testPathPattern="tier2c"
```

### Running Benchmarks
```bash
# Full benchmark suite
npm run benchmark

# Output: benchmarks/results.json
```

### Build
```bash
# Build TypeScript
npm run build

# Watch mode
npm run build:watch
```

---

## Test Organization

Following **Quinn (Testing Expert)** methodology:

### Test Structure
```
src/
  __tests__/
    # Tier 2C Improvements (112 tests)
    schemas.test.ts              # 16 tests - Schema validation
    enhanced_errors.test.ts      # 10 tests - Error handling
    sampling.test.ts             # 18 tests - MCP sampling protocol
    tool_config.test.ts          # 28 tests - Configuration management
    result_cache.test.ts         # 29 tests - Result caching
    tier2c_integration.test.ts   # 11 tests - Integration validation
    
    # Legacy tests (660+ tests)
    parser_regression.test.ts
    suggestion_engine.test.ts
    ...
```

### Test Naming Convention
```gdscript
func test_<feature>_<scenario>_<expected_result>() -> void:
    # AAA Pattern: Arrange, Act, Assert
    
# Examples:
test_cache_write_stores_data_correctly()
test_config_update_changes_settings()
test_sampling_truncates_large_arrays()
test_workflow_cache_hit_is_fast()
```

---

## Performance Budget Enforcement

### Sync Tools (<100ms)
- Schema validation
- Configuration retrieval
- Cache lookups
- Sampling operations

### Async Tools (<5s)
- Bughunter scans
- Cleanup operations
- Audit reports
- Reasoning tasks

### Cache Operations (<2ms)
- Read: <2ms (P95)
- Write: <2ms (P95)
- Key generation: <1ms (P95)

**Enforcement**:
```typescript
// In benchmark.ts
const result = analyzeTimes('Cache Read', 'cache', 2, readTimes);
if (!result.passed) {
  console.error(`❌ ${result.name} failed: ${result.mean}ms (target: <${result.target}ms)`);
  process.exit(1);
}
```

---

## Coverage Reports

### Viewing Coverage

**Local**:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

**CI/CD**:
- Codecov dashboard: [codecov.io](https://codecov.io)
- GitHub Actions summary (text report)
- Downloadable artifacts (30-day retention)

### Coverage Metrics

**Current Tier 2C Coverage** (as of 2025-11-01):
```
File                  | Stmts | Branch | Funcs | Lines |
----------------------|-------|--------|-------|-------|
cache/result_cache.ts | 90%   | 88%    | 81%   | 91%   |
config/tool_config.ts | 88%   | 87%    | 67%   | 88%   |
sampling/index.ts     | 89%   | 85%    | 91%   | 89%   |
```

**Test Count**:
- Total: 772 tests
- Tier 2C: 112 tests (100% passing)
- Legacy: 660 tests (82% passing - needs refactoring)

---

## Integration with MCP Clients

### VS Code
```json
{
  "mcpServers": {
    "cts": {
      "command": "node",
      "args": ["path/to/cts_mcp/build/index.js"],
      "env": {
        "DEBUG": "cts:*"
      }
    }
  }
}
```

### Claude Desktop
```json
{
  "mcpServers": {
    "cts": {
      "command": "node",
      "args": ["/absolute/path/to/cts_mcp/build/index.js"]
    }
  }
}
```

---

## Future Enhancements

### Short Term (Tier 3)
- [ ] Add ESLint configuration
- [ ] Add Prettier formatting
- [ ] Integrate Codecov PR comments
- [ ] Add performance trend tracking

### Medium Term
- [ ] E2E tests with MCP clients
- [ ] Visual regression testing for artifacts
- [ ] Load testing for concurrent requests
- [ ] Fuzz testing for parsers

### Long Term
- [ ] Multi-platform testing (Windows, macOS, Linux)
- [ ] Docker image CI/CD
- [ ] NPM package publishing automation
- [ ] Semantic versioning automation

---

## Troubleshooting

### Coverage Thresholds Failing

**Problem**: `Jest: "global" coverage threshold for X (80%) not met: 75%`

**Solution**:
1. Check which files lack coverage: `npm run test:coverage`
2. Add tests for uncovered code paths
3. Or adjust thresholds in `jest.config.js` (with justification)

### Benchmarks Failing

**Problem**: `❌ Some benchmarks failed performance targets`

**Solution**:
1. Check `benchmarks/results.json` for failing benchmarks
2. Identify performance regression (compare with baseline)
3. Profile code with `node --prof` or Chrome DevTools
4. Optimize or adjust target (with justification)

### Build Failures

**Problem**: `error TS2307: Cannot find module`

**Solution**:
1. Ensure all imports use `.js` extension (ESM requirement)
2. Check `tsconfig.json` paths
3. Run `npm install` to ensure dependencies

---

## Metrics Dashboard (Future)

Planned metrics for production monitoring:

**Performance**:
- Tool execution time (P50, P95, P99)
- Cache hit rate
- Memory usage
- CPU usage

**Quality**:
- Test pass rate
- Coverage percentage
- Security vulnerabilities
- TypeScript error count

**Reliability**:
- Error rate by tool
- Crash rate
- Timeout rate
- Retry rate

---

## References

- **Quinn (Testing Expert)**: `.github/prompts/Quinn (Testing Expert).prompt.md`
- **Tier 2C Improvements**: `docs/TIER_2C_IMPROVEMENTS.md`
- **MCP Upgrade Plan**: `docs/mcp_upgrade_plan.md`
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Jest Coverage**: https://jestjs.io/docs/configuration#coveragethreshold-object
- **Codecov**: https://docs.codecov.com/docs
