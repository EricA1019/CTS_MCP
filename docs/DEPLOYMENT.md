# CTS MCP Server Deployment Guide

**Version:** 3.1.0  
**Last Updated:** November 4, 2025

Production deployment guide for the CTS (Close-to-Shore) Model Context Protocol server. This guide covers installation, configuration, production deployment strategies, and troubleshooting.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Development Deployment](#development-deployment)
5. [Production Deployment](#production-deployment)
6. [MCP Client Integration](#mcp-client-integration)
7. [Troubleshooting](#troubleshooting)
8. [Performance Tuning](#performance-tuning)
9. [Security Considerations](#security-considerations)

---

## Prerequisites

### System Requirements

- **Operating System:** Linux, macOS, or Windows (WSL recommended)
- **Node.js:** >=18.0.0 (LTS recommended)
- **npm:** >=9.0.0 or **yarn:** >=1.22.0
- **Godot:** 4.0+ (for signal scanning features)
- **Disk Space:** ~500MB for dependencies and build artifacts
- **RAM:** 2GB minimum, 4GB recommended

### Verify Prerequisites

```bash
# Check Node.js version
node --version
# Expected: v18.0.0 or higher

# Check npm version
npm --version
# Expected: 9.0.0 or higher

# Check Godot version (if using signal scanning)
godot4 --version
# Expected: 4.0.0 or higher
```

### Optional Tools

- **Puppeteer/Playwright:** For artifact export (PNG/SVG/PDF)
- **Docker:** For containerized deployment
- **systemd:** For Linux service management
- **PM2:** For Node.js process management

---

## Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/cts_mcp.git
cd cts_mcp
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- **TypeScript** (build toolchain)
- **D3.js** (visualization library)
- **Zod** (schema validation)
- **@modelcontextprotocol/sdk** (MCP server framework)
- **Jest** (testing framework)
- **Tree-sitter** (GDScript parser)

**Expected Output:**

```
added 245 packages, and audited 246 packages in 12s

found 0 vulnerabilities
```

### Step 3: Build Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `build/` directory.

**Expected Output:**

```
> cts-mcp@3.1.0 build
> tsc && tsc-alias

✓ Build completed successfully
```

### Step 4: Verify Installation

```bash
npm test
```

This runs the full test suite (96+ tests).

**Expected Output:**

```
Test Suites: 25 passed, 25 total
Tests:       96 passed, 96 total
Snapshots:   0 total
Time:        15.234 s
```

### Step 5: Test MCP Server

```bash
npm start
```

The server should start and listen for MCP requests on **stdio**.

**Expected Output:**

```
CTS MCP Server v3.1.0 starting...
✓ ArtifactEngine initialized (2 renderers registered)
✓ ToolRouter configured (2 tools registered)
✓ Server ready on stdio transport
```

Press `Ctrl+C` to stop the server.

---

## Configuration

### Environment Variables

Configure the CTS MCP server using environment variables.

#### Core Settings

```bash
# Enable production-ready D3 renderers (recommended)
export CTS_EXPERIMENTAL_MCP_UI=true

# Enable debug logging
export DEBUG=true

# Set Node environment (development/production)
export NODE_ENV=production

# Custom cache directory (optional)
export CTS_CACHE_DIR=/var/cache/cts_mcp
```

#### Configuration File

Create `.env` file in project root:

```env
# CTS MCP Server Configuration

# Feature Flags
CTS_EXPERIMENTAL_MCP_UI=true

# Logging
DEBUG=false
LOG_LEVEL=info

# Performance
CACHE_ENABLED=true
CACHE_TTL=3600

# Paths
GODOT_EXECUTABLE=godot4
CTS_CACHE_DIR=/var/cache/cts_mcp
```

Load with `dotenv`:

```bash
npm install dotenv
```

```typescript
// src/index.ts
import 'dotenv/config';
```

---

## Development Deployment

### Local Development Server

```bash
# Start server with hot reload (using nodemon)
npm install -D nodemon
npx nodemon --exec "npm run build && npm start" --watch src
```

### VS Code Integration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CTS MCP Server",
      "program": "${workspaceFolder}/build/index.js",
      "preLaunchTask": "npm: build",
      "env": {
        "CTS_EXPERIMENTAL_MCP_UI": "true",
        "DEBUG": "true"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

Press `F5` to start debugging.

### Testing Workflow

```bash
# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/__tests__/performance/render_time.test.ts

# Run tests with coverage
npm test -- --coverage

# Benchmark performance
npm run benchmark
```

---

## Production Deployment

### Build for Production

```bash
# Clean previous builds
rm -rf build/

# Install production dependencies only
npm ci --production

# Build with optimizations
NODE_ENV=production npm run build
```

### Option 1: Systemd Service (Linux)

**Step 1: Create Service File**

```bash
sudo nano /etc/systemd/system/cts-mcp.service
```

**Service Configuration:**

```ini
[Unit]
Description=CTS MCP Server
After=network.target

[Service]
Type=simple
User=cts-mcp
WorkingDirectory=/opt/cts_mcp
ExecStart=/usr/bin/node /opt/cts_mcp/build/index.js
Restart=on-failure
RestartSec=10s
Environment="CTS_EXPERIMENTAL_MCP_UI=true"
Environment="NODE_ENV=production"
Environment="CTS_CACHE_DIR=/var/cache/cts_mcp"
StandardOutput=journal
StandardError=journal
SyslogIdentifier=cts-mcp

[Install]
WantedBy=multi-user.target
```

**Step 2: Deploy Server**

```bash
# Create user for service
sudo useradd -r -s /bin/false cts-mcp

# Copy server files
sudo mkdir -p /opt/cts_mcp
sudo cp -r build/ package.json node_modules/ /opt/cts_mcp/
sudo chown -R cts-mcp:cts-mcp /opt/cts_mcp

# Create cache directory
sudo mkdir -p /var/cache/cts_mcp
sudo chown cts-mcp:cts-mcp /var/cache/cts_mcp

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable cts-mcp
sudo systemctl start cts-mcp
```

**Step 3: Verify Service**

```bash
# Check status
sudo systemctl status cts-mcp

# View logs
sudo journalctl -u cts-mcp -f

# Test MCP connection
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  socat - UNIX-CONNECT:/run/cts-mcp.sock
```

### Option 2: PM2 Process Manager

**Step 1: Install PM2**

```bash
npm install -g pm2
```

**Step 2: Create PM2 Ecosystem File**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cts-mcp',
    script: 'build/index.js',
    cwd: '/opt/cts_mcp',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      CTS_EXPERIMENTAL_MCP_UI: 'true',
      CTS_CACHE_DIR: '/var/cache/cts_mcp'
    },
    error_file: '/var/log/cts-mcp/error.log',
    out_file: '/var/log/cts-mcp/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false
  }]
};
```

**Step 3: Start with PM2**

```bash
# Start server
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd

# Check status
pm2 status

# View logs
pm2 logs cts-mcp
```

### Option 3: Docker Deployment

**Step 1: Create Dockerfile**

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install Godot (for signal scanning)
RUN apk add --no-cache godot

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --production

# Copy application
COPY build/ ./build/
COPY docs/ ./docs/

# Set environment
ENV NODE_ENV=production
ENV CTS_EXPERIMENTAL_MCP_UI=true
ENV CTS_CACHE_DIR=/var/cache/cts_mcp

# Create cache directory
RUN mkdir -p /var/cache/cts_mcp

# Expose port (if using HTTP transport)
# EXPOSE 3000

# Start server
CMD ["node", "build/index.js"]
```

**Step 2: Build Image**

```bash
docker build -t cts-mcp:3.1.0 .
```

**Step 3: Run Container**

```bash
# Run with stdio transport (for Claude Desktop, VS Code)
docker run -it --rm \
  --name cts-mcp \
  -v /path/to/godot/projects:/projects:ro \
  -v cts-mcp-cache:/var/cache/cts_mcp \
  cts-mcp:3.1.0

# Run with HTTP transport (optional)
docker run -d --rm \
  --name cts-mcp \
  -p 3000:3000 \
  -v /path/to/godot/projects:/projects:ro \
  -v cts-mcp-cache:/var/cache/cts_mcp \
  -e TRANSPORT=http \
  cts-mcp:3.1.0
```

**Step 4: Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  cts-mcp:
    build: .
    container_name: cts-mcp
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - CTS_EXPERIMENTAL_MCP_UI=true
    volumes:
      - /path/to/godot/projects:/projects:ro
      - cts-mcp-cache:/var/cache/cts_mcp
    # ports:
    #   - "3000:3000"

volumes:
  cts-mcp-cache:
```

```bash
docker-compose up -d
```

---

## MCP Client Integration

### Claude Desktop

**Step 1: Locate Configuration File**

```bash
# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json

# Windows
%APPDATA%\Claude\claude_desktop_config.json
```

**Step 2: Add CTS MCP Server**

```json
{
  "mcpServers": {
    "cts": {
      "command": "node",
      "args": ["/opt/cts_mcp/build/index.js"],
      "env": {
        "CTS_EXPERIMENTAL_MCP_UI": "true",
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Step 3: Restart Claude Desktop**

**Step 4: Verify Connection**

In Claude Desktop chat:

```
Use the CTS_Scan_Project_Signals tool to scan /path/to/godot/project
```

Claude should respond with signal scan results.

### VS Code Extension

**Step 1: Create Extension Configuration**

```typescript
// extension.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function activateCTSMCP(context: vscode.ExtensionContext) {
  const client = new Client({
    name: 'cts-vscode-extension',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['/opt/cts_mcp/build/index.js'],
    env: {
      CTS_EXPERIMENTAL_MCP_UI: 'true'
    }
  });

  await client.connect(transport);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('cts.scanSignals', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) return;

      const result = await client.callTool({
        name: 'CTS_Scan_Project_Signals',
        arguments: {
          projectPath: workspaceFolder.uri.fsPath,
          renderMap: true
        }
      });

      // Display in webview
      const panel = vscode.window.createWebviewPanel(
        'ctsSignalMap',
        'Signal Map',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = result.result.html!;
    })
  );
}
```

**Step 2: Update package.json**

```json
{
  "contributes": {
    "commands": [
      {
        "command": "cts.scanSignals",
        "title": "CTS: Scan Project Signals"
      }
    ]
  }
}
```

**Step 3: Install and Test**

```bash
# Build extension
npm run compile

# Press F5 to launch Extension Development Host
# Run command: "CTS: Scan Project Signals"
```

---

## Troubleshooting

### Common Issues

#### 1. "Module not found" Errors

**Symptom:**

```
Error: Cannot find module 'zod'
```

**Solution:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild project
npm run build
```

#### 2. MCP Server Not Starting

**Symptom:**

```
CTS MCP Server failed to start
```

**Solution:**

```bash
# Check Node.js version
node --version  # Must be >=18.0.0

# Enable debug mode
export DEBUG=true
npm start

# Check logs
journalctl -u cts-mcp -n 50
```

#### 3. Signal Scanning Fails

**Symptom:**

```
Error: Godot executable not found
```

**Solution:**

```bash
# Verify Godot installation
which godot4

# Set custom Godot path
export GODOT_EXECUTABLE=/path/to/godot4

# Or update .env file
echo "GODOT_EXECUTABLE=/path/to/godot4" >> .env
```

#### 4. Artifacts Not Rendering

**Symptom:**

```
Rendered artifact is blank or shows placeholder text
```

**Solution:**

```bash
# Enable MCP-UI renderers
export CTS_EXPERIMENTAL_MCP_UI=true

# Rebuild with experimental features
npm run build
npm start
```

#### 5. Performance Issues (Slow Rendering)

**Symptom:**

Rendering takes >10 seconds for medium-sized projects.

**Solution:**

```bash
# Enable lazy loading (automatic for >100 nodes)
# Check performance benchmarks
npm run benchmark

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm start
```

#### 6. Cache Not Working

**Symptom:**

```
All requests are cache misses
```

**Solution:**

```bash
# Enable cache
export CACHE_ENABLED=true

# Create cache directory
mkdir -p /var/cache/cts_mcp
chmod 755 /var/cache/cts_mcp

# Verify cache configuration
echo $CTS_CACHE_DIR
```

### Debug Mode

Enable verbose logging:

```bash
export DEBUG=true
export LOG_LEVEL=debug
npm start
```

**Debug Output:**

```
[DEBUG] ArtifactEngine: Registering renderer 'signal_map_mcp_ui'
[DEBUG] ToolRouter: Routing tool 'CTS_Scan_Project_Signals'
[DEBUG] GDScriptParser: Scanning directory '/path/to/project'
[DEBUG] D3GraphRenderer: Rendering 45 nodes, 28 edges
[DEBUG] Cache: HIT for key 'scan_signals:/path/to/project'
```

### Log Files

**Systemd Service:**

```bash
sudo journalctl -u cts-mcp -f
```

**PM2:**

```bash
pm2 logs cts-mcp
```

**Docker:**

```bash
docker logs -f cts-mcp
```

---

## Performance Tuning

### Optimize Build

```bash
# Enable production optimizations
NODE_ENV=production npm run build

# Minify JavaScript (optional)
npm install -D terser
npx terser build/index.js -o build/index.min.js
```

### Cache Configuration

```bash
# Increase cache TTL (default: 3600s)
export CACHE_TTL=7200

# Use Redis for distributed caching (optional)
npm install ioredis
```

```typescript
// src/cache/redis_cache.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  db: 0
});

export async function getCached(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function setCached(key: string, value: string, ttl: number): Promise<void> {
  await redis.set(key, value, 'EX', ttl);
}
```

### Node.js Tuning

```bash
# Increase memory limit for large projects
export NODE_OPTIONS="--max-old-space-size=8192"

# Enable V8 optimizations
export NODE_OPTIONS="--max-old-space-size=8192 --optimize-for-size"

# Use worker threads for parallel processing (future feature)
```

### D3 Rendering Optimizations

```typescript
// src/artifacts/visualizations/D3GraphRenderer.ts

// Increase lazy loading threshold (default: 100)
private readonly LAZY_THRESHOLD = 200;

// Reduce initial batch size (default: 50)
private readonly INITIAL_BATCH = 30;

// Reduce simulation ticks (default: 300)
simulation.tick(150);
```

---

## Security Considerations

### File Access Restrictions

```bash
# Limit scan paths to specific directories
export CTS_ALLOWED_PATHS="/path/to/projects:/home/user/godot"
```

```typescript
// src/tools/scan_project_signals.ts
function validateProjectPath(path: string): void {
  const allowedPaths = process.env.CTS_ALLOWED_PATHS?.split(':') || [];
  
  if (allowedPaths.length > 0 && !allowedPaths.some(allowed => path.startsWith(allowed))) {
    throw new Error(`Access denied: ${path} not in allowed paths`);
  }
}
```

### Input Validation

All tool inputs are validated with Zod schemas:

```typescript
// src/tools/render_artifact.ts
const RenderArtifactParamsSchema = z.object({
  artifactType: z.enum(['signal_map', 'hop_dashboard']),
  data: z.unknown(),
  metadata: z.object({
    title: z.string().max(200),  // Limit title length
    description: z.string().max(1000)  // Limit description length
  }).optional(),
});
```

### Dependency Security

```bash
# Audit dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

### Rate Limiting (Optional)

```typescript
// src/middleware/rate_limiter.ts
import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.'
});
```

---

## Health Checks

### Systemd Healthcheck

```ini
# /etc/systemd/system/cts-mcp.service
[Service]
ExecStartPre=/usr/bin/node -e "console.log('Pre-flight check')"
ExecStartPost=/bin/sleep 2
ExecReload=/bin/kill -HUP $MAINPID
```

### PM2 Healthcheck

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cts-mcp',
    script: 'build/index.js',
    max_memory_restart: '500M',
    exp_backoff_restart_delay: 100,
    kill_timeout: 3000
  }]
};
```

### Docker Healthcheck

```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "console.log('Health OK')" || exit 1
```

---

## Backup and Recovery

### Backup Cache

```bash
# Backup cache directory
tar -czf cts-mcp-cache-$(date +%Y%m%d).tar.gz /var/cache/cts_mcp

# Restore cache
tar -xzf cts-mcp-cache-20251104.tar.gz -C /
```

### Configuration Backup

```bash
# Backup systemd service
sudo cp /etc/systemd/system/cts-mcp.service /backup/

# Backup environment variables
env | grep CTS_ > /backup/cts-env.txt
```

---

## Monitoring

### Prometheus Metrics (Optional)

```typescript
// src/metrics/prometheus.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

export const requestCounter = new promClient.Counter({
  name: 'cts_mcp_requests_total',
  help: 'Total number of MCP requests',
  labelNames: ['tool', 'status']
});

export const renderDuration = new promClient.Histogram({
  name: 'cts_mcp_render_duration_seconds',
  help: 'Artifact render duration',
  labelNames: ['artifactType']
});

register.registerMetric(requestCounter);
register.registerMetric(renderDuration);
```

### Logging with Winston

```bash
npm install winston
```

```typescript
// src/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: '/var/log/cts-mcp/error.log', level: 'error' }),
    new winston.transports.File({ filename: '/var/log/cts-mcp/combined.log' })
  ]
});
```

---

## Upgrade Guide

### Upgrading from v3.0.0 to v3.1.0

```bash
# 1. Backup current installation
cp -r /opt/cts_mcp /opt/cts_mcp.backup

# 2. Pull latest code
cd /opt/cts_mcp
git pull origin main

# 3. Install new dependencies
npm install

# 4. Rebuild
npm run build

# 5. Run tests
npm test

# 6. Restart service
sudo systemctl restart cts-mcp

# 7. Verify
sudo systemctl status cts-mcp
```

**Breaking Changes in v3.1.0:**

- None! Fully backward compatible with v3.0.0

**New Features:**

- ✅ D3HopDashboardRenderer (Gantt-style task visualization)
- ✅ Lazy loading for large signal graphs (>100 nodes)
- ✅ Progressive rendering for hop dashboards
- ✅ Performance optimizations (<2s render, <500KB bundle)

---

## FAQ

### Q: Can I run multiple CTS MCP servers?

**A:** Yes! Each server instance should have its own cache directory:

```bash
# Instance 1
export CTS_CACHE_DIR=/var/cache/cts_mcp_1
npm start

# Instance 2
export CTS_CACHE_DIR=/var/cache/cts_mcp_2
npm start
```

### Q: How do I update Godot version?

**A:** Update the `GODOT_EXECUTABLE` environment variable:

```bash
export GODOT_EXECUTABLE=/path/to/godot4.2
```

### Q: Can I disable caching?

**A:** Yes:

```bash
export CACHE_ENABLED=false
npm start
```

### Q: How do I export artifacts programmatically?

**A:** See [API.md - Export Artifacts](./API.md#export-artifacts) for examples using Puppeteer.

---

## Support

For deployment assistance:

- **GitHub Issues:** https://github.com/your-org/cts_mcp/issues
- **Documentation:** [API.md](./API.md)
- **Community Discord:** https://discord.gg/your-server

---

**Last Updated:** November 4, 2025  
**Maintainers:** CTS Development Team
