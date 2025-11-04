# VS Code MCP Setup Guide

Complete guide to integrating CTS MCP Server with VS Code.

## Quick Diagnosis

**If you're seeing errors for all tools in VS Code:**

1. **Test the server directly first:**
   ```bash
   cd /path/to/cts_mcp
   node build/test_client.js
   ```
   If this works, the problem is VS Code configuration.

2. **Check VS Code settings:**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Search: "Preferences: Open User Settings (JSON)"
   - Verify MCP server is registered correctly

3. **Check logs:**
   - Output Panel (`Ctrl+Shift+U`)
   - Select "GitHub Copilot" from dropdown
   - Look for MCP connection errors

## Installation Steps

### 1. Install GitHub Copilot Chat Extension

The MCP protocol is integrated through GitHub Copilot Chat:

```
ext install GitHub.copilot-chat
```

**Requirements:**
- VS Code 1.85.0 or later
- Active GitHub Copilot subscription
- Node.js 18+ installed and in PATH

### 2. Register CTS MCP Server

Add to your VS Code `settings.json`:

**Location:** `.vscode/settings.json` (project) or `~/.config/Code/User/settings.json` (global)

#### Production Configuration (Recommended)

```json
{
  "github.copilot.chat.mcp.servers": {
    "cts": {
      "command": "node",
      "args": [
        "/absolute/path/to/ProtoBd/cts_mcp/build/index.js"
      ],
      "env": {
        "LOG_LEVEL": "INFO"
      }
    }
  }
}
```

#### Development Configuration (Auto-reload on code changes)

```json
{
  "github.copilot.chat.mcp.servers": {
    "cts": {
      "command": "npm",
      "args": [
        "run",
        "dev:watch"
      ],
      "cwd": "/absolute/path/to/ProtoBd/cts_mcp",
      "env": {
        "LOG_LEVEL": "DEBUG",
        "NODE_ENV": "development",
        "DEBUG": "cts:*"
      }
    }
  }
}
```

#### Debug Configuration (Verbose logging)

```json
{
  "github.copilot.chat.mcp.servers": {
    "cts": {
      "command": "node",
      "args": [
        "/absolute/path/to/ProtoBd/cts_mcp/build/index.js"
      ],
      "env": {
        "LOG_LEVEL": "DEBUG",
        "NODE_ENV": "development",
        "DEBUG": "cts:*,mcp:*"
      }
    }
  }
}
```

#### Configuration Options

**Environment Variables:**

| Variable | Values | Default | Purpose |
|----------|--------|---------|---------|
| `LOG_LEVEL` | `ERROR`, `WARN`, `INFO`, `DEBUG` | `INFO` | Controls log verbosity |
| `NODE_ENV` | `production`, `development` | `production` | Enables dev features |
| `DEBUG` | `cts:*`, `mcp:*`, `*` | - | Debug namespace filter |
| `CTS_CACHE_DIR` | Path | `/tmp/cts-cache` | Cache directory for artifacts |
| `CTS_MAX_FILE_SIZE` | Bytes | `5242880` (5MB) | Max file size to parse |

**⚠️ Critical:** Use **absolute paths** - relative paths will fail!

### 2a. Auto-Reload Development Setup

For active development, install nodemon:

```bash
cd /home/eric/Godot/ProtoBd/cts_mcp
npm install --save-dev nodemon
```

Then use the **Development Configuration** above. The server will automatically restart when you edit TypeScript files.

**Benefits:**
- 🔄 Auto-restart on file changes
- 🐛 Verbose debug logging
- ⚡ Faster iteration cycle
- 📊 Performance monitoring

### 3. Verify Configuration

**Check server path exists:**
```bash
ls -la /home/eric/Godot/ProtoBd/cts_mcp/build/index.js
# Should show the file
```

**Check Node.js is in PATH:**
```bash
which node
# Should show /usr/bin/node or similar
```

**Test server manually:**
```bash
cd /home/eric/Godot/ProtoBd/cts_mcp
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | node build/index.js
# Should return JSON response
```

### 4. Restart VS Code

**Complete restart required:**
1. Save settings.json
2. Close ALL VS Code windows
3. Reopen VS Code
4. Wait 10 seconds for MCP initialization

## Common Errors & Solutions

### Error 1: "MCP server 'cts' failed to start"

**Symptoms:**
- No response from tools
- Connection timeout

**Causes:**
1. ❌ Node not in PATH
2. ❌ Incorrect file path
3. ❌ Missing dependencies (npm install not run)

**Solutions:**
```bash
# 1. Verify Node path
which node
# Add to settings.json if different:
{
  "github.copilot.chat.mcp.servers": {
    "cts": {
      "command": "/usr/bin/node",  // Use absolute path to node
      "args": ["/home/eric/Godot/ProtoBd/cts_mcp/build/index.js"]
    }
  }
}

# 2. Rebuild project
cd /home/eric/Godot/ProtoBd/cts_mcp
npm install
npm run build

# 3. Test standalone
node build/test_client.js
```

### Error 2: "Parse error" or "Invalid JSON-RPC response"

**Symptoms:**
- Tools listed but all fail when called
- Error: "Unexpected token" or "JSON parse error"

**Cause:**
Server is outputting debug logs to stdout (should use stderr)

**Solution:**
Already fixed in current version. Ensure you have latest build:
```bash
cd /home/eric/Godot/ProtoBd/cts_mcp
git pull
npm run build
```

### Error 3: "Method not found: tools/call"

**Symptoms:**
- Server starts but tools don't execute
- Missing method errors

**Cause:**
MCP protocol version mismatch

**Solution:**
Update to MCP SDK 2024-11-05:
```bash
cd /home/eric/Godot/ProtoBd/cts_mcp
npm install @modelcontextprotocol/sdk@latest
npm run build
```

### Error 4: "Working directory not found"

**Symptoms:**
- Tools fail with path errors
- ENOENT errors in logs

**Cause:**
Relative paths in configuration

**Solution:**
Use absolute paths everywhere:
```json
{
  "github.copilot.chat.mcp.servers": {
    "cts": {
      "command": "/usr/bin/node",
      "args": [
        "/home/eric/Godot/ProtoBd/cts_mcp/build/index.js"
      ],
      "cwd": "/home/eric/Godot/ProtoBd/cts_mcp"
    }
  }
}
```

### Error 5: "Permission denied"

**Symptoms:**
- EACCES errors
- Cannot read/write files

**Cause:**
File permissions or audit scanning restricted directories

**Solution:**
```bash
# 1. Fix file permissions
chmod +x /home/eric/Godot/ProtoBd/cts_mcp/build/index.js

# 2. Avoid scanning protected directories
# Use audit with specific paths, not /tmp or system directories
```

## Usage in VS Code

### Via GitHub Copilot Chat

1. Open Copilot Chat panel (`Ctrl+Shift+I`)
2. Type `@cts` to invoke CTS tools
3. Available commands:
   ```
   @cts audit this project
   @cts find bugs in current file
   @cts clean up dead code
   @cts analyze signals
   ```

### Via Command Palette

1. Press `Ctrl+Shift+P`
2. Search: "GitHub Copilot: Use MCP Tool"
3. Select tool from list
4. Enter parameters

## Troubleshooting Flowchart

```
VS Code MCP not working?
│
├─ Server starts? (check Output panel)
│  ├─ NO → Check Node path, file permissions
│  └─ YES → Continue
│
├─ Tools listed? (Copilot chat shows @cts)
│  ├─ NO → Restart VS Code, check settings.json
│  └─ YES → Continue
│
├─ Tools execute? (run @cts audit)
│  ├─ NO → Check response format, logs
│  └─ YES → Working! 🎉
```

## Diagnostic Commands

### Test MCP Protocol Manually

```bash
# 1. List available tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node /home/eric/Godot/ProtoBd/cts_mcp/build/index.js | \
  jq '.result.tools[].name'

# 2. Call audit tool
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cts_audit","arguments":{"projectPath":"/home/eric/Godot/ProtoBd"}}}' | \
  node /home/eric/Godot/ProtoBd/cts_mcp/build/index.js

# 3. Test with client
node /home/eric/Godot/ProtoBd/cts_mcp/build/test_client.js
```

### Check VS Code Logs

1. **Output Panel:** `View > Output` → Select "GitHub Copilot"
2. **Developer Tools:** `Help > Toggle Developer Tools` → Console tab
3. **MCP Logs:** Look for `[CTS MCP]` prefixed messages

### Enable Debug Logging

Add to settings.json:
```json
{
  "github.copilot.chat.mcp.servers": {
    "cts": {
      "command": "node",
      "args": ["/home/eric/Godot/ProtoBd/cts_mcp/build/index.js"],
      "env": {
        "LOG_LEVEL": "DEBUG",
        "NODE_ENV": "development"
      }
    }
  }
}
```

## Performance Tips

### Faster Startup

Cache dependencies:
```json
{
  "github.copilot.chat.mcp.servers": {
    "cts": {
      "command": "node",
      "args": ["--max-old-space-size=512", "/path/to/index.js"],
      "timeout": 30000
    }
  }
}
```

### Reduce Audit Time

Use category filtering:
```
@cts audit only CTS rules
```

Translates to:
```json
{
  "categories": ["cts"]
}
```

## VS Code Extension Requirements

**Minimum versions:**
- VS Code: 1.85.0
- Copilot Chat: 0.11.0
- Node.js: 18.0.0

**Check versions:**
```bash
code --version
node --version
```

## Next Steps

1. ✅ **Verify server works** - Run test_client.js
2. ✅ **Configure settings.json** - Use absolute paths
3. ✅ **Restart VS Code** - Complete restart required
4. ✅ **Test in Copilot Chat** - Try `@cts audit`
5. ✅ **Check logs** - Output panel for errors

## Support

**Server works via test client but not VS Code?**
- This is a known integration issue
- Tier 2C.1 task will add comprehensive diagnostics
- Workaround: Use MCP tools via CLI until fixed

**Still having issues?**
1. Create minimal reproduction case
2. Check GitHub Copilot extension version
3. Try with a simple test project first
4. Review this guide's "Common Errors" section
