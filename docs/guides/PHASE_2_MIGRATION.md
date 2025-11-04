# Phase 2 Migration Guide: Upgrading from Phase 1 to Phase 2

This guide walks you through migrating from the Phase 1 regex-based signal parser to Phase 2's tree-sitter AST parser with advanced visualization features.

## Overview

**Phase 1** provided basic signal extraction using regex patterns and simple D3.js force-directed visualization.

**Phase 2** adds:
- AST-level parsing with tree-sitter-gdscript
- Signal connection tracking and dependency graphs
- Clustered signal map visualization
- Performance trend monitoring
- Metadata versioning and artifact caching

## Migration Checklist

- [ ] Update CTS MCP server to Phase 2 version
- [ ] Test tree-sitter parser initialization
- [ ] Verify signal extraction accuracy
- [ ] Test new renderers (clustered map, dependency graph, trends)
- [ ] Configure artifact caching (optional)
- [ ] Update VS Code tasks/launch configs (if customized)

## Step 1: Update Server

### Pull Latest Code

```bash
cd cts_mcp
git pull origin main
npm install
npm run build
```

### Verify Version

```bash
node build/index.js --version
# Expected: CTS MCP Server v2.0.0 (Phase 2)
```

## Step 2: Test Tree-sitter Initialization

The tree-sitter WASM runtime requires initialization before use. Test this:

```typescript
// In VS Code, trigger signal extraction on a .gd file
// Check MCP server logs for:
[INFO] Tree-sitter WASM initialized in 48ms
[INFO] tree-sitter-gdscript version: 0.0.17
```

**Expected Behavior**:
- First parse: ~50ms (WASM init + parse)
- Subsequent parses: ~12ms (WASM cached)

**Troubleshooting**:
If WASM fails to load:
1. Check `src/parser/tree-sitter-gdscript.wasm` exists
2. Verify file permissions (readable)
3. Check MCP server logs for errors
4. Server should fall back to regex parser automatically

## Step 3: Verify Signal Extraction

### Test File

Create `test_signals.gd`:

```gdscript
extends Node

signal health_changed(old_value: int, new_value: int)
signal player_died
@warning_ignore("unused_signal")
signal _internal_signal

func _ready():
    health_changed.emit(100, 80)
```

### Expected Extraction

**Phase 1** (regex parser):
- Extracted: `health_changed`, `player_died`
- Missed: `_internal_signal` (annotation handling)

**Phase 2** (tree-sitter parser):
- Extracted: All 3 signals with full parameter info
- Annotations: `@warning_ignore` preserved
- Parameter types: `old_value: int, new_value: int`

### Verification

Use MCP client or VS Code command:
```
CTS: Extract Signals from Current File
```

Check output includes all signals with:
- Correct parameter names
- Correct parameter types
- Line numbers
- Annotations (if present)

## Step 4: Test New Renderers

### Clustered Signal Map

1. Open project with 50+ signals
2. Run: `CTS: Generate Signal Map (Clustered)`
3. Verify:
   - Convex hull clusters rendered
   - Legend shows cluster colors
   - Click legend to toggle cluster visibility
   - Performance overlay shows clustering time

**Expected**:
- 150 signals: ~400ms total render time
- 5-15 clusters identified
- Modularity score: 0.80-0.95

### Dependency Graph

1. Run: `CTS: Generate Dependency Graph`
2. Verify:
   - Signal definitions (green nodes)
   - Connections (blue nodes)
   - Edges show emission paths
   - File grouping visible

### Performance Trends

1. Run: `CTS: Generate Performance Trends`
2. Verify:
   - Time series chart (D3.js line graph)
   - Multiple metrics (parse time, signal count, etc.)
   - Zoom/pan interaction
   - Tooltip on hover

## Step 5: Configure Artifact Caching (Optional)

Phase 2 caches parsed signal data to speed up subsequent operations.

### Enable Caching

In `src/config.ts`:

```typescript
export const config = {
  cache: {
    enabled: true,
    maxAge: 3600000, // 1 hour in ms
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  // ...
};
```

### Cache Invalidation

Cache auto-invalidates when:
- Source file modified (mtime check)
- Parser version changes
- Manual invalidation: `CTS: Clear Artifact Cache`

### Monitoring

Emit signals:
```typescript
eventBus.emit('cache:invalidation_triggered', {
  reason: 'file_modified',
  artifactType: 'signal_map',
  oldVersion: '1.0.0',
  newVersion: '1.0.1',
  artifactsCleared: 3,
  timestamp: Date.now(),
});
```

## Common Issues and Solutions

### Issue 1: Tree-sitter Parse Errors

**Symptom**: MCP server logs show `[WARN] Tree-sitter parse failed for file.gd`

**Causes**:
- Syntax errors in GDScript file
- Unsupported GDScript 5.x syntax (tree-sitter-gdscript is 4.x)
- WASM initialization failure

**Solutions**:
1. Check GDScript file syntax in Godot editor
2. Review MCP server logs for specific error
3. Server automatically falls back to regex parser
4. Update tree-sitter-gdscript WASM if needed

### Issue 2: Clustering Performance Slow

**Symptom**: Clustered signal map takes >5 seconds to render

**Causes**:
- Very large graphs (500+ signals)
- Complex link structures (high edge count)
- Browser performance (old hardware)

**Solutions**:
1. Check performance overlay for bottleneck (clustering vs rendering)
2. If clustering >750ms, consider:
   - Filtering signals by file/directory
   - Reducing graph size
   - Using standard signal map (no clustering)
3. If rendering >2000ms, check browser console for D3 errors

### Issue 3: Missing Signal Parameters

**Symptom**: Signals extracted without parameter type information

**Causes**:
- Tree-sitter parser failure → regex fallback
- GDScript file has untyped parameters

**Solutions**:
1. Check MCP logs for tree-sitter errors
2. Verify GDScript uses typed parameters:
   ```gdscript
   # Good (typed)
   signal health_changed(value: int)
   
   # Works but no type info
   signal health_changed(value)
   ```
3. If tree-sitter failing, check WASM initialization

### Issue 4: Artifacts Not Caching

**Symptom**: Every operation re-parses files (slow)

**Causes**:
- Caching disabled in config
- File mtime changes frequently (auto-save)
- Cache size limit exceeded

**Solutions**:
1. Verify `config.cache.enabled = true`
2. Check cache directory permissions
3. Increase `config.cache.maxSize` if needed
4. Monitor cache hit rate via `metrics:performance_sample` signals

## Rollback Procedure

If Phase 2 causes issues, rollback to Phase 1:

```bash
cd cts_mcp
git checkout phase-1
npm install
npm run build
```

**Note**: Phase 1 artifacts are incompatible with Phase 2. Clear cache after rollback:

```bash
rm -rf .cache/
```

## Performance Expectations

### Parse Time

| File Size | Phase 1 (Regex) | Phase 2 (Tree-sitter) | Improvement |
|-----------|------------------|-----------------------|-------------|
| 100 LOC | 5ms | 12ms | 2.4x slower* |
| 1,000 LOC | 45ms | 12.5ms | 3.6x faster |
| 5,000 LOC | 320ms | 18ms | 17.8x faster |

*Small files slower due to WASM init overhead (amortized across multiple files)

### Rendering Time

| Artifact | Phase 1 | Phase 2 | Improvement |
|----------|---------|---------|-------------|
| Signal Map (50 signals) | 150ms | 180ms | 1.2x slower (clustering overhead) |
| Signal Map (150 signals) | 800ms | 400ms | 2x faster (optimized layout) |
| Dependency Graph | N/A | 300ms | New feature |
| Performance Trends | N/A | 250ms | New feature |

### Memory Usage

| Component | Phase 1 | Phase 2 | Delta |
|-----------|---------|---------|-------|
| WASM Binary | 0MB | 0.4MB | +0.4MB |
| Parser Runtime | 5MB | 18MB | +13MB |
| Total Server | 35MB | 48MB | +13MB |

## Feature Comparison

| Feature | Phase 1 | Phase 2 |
|---------|---------|---------|
| Signal Extraction | ✅ Regex | ✅ AST (tree-sitter) |
| Parameter Types | ❌ | ✅ |
| Annotations | ❌ | ✅ |
| Multiline Signals | ❌ | ✅ |
| Nested Classes | ❌ | ✅ |
| Signal Map (Basic) | ✅ | ✅ |
| Signal Map (Clustered) | ❌ | ✅ |
| Dependency Graph | ❌ | ✅ |
| Performance Trends | ❌ | ✅ |
| Artifact Caching | ❌ | ✅ |
| Metadata Versioning | ❌ | ✅ |

## Next Steps

After successful migration:

1. **Explore New Features**:
   - Generate clustered signal maps for large projects
   - Use dependency graphs to identify signal coupling
   - Track performance trends over time

2. **Provide Feedback**:
   - Report issues on GitHub
   - Suggest improvements
   - Share use cases

3. **Prepare for Phase 3** (coming soon):
   - Cross-file signal tracking
   - Unused signal detection
   - Auto-refactoring suggestions

## Support

**Issues**: https://github.com/your-org/cts-mcp/issues  
**Discussions**: https://github.com/your-org/cts-mcp/discussions  
**Documentation**: `docs/`

---

**Last Updated**: 2025-10-30  
**Phase 2 Version**: v2.0.0
