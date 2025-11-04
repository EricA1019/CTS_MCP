# CTS MCP Server

**Version**: 3.0.0  
**Protocol**: Model Context Protocol 2024-11-05  
**Status**: ✅ Production Ready

Model Context Protocol server for Close-to-Shore (CTS) methodology automation, providing automated task creation in Shrimp MCP and interactive artifact visualization (signal maps, hop dashboards, dependency graphs) for Godot game development.

## Features

### Tier 3 Infrastructure (v3.0.0 - NEW!)

- 🚀 **CI/CD Pipeline**: GitHub Actions with test, performance, quality, security jobs
- 📦 **NPM Package**: Scoped `@broken-divinity/cts-mcp-server` ready for npm publish
- 🐳 **Docker Support**: Multi-stage Alpine image (150-200MB), production-ready
- 📊 **Observability**: Structured logging, metrics collection, Prometheus export
- ⚡ **Performance**: All benchmarks passing (<2ms cache, <100ms config, <5ms sampling)
- 🧪 **Test Coverage**: 772 tests passing (635+ from Tier 2C improvements)

### Tier 2C Production Hardening (v3.0.0)

- 💾 **Result Caching**: LRU cache with SHA-256 hashing (<2ms operations, 29/29 tests ✅)
- ⚙️ **Hot-Reload Configuration**: JSON-based config with validation (28/28 tests ✅)
- 📏 **Stratified Sampling**: Efficient large dataset handling (<5ms small, <100ms large, 18/18 tests ✅)
- 🛡️ **Enhanced Error Handling**: Actionable CTSError types with recovery suggestions (10/10 tests ✅)
- ✅ **Schema Validation**: Zod schemas for all 9 tools (16/16 tests ✅)
- 🔧 **Tool Integration**: Consistent interface, cache support, metrics tracking (16/16 tests ✅)

### Phase 2 Enhancements (v2.0.0)

- 🎯 **AST-Level Parsing**: Tree-sitter-gdscript with 100% signal extraction accuracy
- 🌐 **Clustered Signal Maps**: Community detection with convex hull visualization (150-300 signals)
- 📊 **Dependency Graphs**: Cross-file signal connection tracking and visualization
- 📈 **Performance Trends**: Time-series monitoring of parse time, signal count, memory usage
- ⚡ **250x Faster Clustering**: 3ms for 150 nodes (greedy modularity optimization)
- 🧬 **20x Faster Parsing**: 12.5ms for 1K LOC files (tree-sitter WASM)

### Core Features

- �🚀 **Automated Task Creation**: Convert hop plans to Shrimp tasks via stdio IPC (30min → 5min per hop)
- 📊 **Signal Architecture Visualization**: D3.js force-directed graphs showing EventBus/SignalBus connections
- 📈 **CTS Compliance Dashboard**: React-based hop status boards with real-time progress tracking
- ⚡ **High Performance**: <50ms server startup, <400ms clustered map rendering
- 🧪 **Well-Tested**: 188 tests (93.6% pass rate), comprehensive coverage
- 🔒 **Secure**: Stdio transport, Zod validation, webview sandbox

## Quick Start

### Installation

```bash
cd cts_mcp
npm install
npm run build
```

**Note**: The server uses web-tree-sitter (WASM) for GDScript parsing. If the WASM file (`tree-sitter-gdscript.wasm`) is not available, the server will automatically fall back to a proven regex parser. See `docs/WASM_SETUP.md` for details.

### Usage

Start the MCP server (stdio transport):

```bash
node build/index.js
```

The server listens on stdin and writes to stdout using JSON-RPC 2.0 protocol.

## Tools

### 1. CTS_Export_to_Shrimp

Convert hop plan JSON to Shrimp tasks automatically.

**Input**:
```json
{
  "hopPlanJson": "{\"phases\":[{\"name\":\"Phase 1\",\"hops\":[{\"id\":\"1.1\",\"name\":\"Setup\",\"description\":\"Initialize project\",\"estimatedLOC\":200,\"dependencies\":[]}]}]}"
}
```

**Output**:
```json
{
  "success": true,
  "tasksCreated": 1,
  "taskIds": ["550e8400-e29b-41d4-a716-446655440000"]
}
```

**Example**:
```bash
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "CTS_Export_to_Shrimp",
    "arguments": {
      "hopPlanJson": "{\"phases\":[{\"name\":\"Phase 1\",\"hops\":[{\"id\":\"1.1\",\"name\":\"Setup Infrastructure\",\"description\":\"Initialize TypeScript project\",\"estimatedLOC\":200,\"dependencies\":[]}]}]}"
    }
  }
}' | node build/index.js
```

### 2. CTS_Render_Artifact

Render interactive visualizations (signal maps, hop dashboards, dependency graphs, performance trends).

**Supported Artifact Types**:
- `signal_map`: Basic force-directed signal graph
- `signal_map_v2`: Clustered signal map with community detection (Phase 2)
- `dependency_graph`: Hierarchical signal connection visualization (Phase 2)
- `performance_trends`: Time-series performance monitoring (Phase 2)
- `hop_dashboard`: CTS hop status board

**Signal Map V2 (Clustered) Example**:
```bash
cat test_signal_map_v2.json | node build/index.js 2>/dev/null | jq '.result.content[0].text' -r | jq -r '.html' > clustered_map.html
```

**Features**:
- Greedy modularity optimization clustering
- Convex hull boundaries for clusters
- Interactive legend (toggle cluster visibility)
- Performance overlay (clustering + render time)
- Supports 150-300 signals

**Dependency Graph Example**:
```bash
cat test_dependency_graph.json | node build/index.js 2>/dev/null | jq '.result.content[0].text' -r | jq -r '.html' > dependencies.html
```

**Features**:
- Hierarchical tree layout
- Signal definitions (green) and connections (blue)
- File grouping visualization
- Cross-file tracking

**Performance Trends Example**:
```bash
cat test_performance_trends.json | node build/index.js 2>/dev/null | jq '.result.content[0].text' -r | jq -r '.html' > trends.html
```

**Features**:
- Multi-line time-series chart (D3.js)
- Metric selection (dropdown)
- Zoom/pan interaction
- Threshold annotations

**Hop Dashboard Example**:
```bash
cat test_hop_dashboard.json | node build/index.js 2>/dev/null | jq '.result.content[0].text' -r | jq -r '.html' > hop_dashboard.html
```

### 3. CTS_Scan_Project_Signals

Scan Godot project for signal definitions.

**Input**:
```json
{
  "projectPath": "/home/user/Godot/MyProject",
  "includeEventBusOnly": true
}
```

**Output**:
```json
{
  "success": true,
  "signalsFound": 55,
  "data": {
    "signals": [...],
    "filters": {}
  }
}
```

## Examples

### Example 1: Render Signal Map

```bash
# 1. Create test data
cat > test_signals.json << 'EOF'
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "CTS_Render_Artifact",
    "arguments": {
      "artifactType": "signal_map",
      "data": "{\"signals\":[{\"name\":\"player_health_changed\",\"file\":\"autoload/EventBus.gd\",\"line\":5,\"connections\":[{\"file\":\"ui/HealthBar.gd\",\"line\":12},{\"file\":\"components/HealthComponent.gd\",\"line\":45}]},{\"name\":\"player_died\",\"file\":\"autoload/EventBus.gd\",\"line\":6,\"connections\":[{\"file\":\"scenes/GameManager.gd\",\"line\":78},{\"file\":\"ui/DeathScreen.gd\",\"line\":23}]}],\"filters\":{}}"
    }
  }
}
EOF

# 2. Render and save HTML
cat test_signals.json | node build/index.js 2>/dev/null | jq '.result.content[0].text' -r | jq -r '.html' > signal_map.html

# 3. Open in browser
xdg-open signal_map.html
```

**Result**: Interactive D3.js force-directed graph with 2 signals and 4 connections.

### Example 2: Render Hop Dashboard

```bash
# 1. Create test data
cat > test_hops.json << 'EOF'
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "CTS_Render_Artifact",
    "arguments": {
      "artifactType": "hop_dashboard",
      "data": "{\"phases\":[{\"name\":\"Phase 1: Foundation\",\"hops\":[{\"id\":\"5.1a\",\"name\":\"MCP Core Infrastructure\",\"status\":\"completed\",\"estimatedLOC\":400,\"actualLOC\":421,\"ctsCompliant\":true,\"dependencies\":[],\"testCoverage\":85},{\"id\":\"5.1b\",\"name\":\"Artifact Visualizations\",\"status\":\"in_progress\",\"estimatedLOC\":350,\"actualLOC\":294,\"ctsCompliant\":true,\"dependencies\":[\"5.1a\"],\"testCoverage\":78}]}],\"statistics\":{\"totalLOC\":715,\"plannedLOC\":750,\"complianceRate\":100,\"completionRate\":50}}"
    }
  }
}
EOF

# 2. Render and save HTML
cat test_hops.json | node build/index.js 2>/dev/null | jq '.result.content[0].text' -r | jq -r '.html' > hop_dashboard.html

# 3. Open in browser
xdg-open hop_dashboard.html
```

**Result**: Interactive React dashboard with 2 hops, status filtering, and statistics panel.

### Example 3: Export to Shrimp (Requires Shrimp MCP Running)

```bash
# 1. Start Shrimp MCP server (in separate terminal)
# (Follow Shrimp MCP setup instructions)

# 2. Create hop plan
cat > hop_plan.json << 'EOF'
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "CTS_Export_to_Shrimp",
    "arguments": {
      "hopPlanJson": "{\"phases\":[{\"name\":\"Phase 1: Setup\",\"hops\":[{\"id\":\"1.1\",\"name\":\"Initialize TypeScript Project\",\"description\":\"Create package.json, tsconfig.json, and src structure\",\"estimatedLOC\":200,\"dependencies\":[]},{\"id\":\"1.2\",\"name\":\"Implement MCP Server\",\"description\":\"Create server.ts with stdio transport and protocol handlers\",\"estimatedLOC\":300,\"dependencies\":[\"1.1\"]}]}]}"
    }
  }
}
EOF

# 3. Export to Shrimp
cat hop_plan.json | node build/index.js

# 4. Check Shrimp for created tasks
# (Use Shrimp CLI or UI to view tasks)
```

**Result**: 2 tasks created in Shrimp with dependencies configured.

## GDScript Integration

The CTS MCP server can be called from Godot GDScript using the `BDMCPClient` from the `bd_dev_tools` addon.

### Prerequisites

1. Install `bd_dev_tools` addon (contains `BDMCPClient`)
2. Build the CTS MCP server: `npm run build`
3. Ensure CTS MCP binary is accessible at `cts_mcp/build/index.js`

### Quick Start

```gdscript
extends Node

var mcp_client: BDMCPClient

func _ready() -> void:
    # Initialize MCP client
    mcp_client = BDMCPClient.new()
    add_child(mcp_client)
    
    # Register CTS MCP server
    var error := CTSMCPConfig.register_cts_server(mcp_client)
    if error != OK:
        push_error("Failed to register CTS MCP server: ", error)
        return
    
    # Connect to server (starts stdio subprocess)
    error = CTSMCPConfig.connect_to_cts_server(mcp_client)
    if error != OK:
        push_error("Failed to connect to CTS MCP server: ", error)
        return
    
    print("✅ CTS MCP server ready!")
    
    # Example: Export hop plan to Shrimp
    _export_example_hop()

func _export_example_hop() -> void:
    var hop_plan := {
        "phases": [{
            "name": "Phase 1: Foundation",
            "hops": [{
                "id": "1.1",
                "name": "Setup TypeScript Project",
                "description": "Initialize npm project with TypeScript config",
                "estimatedLOC": 200,
                "dependencies": []
            }]
        }]
    }
    
    var response := CTSMCPConfig.call_export_to_shrimp(
        mcp_client,
        hop_plan,
        "append",  # updateMode: append, overwrite, selective, clearAllTasks
        true       # generateSubTasks
    )
    
    if response.has("error"):
        push_error("❌ Export failed: ", response.error.message)
        return
    
    print("✅ Tasks created: ", response.content.tasksCreated)
    print("📋 Task IDs: ", response.content.taskIds)
```

### API Reference

#### CTSMCPConfig.register_cts_server(client: BDMCPClient) -> Error

Registers the CTS MCP server configuration with the MCP client.

**Parameters**:
- `client`: BDMCPClient instance

**Returns**: `Error` enum (OK or error code)

**Example**:
```gdscript
var error := CTSMCPConfig.register_cts_server(mcp_client)
if error != OK:
    push_error("Registration failed: ", error)
```

#### CTSMCPConfig.connect_to_cts_server(client: BDMCPClient) -> Error

Connects to the CTS MCP server (starts stdio subprocess).

**Parameters**:
- `client`: BDMCPClient instance (must be registered first)

**Returns**: `Error` enum (OK or error code)

**Example**:
```gdscript
var error := CTSMCPConfig.connect_to_cts_server(mcp_client)
if error != OK:
    push_error("Connection failed: ", error)
```

#### CTSMCPConfig.call_export_to_shrimp(client: BDMCPClient, hop_plan: Dictionary, update_mode: String, generate_sub_tasks: bool) -> Dictionary

Exports a hop plan to Shrimp MCP as tasks.

**Parameters**:
- `client`: BDMCPClient instance (must be connected)
- `hop_plan`: Hop plan dictionary (see schema below)
- `update_mode`: Task update mode (`"append"`, `"overwrite"`, `"selective"`, `"clearAllTasks"`)
- `generate_sub_tasks`: Whether to split hops into subtasks

**Returns**: Dictionary with keys:
- `content`: `{ tasksCreated: int, taskIds: Array, details: Array }`
- `error`: `{ code: String, message: String }` (if failed)

**Hop Plan Schema**:
```gdscript
{
    "phases": [
        {
            "name": "Phase Name",
            "hops": [
                {
                    "id": "1.1",
                    "name": "Hop Name",
                    "description": "Hop description",
                    "estimatedLOC": 200,
                    "dependencies": ["0.9"]  # Optional
                }
            ]
        }
    ]
}
```

**Example**:
```gdscript
var response := CTSMCPConfig.call_export_to_shrimp(
    mcp_client,
    {"phases": [...]},
    "append",
    true
)
print("Tasks created: ", response.content.tasksCreated)
```

### Advanced Usage

**Call other CTS tools directly:**

```gdscript
# CTS_Scan_Project_Signals
var scan_args := {
    "projectPath": "/home/user/Godot/MyProject",
    "includeEventBusOnly": true
}
var scan_response := mcp_client.call_tool("cts_mcp", "CTS_Scan_Project_Signals", scan_args)
print("Signals found: ", scan_response.content.signalsFound)

# CTS_Render_Artifact (Signal Map V2)
var artifact_args := {
    "artifactType": "signal_map_v2",
    "data": JSON.stringify({
        "signals": scan_response.content.data.signals,
        "filters": {}
    })
}
var artifact_response := mcp_client.call_tool("cts_mcp", "CTS_Render_Artifact", artifact_args)
print("Artifact HTML saved to: ", artifact_response.content.filePath)
```

### Error Handling

```gdscript
# Check if CTS MCP server is available before calling
var error := CTSMCPConfig.register_cts_server(mcp_client)
if error == ERR_FILE_NOT_FOUND:
    push_error("CTS MCP server not built. Run: cd cts_mcp && npm run build")
    return
elif error != OK:
    push_error("Failed to register CTS MCP server: ", error)
    return

# Handle tool call errors
var response := mcp_client.call_tool("cts_mcp", "CTS_Export_to_Shrimp", arguments)
if response.has("error"):
    push_error("Tool call failed: ", response.error.message)
    push_error("Error code: ", response.error.code)
```

### Debugging

Enable debug logging in `BDMCPClient`:

```gdscript
# In autoload/EventBus.gd or your initialization script
EventBus.mcp_debug_enabled = true

# Now all MCP communication will be logged:
# [MCP] Sending request: {"jsonrpc":"2.0",...}
# [MCP] Received response: {"result":...}
```

Check CTS MCP server logs:

```bash
# Run CTS MCP server manually to see logs
node build/index.js

# Send test request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

### Testing

The CTS MCP integration is validated by GUT tests in `test/cts_mcp/test_cts_mcp_client.gd`.

**Run tests via Godot Editor:**
1. Open Godot Editor: `godot4 --path /home/eric/Godot/ProtoBd --editor`
2. Navigate to: Bottom Panel → GUT → Run Tests
3. Select `test/cts_mcp/test_cts_mcp_client.gd` in the test list
4. Click "Run" button
5. View results in GUT panel

**Test Coverage:**
- Server registration and connection
- Tool list retrieval
- CTS_Export_to_Shrimp calls with various hop plans
- Error handling (invalid arguments, server unavailable)
- Response validation (schema compliance)

**Example test structure:**
```gdscript
godot4 --path . --headless -s addons/gut/gut_cmdln.gd -gtest=res://test/cts_mcp/

# Or use the GUT panel in Godot Editor
# Navigate to: Bottom Panel -> GUT -> Select test/cts_mcp/test_cts_mcp_client.gd -> Run
```

Expected test results:
- ✅ `test_cts_server_registration` - Registers server successfully
- ✅ `test_cts_connection` - Connects to server
- ✅ `test_list_cts_tools` - Lists 9+ tools (CTS_Export_to_Shrimp, CTS_Render_Artifact, etc.)
- ✅ `test_call_export_to_shrimp` - Calls tool and receives response
- ✅ `test_error_handling_missing_binary` - Handles missing binary gracefully
- ✅ `test_connection_timeout` - Handles connection timeout
- ✅ `test_server_lifecycle` - Full lifecycle (register, connect, disconnect)

## Architecture

### Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.0 (strict mode)
- **Protocol**: Model Context Protocol (stdio transport)
- **Validation**: Zod 3.22
- **Visualization**: D3.js 7 (CDN), React 18 (CDN)
- **Testing**: Jest 29.7

### Project Structure

```
cts_mcp/
├── src/
│   ├── index.ts                # Entry point (stdio transport)
│   ├── server.ts               # MCP server (protocol handlers)
│   ├── types.ts                # TypeScript interfaces
│   ├── parser/
│   │   ├── tree_sitter_bridge.ts    # WASM tree-sitter integration (Phase 2)
│   │   ├── signal_extractor.ts      # AST signal extraction (Phase 2)
│   │   └── parser_diagnostics.ts    # Regression testing (Phase 2)
│   ├── artifacts/
│   │   ├── artifact_engine.ts       # Renderer routing + caching
│   │   ├── metadata.ts              # Versioning system (Phase 2)
│   │   ├── types.ts                 # Artifact schemas
│   │   ├── clustering/
│   │   │   └── community_detection.ts  # Greedy modularity (Phase 2)
│   │   ├── parsers/
│   │   │   └── gdscript_parser.ts   # Signal extraction (Phase 1)
│   │   └── renderers/
│   │       ├── d3_signal_map.ts           # Basic force-directed (Phase 1)
│   │       ├── d3_signal_map_v2.ts        # Clustered map (Phase 2)
│   │       ├── dependency_graph.ts        # Connection tracking (Phase 2)
│   │       ├── performance_trends.ts      # Time-series (Phase 2)
│   │       └── react_hop_dashboard.ts     # React dashboard (Phase 1)
│   ├── metrics/
│   │   └── performance_pipeline.ts  # Trend data collection (Phase 2)
│   ├── tools/
│   │   ├── cts_export_to_shrimp.ts  # Shrimp integration
│   │   ├── render_artifact.ts       # Artifact tool
│   │   └── scan_project_signals.ts  # Signal scanner
│   └── integrations/
│       └── webview_manager_template.ts  # VS Code webview
├── test/
│   ├── __tests__/                   # Jest tests (188 total)
│   │   ├── tree_sitter_bridge.test.ts (12 tests)
│   │   ├── signal_extractor.test.ts (15 tests)
│   │   ├── parser_diagnostics.test.ts (30 tests)
│   │   ├── clustered_signal_map.test.ts (19 tests)
│   │   └── ... (other test files)
│   └── fixtures/
│       ├── *.gd                     # GDScript test files (20 files)
│       └── ground_truth/*.json      # Expected extraction results
├── docs/
│   ├── signals/
│   │   └── PHASE_2_SIGNAL_CONTRACTS.md
│   ├── architecture/decisions/
│   │   ├── ADR_TREE_SITTER_ADOPTION.md
│   │   └── ADR_CLUSTERING_STRATEGY.md
│   ├── guides/
│   │   └── PHASE_2_MIGRATION.md
│   └── PHASE_CTS_MCP_2_COMPLETION_REPORT.md
├── scripts/
│   └── benchmark_clustering.js      # Performance benchmarks
├── build/                           # Compiled JavaScript
├── package.json
├── tsconfig.json
└── jest.config.cjs
```

### Performance

| Metric | Target | Actual (Phase 2) | Status |
|--------|--------|------------------|--------|
| Server Startup | <2s | 46ms | ✅ 97.7% faster |
| Tool Routing | <100ms | 1-2ms | ✅ |
| Signal Parsing (1K LOC) | <250ms | 12.5ms | ✅ 20x faster |
| Signal Map (Basic, 50 nodes) | <500ms | 180ms | ✅ |
| Signal Map (Clustered, 150 nodes) | <1000ms | 400ms | ✅ 2.5x faster |
| Clustering (150 nodes) | <750ms | 3ms | ✅ 250x faster |
| Dependency Graph (150 nodes) | <800ms | 300ms | ✅ |
| Performance Trends (1K samples) | <500ms | 250ms | ✅ |
| Cache Lookup | <10ms | <1ms | ✅ |

## Development

### Build

```bash
npm run build          # Compile TypeScript → JavaScript
npm run dev            # Development mode (no build)
```

### Testing

```bash
npm test               # Run all tests
npm run test:coverage  # Run with coverage report
npm run test:watch     # Watch mode
```

**Test Results**:
- ✅ 23/23 tests passing (100% pass rate)
- ✅ 85% functional coverage
- ✅ <2s test execution time

### Code Quality

```bash
tsc --noEmit          # Type checking
npm run build         # Compilation (0 errors)
```

## Configuration

### Environment Variables

- `DEBUG=true` - Enable verbose logging
- `SHRIMP_MCP_PATH=/path/to/shrimp/build/index.js` - Custom Shrimp path

### Cache Configuration

Default cache settings in `src/artifacts/artifact_engine.ts`:

```typescript
private maxCacheSize = 50;  // Max artifacts cached
private maxCacheAge = 3600000;  // 1 hour (unused, artifacts are immutable)
```

## Troubleshooting

### Issue: "Shrimp MCP not found"

**Cause**: CTS_Export_to_Shrimp cannot reach Shrimp MCP server

**Solution**:
1. Ensure Shrimp MCP server is running
2. Check Shrimp path configuration
3. Verify stdio IPC permissions

### Issue: Artifact render timeout

**Cause**: Large dataset (100+ signals) exceeds render budget

**Solution**:
1. Filter signals before rendering (use `includeEventBusOnly: true`)
2. Increase timeout in VS Code extension
3. Phase 2 will add graph clustering

### Issue: TypeScript compilation errors

**Cause**: Missing type definitions or syntax errors

**Solution**:
```bash
npm install          # Ensure dependencies installed
npm run build        # Check for specific errors
```

## Documentation

### Guides
- **[MCP Server Guide](docs/MCP_SERVER_GUIDE.md)** - Complete usage guide with installation, configuration, and all tool documentation
- **[API Reference](docs/API_REFERENCE.md)** - Comprehensive API documentation with schemas, types, and examples
- **[Troubleshooting Guide](docs/TROUBLESHOOTING.md)** - Common issues and solutions

### Infrastructure
- **[CI/CD Pipeline](docs/CI_CD_PIPELINE.md)** - GitHub Actions workflow, benchmarks, coverage
- **[Packaging Guide](docs/PACKAGING.md)** - NPM publishing and Docker deployment procedures

### Technical Details
- **[Tier 2C Improvements](docs/TIER_2C_IMPROVEMENTS.md)** - Production hardening documentation (caching, config, sampling, errors, schemas)
- **[Phase 2 Migration](docs/guides/PHASE_2_MIGRATION.md)** - Upgrade guide from v1.0 to v2.0
- **[VS Code MCP Setup](docs/VSCODE_MCP_SETUP.md)** - VS Code integration configuration
- **[WASM Setup](docs/WASM_SETUP.md)** - Tree-sitter WASM configuration

### Architecture Decision Records
- **[ADR: Tree-sitter Adoption](docs/architecture/decisions/ADR_TREE_SITTER_ADOPTION.md)**
- **[ADR: Clustering Strategy](docs/architecture/decisions/ADR_CLUSTERING_STRATEGY.md)**
- **[ADR: Sandpack Deferral](docs/architecture/decisions/ADR_SANDPACK_PHASE_3.md)**
- **[ADR: D3.js Signal Map](docs/architecture/decisions/ADR_D3_SIGNAL_MAP.md)**

### Project Documentation
- **[Test Results](./TEST_RESULTS.md)** - Comprehensive test coverage report
- **[CHANGELOG](./CHANGELOG.md)** - Version history and release notes

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development guidelines.

## License

MIT License - See [LICENSE.txt](../LICENSE.txt)

## Changelog

### v3.0.0 (October 31, 2025)

**Tier 0 & Tier 1 Complete** ✅ - Template-First MCP Development

- ✅ **New Tools**: Added 4 tools using template-first design:
  - CTS_Reasoning (template-driven iteration, 750 LOC)
  - CTS_Bughunter (search + heuristic scan, 720 LOC)
  - CTS_Cleanup (filesystem tidy, 740 LOC)
  - CTS_Audit_Project (compliance checks, 740 LOC)
- ✅ **Tree-Sitter Fix**: Migrated to WASM (`web-tree-sitter`)
  - Unblocked 3 tools: scan_project_signals, analyze_project, suggest_refactoring
  - AST parsing with caching (<50ms per file, <1ms cached)
  - Headless CI/CD compatible (no native module compilation)
- ✅ **MCP Tool Templates** (Tier 0):
  - TypeScript template: 460 lines, 5 sections (Zod, MCPError, logging, performance tracking)
  - Rust template: 483 lines, 5 sections (safe mutex, tracing, async/await)
  - Template compliance audit: 13 tools scored (avg 64/100, max 90/100)
- ✅ **Architecture Enhancements**:
  - Signal contracts (Section 10): Cross-MCP data flow schemas
  - Performance budgets (Section 11): <100ms sync tools, <5s async tools
  - Integration topology (Section 12): Coordinator pattern documentation
- ✅ **GDScript Integration**: MCPClient for CTS tool calling from Godot
- ✅ **Breaking Changes**:
  - Requires Node.js 18+ (ESM modules, WASM support)
  - tree-sitter → web-tree-sitter (native bindings removed)
  - 9 total tools (5 existing + 4 new)

**Metrics**:
- Total Tools: 9 (5 existing + 4 new template-based)
- Total LOC: ~4,500 (implementation) + ~1,200 (tests)
- Performance: All tools meet <100ms sync / <5s async budgets
- CTS Compliance: 100% (all files <500 lines)
- Template Compliance: 90% (cts_export_to_shrimp reference implementation)

### v1.0.0 (2025-10-30)

**Phase CTS_MCP_1 Complete** ✅

- ✅ MCP server with stdio transport
- ✅ Shrimp integration (CTS_Export_to_Shrimp tool)
- ✅ D3.js signal map renderer (force-directed graph)
- ✅ React hop dashboard renderer (interactive filtering)
- ✅ GDScript parser (signal extraction)
- ✅ Artifact caching (SHA-256 + LRU)
- ✅ 23 integration tests (100% pass rate)
- ✅ 85% functional coverage

**Metrics**:
- Total LOC: 1,097 (implementation) + 450 (tests)
- Performance: 97.7% faster than targets
- CTS Compliance: 100% (all files <500 lines)

## Roadmap

### Phase 2 (Planned)
- Dependency graph renderer (visualize hop dependencies)
- Performance chart renderer (LOC over time)
- Graph clustering (100+ signal support)
- Tree-sitter GDScript parser (robust signal extraction)

### Phase 3 (Future)
- Sandpack integration (game visualizers)
- Scene preview renderer
- Interactive mechanic demos

---

**Maintained by**: Development Team  
**Questions?**: See [MCP_PROTOCOL.md](../docs/MCP_PROTOCOL.md) or open an issue
