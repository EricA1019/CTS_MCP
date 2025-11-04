# CTS MCP Server - Troubleshooting Guide

**Version**: 3.0.0  
**Last Updated**: November 2, 2025

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Server Startup Problems](#server-startup-problems)
3. [Tool Execution Errors](#tool-execution-errors)
4. [Performance Issues](#performance-issues)
5. [Caching Problems](#caching-problems)
6. [Configuration Issues](#configuration-issues)
7. [Parser Errors](#parser-errors)
8. [VS Code Integration](#vs-code-integration)
9. [Docker Problems](#docker-problems)
10. [Debugging Techniques](#debugging-techniques)

---

## Installation Issues

### Issue: `npm install` fails with dependency errors

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Causes**:
- Outdated npm version
- Node.js version mismatch
- Corrupted package-lock.json

**Solutions**:

1. **Update npm and Node.js**:
   ```bash
   # Check versions
   node --version  # Should be ≥18.0.0
   npm --version   # Should be ≥8.0.0

   # Update npm
   npm install -g npm@latest

   # Update Node.js (use nvm)
   nvm install 20
   nvm use 20
   ```

2. **Clean install**:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

3. **Use legacy peer deps** (last resort):
   ```bash
   npm install --legacy-peer-deps
   ```

---

### Issue: `npm run build` fails with TypeScript errors

**Symptoms**:
```
error TS2307: Cannot find module '@modelcontextprotocol/sdk/server/index.js'
```

**Causes**:
- Missing dependencies
- TypeScript configuration mismatch
- Outdated @modelcontextprotocol/sdk

**Solutions**:

1. **Reinstall dependencies**:
   ```bash
   npm install
   ```

2. **Check TypeScript version**:
   ```bash
   npm list typescript
   # Should be ≥5.0.0
   ```

3. **Verify tsconfig.json**:
   ```json
   {
     "compilerOptions": {
       "module": "ES2022",
       "moduleResolution": "node",
       "target": "ES2022"
     }
   }
   ```

---

## Server Startup Problems

### Issue: Server starts but doesn't respond to requests

**Symptoms**:
- No output after starting `node build/index.js`
- JSON-RPC requests timeout

**Causes**:
- Stdio transport not initialized
- Server listening on wrong transport
- Configuration file syntax error

**Solutions**:

1. **Verify server initialization**:
   ```bash
   # Should see startup log
   node build/index.js
   # Expected: [2025-11-02T...] INFO Server ready on stdio transport
   ```

2. **Test with simple request**:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node build/index.js
   ```

3. **Check configuration syntax**:
   ```bash
   # Validate JSON
   cat .cts-mcp.json | jq .
   # Should output valid JSON or error message
   ```

4. **Enable debug logging**:
   ```bash
   export LOG_LEVEL=debug
   node build/index.js
   ```

---

### Issue: "Module not found" errors on startup

**Symptoms**:
```
Error: Cannot find module './observability/index.js'
```

**Causes**:
- Build directory missing or incomplete
- TypeScript compilation failed
- Missing source files

**Solutions**:

1. **Rebuild project**:
   ```bash
   npm run clean  # If clean script exists
   npm run build
   ```

2. **Check build output**:
   ```bash
   ls -la build/
   # Should contain: index.js, tools/, cache/, config/, observability/
   ```

3. **Verify source files**:
   ```bash
   find src/ -name "*.ts" | wc -l
   # Should be >20 files
   ```

---

## Tool Execution Errors

### Issue: "VALIDATION_ERROR: Invalid input"

**Symptoms**:
```json
{
  "error": {
    "code": -32603,
    "message": "VALIDATION_ERROR: Invalid hop plan",
    "data": {
      "field": "estimatedLOC",
      "value": -100,
      "expected": "positive integer"
    }
  }
}
```

**Causes**:
- Input doesn't match Zod schema
- Missing required fields
- Invalid data types

**Solutions**:

1. **Check input schema** (see [API_REFERENCE.md](./API_REFERENCE.md)):
   ```typescript
   // Example: CTS_Export_to_Shrimp requires:
   {
     hopPlan: {
       hopId: string,      // Required, min 1 char
       name: string,       // Required, min 1 char
       description: string, // Required, min 1 char
       estimatedLOC: number // Required, positive integer
     }
   }
   ```

2. **Validate input before sending**:
   ```bash
   # Use jq to validate JSON
   echo '{"hopPlan":{"hopId":"5.2a",...}}' | jq .
   ```

3. **Check error details**:
   - The `data` field shows which field failed validation
   - The `expected` field shows what was expected

---

### Issue: "PARSE_ERROR: Failed to parse GDScript file"

**Symptoms**:
```json
{
  "error": {
    "code": -32603,
    "message": "PARSE_ERROR: Failed to parse GDScript file",
    "data": {
      "file": "/path/to/file.gd",
      "line": 42,
      "parser": "tree-sitter"
    }
  }
}
```

**Causes**:
- Syntax error in GDScript file
- Tree-sitter WASM not loaded
- Unsupported GDScript syntax

**Solutions**:

1. **Check file syntax**:
   ```bash
   # Open file in Godot editor to check for errors
   godot --editor /path/to/project
   ```

2. **Enable fallback parser**:
   ```json
   // .cts-mcp.json
   {
     "parser": {
       "fallbackToRegex": true
     }
   }
   ```

3. **Verify WASM file exists**:
   ```bash
   ls -la build/tree-sitter-gdscript.wasm
   # Should exist and be >100KB
   ```

4. **Test with simpler file**:
   ```bash
   # Create minimal test file
   echo "signal test_signal" > test.gd
   # Then scan
   ```

---

### Issue: "FILESYSTEM_ERROR: Project path not found"

**Symptoms**:
```json
{
  "error": {
    "code": -32603,
    "message": "FILESYSTEM_ERROR: Project path not found",
    "data": {
      "path": "/nonexistent/path",
      "suggestion": "Verify the project path exists and is accessible"
    }
  }
}
```

**Causes**:
- Path doesn't exist
- Insufficient permissions
- Path is relative instead of absolute

**Solutions**:

1. **Use absolute paths**:
   ```bash
   # Wrong
   {"projectPath": "../my-project"}

   # Right
   {"projectPath": "/home/user/godot/my-project"}
   ```

2. **Check permissions**:
   ```bash
   ls -la /path/to/project
   # Should show read permissions
   ```

3. **Verify project.godot exists**:
   ```bash
   ls -la /path/to/project/project.godot
   # Should exist for valid Godot project
   ```

---

## Performance Issues

### Issue: Tool execution times out

**Symptoms**:
- Tool takes >10 seconds
- No response returned
- VS Code shows timeout error

**Causes**:
- Large project (>1000 files)
- Inefficient sampling
- Cache disabled

**Solutions**:

1. **Enable caching**:
   ```json
   {
     "cache": {
       "maxSize": 200,  // Increase if needed
       "ttlMs": 600000  // 10 minutes
     }
   }
   ```

2. **Adjust sampling**:
   ```json
   {
     "sampling": {
       "largeArrayThreshold": 500,  // Lower threshold
       "sampleSize": 50             // Smaller sample
     }
   }
   ```

3. **Exclude unnecessary files**:
   ```json
   {
     "tools": {
       "CTS_Scan_Project": {
         "excludePatterns": [
           "**/addons/**",
           "**/.godot/**",
           "**/tests/**"  // Add more exclusions
         ]
       }
     }
   }
   ```

4. **Increase performance budgets**:
   ```json
   {
     "performance": {
       "budgets": {
         "syncToolMaxMs": 200,   // From 100
         "asyncToolMaxMs": 10000 // From 5000
       }
     }
   }
   ```

---

### Issue: High memory usage

**Symptoms**:
- Node.js process uses >1GB RAM
- System becomes slow
- Out of memory errors

**Causes**:
- Large cache size
- Too many cached parse results
- Memory leak

**Solutions**:

1. **Reduce cache size**:
   ```json
   {
     "cache": {
       "maxSize": 50  // From 100
     }
   }
   ```

2. **Clear cache periodically**:
   ```typescript
   import { cache } from './cache/result-cache.js';
   cache.clear();
   ```

3. **Disable parse caching**:
   ```json
   {
     "parser": {
       "cacheParseResults": false
     }
   }
   ```

4. **Monitor memory**:
   ```bash
   # Linux
   ps aux | grep "node build/index.js"

   # macOS
   top -pid $(pgrep -f "node build/index.js")
   ```

---

## Caching Problems

### Issue: Cache not working (0% hit rate)

**Symptoms**:
- `cacheHit: false` in all tool responses
- Cache stats show 0 hits
- Performance doesn't improve on repeated calls

**Causes**:
- Cache disabled in config
- Cache keys changing (non-deterministic input)
- Cache TTL too short

**Solutions**:

1. **Verify cache enabled**:
   ```json
   {
     "cache": {
       "maxSize": 100,  // Must be >0
       "ttlMs": 300000  // Must be >0
     }
   }
   ```

2. **Check cache stats**:
   ```typescript
   import { cache } from './cache/result-cache.js';
   console.log(cache.getStats());
   // { size: 0, hits: 0, misses: 10, hitRate: 0 }
   ```

3. **Ensure deterministic input**:
   ```bash
   # Same input should produce same cache key
   # Avoid timestamps, random values in tool arguments
   ```

4. **Increase TTL**:
   ```json
   {
     "cache": {
       "ttlMs": 600000  // 10 minutes instead of 5
     }
   }
   ```

---

### Issue: Stale cache results

**Symptoms**:
- Tool returns outdated data
- Changes to project not reflected
- Cache needs manual clearing

**Causes**:
- TTL too long
- Cache not invalidated on file changes
- Bypass cache not used

**Solutions**:

1. **Reduce TTL**:
   ```json
   {
     "cache": {
       "ttlMs": 60000  // 1 minute for development
     }
   }
   ```

2. **Bypass cache for specific calls**:
   ```json
   {
     "arguments": {
       "projectPath": "/path",
       "_bypassCache": true
     }
   }
   ```

3. **Clear cache manually**:
   ```typescript
   import { cache } from './cache/result-cache.js';
   cache.clear();
   ```

4. **Implement file watching** (future enhancement):
   ```typescript
   // Watch project files for changes
   // Invalidate cache entries when files modified
   ```

---

## Configuration Issues

### Issue: Configuration changes not applied

**Symptoms**:
- Changed `.cts-mcp.json` but behavior unchanged
- Server still using old settings

**Causes**:
- Configuration file syntax error
- Hot-reload disabled
- Server not restarted for non-reloadable settings

**Solutions**:

1. **Validate JSON syntax**:
   ```bash
   cat .cts-mcp.json | jq .
   # Should output valid JSON or show error
   ```

2. **Check server logs for reload message**:
   ```
   [2025-11-02T12:00:00.000Z] INFO Configuration reloaded {"level":"debug"}
   ```

3. **Restart server for non-reloadable settings**:
   - Parser settings
   - Tool-specific settings
   - Require full restart

4. **Use environment variables for testing**:
   ```bash
   export LOG_LEVEL=debug
   node build/index.js
   ```

---

### Issue: "Configuration validation failed"

**Symptoms**:
```
[2025-11-02T12:00:00.000Z] ERROR Configuration validation failed
```

**Causes**:
- Invalid value types
- Missing required fields
- Out of range values

**Solutions**:

1. **Check configuration schema** (see [MCP_SERVER_GUIDE.md](./MCP_SERVER_GUIDE.md#configuration))

2. **Common validation errors**:
   ```json
   // Wrong
   {
     "cache": {
       "maxSize": "100"  // Should be number, not string
     }
   }

   // Right
   {
     "cache": {
       "maxSize": 100
     }
   }
   ```

3. **Use default configuration as template**:
   ```bash
   # Generate default config
   node build/index.js --generate-config > .cts-mcp.json
   ```

---

## Parser Errors

### Issue: Tree-sitter WASM fails to load

**Symptoms**:
```
[2025-11-02T12:00:00.000Z] WARN Failed to load tree-sitter WASM, falling back to regex parser
```

**Causes**:
- WASM file missing
- Incorrect WASM path in config
- Node.js doesn't support WASM

**Solutions**:

1. **Verify WASM file exists**:
   ```bash
   ls -la build/tree-sitter-gdscript.wasm
   ```

2. **Copy WASM to build directory**:
   ```bash
   cp node_modules/web-tree-sitter/tree-sitter.wasm build/
   # Also copy language-specific WASM if separate
   ```

3. **Update WASM path in config**:
   ```json
   {
     "parser": {
       "wasmPath": "./build/tree-sitter-gdscript.wasm"
     }
   }
   ```

4. **Enable fallback** (acceptable for most use cases):
   ```json
   {
     "parser": {
       "fallbackToRegex": true
     }
   }
   ```

---

### Issue: Regex parser missing signals

**Symptoms**:
- Expected signals not found
- `signals: []` for files with signals
- Lower accuracy than tree-sitter

**Causes**:
- Complex signal syntax
- Multi-line signal definitions
- Regex pattern limitations

**Solutions**:

1. **Use tree-sitter parser** (recommended):
   - Ensure WASM loaded correctly
   - Tree-sitter has 100% accuracy vs 94.3% for regex

2. **Simplify signal definitions**:
   ```gdscript
   # Regex-friendly (works)
   signal player_died

   # Harder to parse with regex (may miss)
   signal player_died(
     damage: int,
     killer: Node
   )
   ```

3. **File bug report** with example:
   - Include GDScript file that fails
   - Expected vs actual signals found

---

## VS Code Integration

### Issue: MCP server not appearing in VS Code

**Symptoms**:
- No CTS tools in VS Code command palette
- MCP extension shows no servers

**Causes**:
- Server not configured in VS Code settings
- Extension not installed
- Configuration path incorrect

**Solutions**:

1. **Install MCP extension**:
   - Search "Model Context Protocol" in VS Code extensions
   - Install and reload

2. **Configure server path**:
   ```json
   // settings.json
   {
     "mcp.servers": {
       "cts": {
         "command": "node",
         "args": ["/absolute/path/to/cts_mcp/build/index.js"],
         "env": {
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

3. **Restart VS Code**:
   - Full restart required after configuration changes

4. **Check MCP logs**:
   - View → Output → Select "Model Context Protocol"

See [VSCODE_MCP_SETUP.md](./VSCODE_MCP_SETUP.md) for complete guide.

---

### Issue: Tool execution hangs VS Code

**Symptoms**:
- VS Code becomes unresponsive
- Tool execution never completes
- Must force quit VS Code

**Causes**:
- Tool timeout too long
- Infinite loop in tool logic
- Deadlock waiting for stdin

**Solutions**:

1. **Reduce tool timeout in VS Code**:
   ```json
   {
     "mcp.toolTimeout": 10000  // 10 seconds
   }
   ```

2. **Kill hanging process**:
   ```bash
   # Find PID
   ps aux | grep "node build/index.js"

   # Kill
   kill -9 <PID>
   ```

3. **Enable debug logging**:
   ```json
   {
     "mcp.servers": {
       "cts": {
         "env": {
           "LOG_LEVEL": "debug"
         }
       }
     }
   }
   ```

---

## Docker Problems

### Issue: Docker build fails

**Symptoms**:
```
ERROR [build 5/6] RUN npm run build
```

**Causes**:
- Network issues during `npm install`
- Build dependencies missing
- TypeScript compilation errors

**Solutions**:

1. **Build with verbose output**:
   ```bash
   docker build --progress=plain -t cts-mcp-server:3.0.0 .
   ```

2. **Check Dockerfile**:
   ```dockerfile
   # Ensure dependencies installed in builder stage
   FROM node:20-alpine AS builder
   RUN npm install  # Should come before npm run build
   ```

3. **Build locally first**:
   ```bash
   # Test build outside Docker
   npm install
   npm run build
   # If this works, Docker should too
   ```

---

### Issue: Docker container exits immediately

**Symptoms**:
```bash
docker run cts-mcp-server:3.0.0
# Container starts and exits with code 0
```

**Causes**:
- Stdio transport requires input
- No keepalive mechanism
- Entry point incorrect

**Solutions**:

1. **Run in interactive mode**:
   ```bash
   docker run -i cts-mcp-server:3.0.0
   ```

2. **Test with echo pipe**:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
     docker run -i cts-mcp-server:3.0.0
   ```

3. **Check entry point**:
   ```dockerfile
   # Dockerfile should have:
   ENTRYPOINT ["node", "build/index.js"]
   # NOT:
   CMD ["node", "build/index.js"]  # This can be overridden
   ```

---

### Issue: Docker container can't access host filesystem

**Symptoms**:
- "Project path not found" errors
- Tools can't read Godot projects on host

**Causes**:
- Volume not mounted
- Path mapping incorrect
- Permission issues

**Solutions**:

1. **Mount volume**:
   ```bash
   docker run -i \
     -v /path/to/godot/projects:/projects:ro \
     cts-mcp-server:3.0.0
   ```

2. **Use correct paths in tool calls**:
   ```json
   {
     "projectPath": "/projects/my-game"  // Path inside container
   }
   ```

3. **Check permissions**:
   ```bash
   # Host
   chmod -R 755 /path/to/godot/projects

   # Container runs as UID 1001, ensure readable
   ```

---

## Debugging Techniques

### Enable Debug Logging

```bash
# Set environment variable
export LOG_LEVEL=debug
export LOG_FORMAT=json  # For structured logs

# Run server
node build/index.js
```

**Debug logs include**:
- Cache operations (hits/misses)
- Configuration reloads
- Tool execution traces
- Parser details

---

### Use Performance Metrics

```typescript
import { metrics } from './observability/index.js';

// Get summary
const summary = metrics.getSummary();
console.log(JSON.stringify(summary, null, 2));

// Get tool-specific metrics
const toolMetrics = metrics.getToolMetrics('CTS_Scan_Project');
console.log(`Average duration: ${toolMetrics.averageDuration}ms`);
console.log(`Cache hit rate: ${(toolMetrics.cacheHitRate * 100).toFixed(1)}%`);
```

---

### Trace Tool Execution

```typescript
// Add manual instrumentation
import { logger } from './observability/index.js';

async function myTool(args: any) {
  logger.debug('Tool started', { args });

  try {
    const result = await doWork(args);
    logger.debug('Tool completed', { result });
    return result;
  } catch (error) {
    logger.error('Tool failed', { error: error.message, stack: error.stack });
    throw error;
  }
}
```

---

### Run Tests for Specific Component

```bash
# Test cache
npm test -- --testPathPattern="cache"

# Test configuration
npm test -- --testPathPattern="config"

# Test observability
npm test -- --testPathPattern="observability"

# Test specific tool
npm test -- --testPathPattern="export-to-shrimp"
```

---

### Profile Performance

```bash
# Run benchmarks
npm run benchmark

# Check results
cat benchmarks/results.json | jq '.results'

# Compare with targets
cat benchmarks/results.json | jq '.summary'
```

---

### Check MCP Protocol Messages

```bash
# Send request and capture full response
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node build/index.js 2>&1 | tee mcp_debug.log

# Pretty print JSON response
cat mcp_debug.log | jq .
```

---

### Inspect Cache State

```typescript
import { cache } from './cache/result-cache.js';

// Get statistics
console.log(cache.getStats());

// Check specific key
const key = cache.generateKey('CTS_Scan_Project', { projectPath: '/path' });
console.log(`Key exists: ${cache.has(key)}`);
console.log(`Value:`, cache.get(key));

// Clear cache for testing
cache.clear();
```

---

## Getting Help

### Before Filing an Issue

1. **Check this troubleshooting guide**
2. **Review [MCP_SERVER_GUIDE.md](./MCP_SERVER_GUIDE.md)**
3. **Run with debug logging enabled**
4. **Collect metrics and logs**

### What to Include in Bug Reports

- **Version**: `cat package.json | grep version`
- **Node.js version**: `node --version`
- **Operating system**: `uname -a` (Linux/Mac) or `ver` (Windows)
- **Configuration**: Relevant sections of `.cts-mcp.json`
- **Error logs**: Full error message with stack trace
- **Steps to reproduce**: Minimal example that triggers the issue
- **Expected vs actual behavior**

### Performance Issues

- **Run benchmarks**: `npm run benchmark`
- **Collect metrics**: `metrics.getSummary()`
- **Profile with Node.js**:
  ```bash
  node --prof build/index.js < request.json
  node --prof-process isolate-*.log > profile.txt
  ```

---

## Additional Resources

- [MCP Server Guide](./MCP_SERVER_GUIDE.md) - Complete usage guide
- [API Reference](./API_REFERENCE.md) - API documentation
- [CI/CD Pipeline](./CI_CD_PIPELINE.md) - Continuous integration
- [Packaging Guide](./PACKAGING.md) - NPM and Docker deployment
- [CHANGELOG](../CHANGELOG.md) - Version history
- [GitHub Issues](https://github.com/your-org/cts-mcp/issues) - Report bugs

---

**Still stuck?** Open an issue with detailed information and we'll help!
