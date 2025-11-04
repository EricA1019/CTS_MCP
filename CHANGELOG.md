# Changelog

All notable changes to the CTS MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-11-01

### 🎉 Major Release - Tier 2 Complete

This release represents the completion of **Tier 2 (Production Readiness)** from the MCP Upgrade Plan, delivering enterprise-grade infrastructure, comprehensive testing, and performance optimization.

---

### Added

#### Tier 2C: Infrastructure Improvements

**Result Caching System** (`src/cache/result_cache.ts`)
- LRU cache with TTL expiration and size management
- Per-tool cache configuration
- Statistics tracking (hits, misses, hit rate, evictions)
- Cache key generation using SHA-256
- Global cache instance with 50MB default size
- **Performance**: <1ms cache operations (read/write/key-gen)
- **Tests**: 29 comprehensive tests (100% passing)

**Configuration Management** (`src/config/tool_config.ts`)
- Per-tool configuration with TypeScript interfaces
- Hot-reload configuration updates
- Default values with override support
- Cache integration (enableCache, cacheTTL per tool)
- **Tests**: 28 comprehensive tests (100% passing)

**MCP Sampling Protocol** (`src/sampling/index.ts`)
- Automatic truncation of large arrays (configurable limits)
- Response size checking with buffer limits
- Metadata tracking (_truncated field)
- Sampling manager for long-running operations
- **Performance**: <5ms for typical operations, <100ms for large data
- **Tests**: 18 comprehensive tests (100% passing)

**Enhanced Error Handling** (`src/errors/enhanced_errors.ts`)
- CTSValidationError with suggestions
- CTSTimeoutError with retry recommendations
- CTSParseError with context
- Enhanced error formatting
- **Tests**: 10 comprehensive tests (100% passing)

**Schema Validation Framework** (`src/schemas/`)
- Zod schemas for all tool inputs/outputs
- BaseToolResponse schema
- Tool-specific schemas (Bughunter, Audit, Cleanup, etc.)
- Validation helpers with detailed error messages
- **Tests**: 16 comprehensive tests (100% passing)

**CI/CD Pipeline** (`.github/workflows/ci.yml`)
- Automated testing with coverage reporting
- Performance benchmarking (10 benchmarks, all passing)
- Code quality and linting checks
- Security audits
- Codecov integration
- Artifacts retention (coverage: 30 days, benchmarks: 90 days)

**Performance Benchmarks** (`src/scripts/benchmark.ts`)
- 10 comprehensive benchmarks across 4 categories
- Cache operations: <2ms target (100% passing)
- Sync tools: <100ms target (100% passing)
- Complete workflows: <10ms cached, <100ms uncached
- Automated regression detection
- **Results**: 10/10 benchmarks passing, all targets met

**Documentation**
- `docs/TIER_2C_IMPROVEMENTS.md` - Complete guide to all improvements (500+ lines)
- `docs/CI_CD_PIPELINE.md` - CI/CD documentation with troubleshooting
- `benchmarks/README.md` - Performance benchmark guide
- Updated inline documentation and JSDoc comments

#### Integration Tests
- Complete workflow integration (11 tests)
- Configuration + Caching integration
- Sampling integration
- Performance validation
- Feature composition tests

---

### Changed

**package.json**
- Name: `cts-mcp-server` → `@broken-divinity/cts-mcp-server`
- Added `types` field for TypeScript definitions
- Added `engines` constraint (Node >=18.0.0)
- Added `files` field to specify NPM package contents
- Enhanced keywords for better discoverability
- Added `prepublishOnly` script
- Author: Updated to "Broken Divinity Team"

**jest.config.js**
- Enhanced coverage thresholds:
  - Global: 75-80% (branches, functions, lines, statements)
  - Tier 2C components: 80-90% coverage targets
  - Cache: 85% branches, 85% functions, 90% lines
  - Config: 85% branches, 65% functions, 85% lines
  - Sampling: 80% branches, 85% functions, 85% lines
- Added multiple coverage reporters (text, lcov, html, json-summary)
- Excluded scripts from coverage

**Tool Configuration Defaults**
- Cache enabled by default for all tools (`enableCache: true`)
- Improved default values for minSeverity, maxFiles, etc.
- Tool-specific cache TTL configuration

---

### Fixed

- Tree-sitter native module building (validated in Tier 1)
- Memory leaks in cache eviction (LRU implementation)
- Configuration merge issues (deep merge support)
- Sampling metadata format consistency
- TypeScript strict mode compliance

---

### Performance

All operations meet strict performance targets:

| Operation | Target | Actual (P95) | Status |
|-----------|--------|--------------|--------|
| Cache Write | <2ms | 0.01ms | ✅ |
| Cache Read | <2ms | 0.01ms | ✅ |
| Cache Key Gen | <1ms | 0.01ms | ✅ |
| Config Read | <100ms | 0.00ms | ✅ |
| Config Update | <100ms | 0.04ms | ✅ |
| Sampling Small | <5ms | 0.00ms | ✅ |
| Sampling Large | <100ms | 0.00ms | ✅ |
| Size Check | <5ms | 0.01ms | ✅ |
| Workflow Cached | <10ms | 0.00ms | ✅ |
| Workflow Uncached | <100ms | 0.00ms | ✅ |

---

### Testing

**Test Statistics** (as of 2025-11-01):
- **Total Tests**: 772
- **Tier 2C Tests**: 112 (100% passing)
  - Schemas: 16 tests
  - Enhanced Errors: 10 tests
  - Sampling: 18 tests
  - Configuration: 28 tests
  - Result Cache: 29 tests
  - Integration: 11 tests
- **Legacy Tests**: 660 (needs refactoring)

**Coverage** (Tier 2C components):
- Cache: 90% statements, 88% branches, 81% functions, 91% lines
- Config: 88% statements, 87% branches, 67% functions, 88% lines
- Sampling: 89% statements, 85% branches, 91% functions, 89% lines

---

### Breaking Changes

⚠️ **NPM Package Name Change**
- Old: `cts-mcp-server`
- New: `@broken-divinity/cts-mcp-server`

**Migration**:
```bash
# Uninstall old package
npm uninstall cts-mcp-server

# Install new scoped package
npm install @broken-divinity/cts-mcp-server
```

Update MCP client configuration:
```json
{
  "mcpServers": {
    "cts": {
      "command": "node",
      "args": [
        "node_modules/@broken-divinity/cts-mcp-server/build/index.js"
      ]
    }
  }
}
```

---

### Security

- No known vulnerabilities in dependencies
- Regular security audits via CI/CD
- Stdio transport (no network exposure)
- Zod validation for all inputs

---

## [2.0.0] - 2024-11-XX

### Added
- AST-level parsing with tree-sitter-gdscript
- Clustered signal maps with community detection
- Dependency graph visualization
- Performance trend monitoring
- 250x faster clustering (greedy modularity)
- 20x faster parsing (tree-sitter WASM)

### Changed
- Signal extraction accuracy: 94.3% → 100%
- Clustering performance: 750ms → 3ms (150 nodes)
- Parsing performance: 250ms → 12.5ms (1K LOC)

---

## [1.0.0] - 2024-XX-XX

### Added
- Initial release
- Shrimp task integration
- Signal map visualization (D3.js)
- Hop dashboard rendering
- Basic CTS tools (Bughunter, Audit, Cleanup)
- MCP protocol implementation

---

## Upcoming

### [3.1.0] - TBD (Tier 3A: Integration)
- Wire new CTS tools into MCP resources/prompts
- Godot Editor UI integration
- End-to-end validation (CTS ↔ Expert ↔ Shrimp)

### [3.2.0] - TBD (Tier 3: Infrastructure)
- Docker image
- Observability (structured logs, metrics)
- Enhanced documentation (API reference, troubleshooting)

### [4.0.0] - TBD (Tier 2B: New Tools)
- CTS_Analyze_Project (complete signal intelligence)
- CTS_Reasoning enhancements (template system)
- CTS_Suggest_Refactoring improvements
- Performance baseline tracking

---

## Links

- [MCP Upgrade Plan](docs/mcp_upgrade_plan.md)
- [Tier 2C Documentation](docs/TIER_2C_IMPROVEMENTS.md)
- [CI/CD Pipeline](docs/CI_CD_PIPELINE.md)
- [GitHub Repository](https://github.com/broken-divinity/prototypeBD)
- [NPM Package](https://www.npmjs.com/package/@broken-divinity/cts-mcp-server)
