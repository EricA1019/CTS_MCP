# CTS MCP Server - Production Deployment Guide

**Version:** 3.0.0  
**Last Updated:** November 4, 2025  
**Audience:** DevOps Engineers, Platform Teams, CI/CD Administrators

---

## Table of Contents

1. [Deployment Checklist](#deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Performance Tuning](#performance-tuning)
4. [Monitoring & Observability](#monitoring--observability)
5. [Troubleshooting](#troubleshooting)
6. [Scaling Guidelines](#scaling-guidelines)
7. [Security Considerations](#security-considerations)
8. [Backup & Recovery](#backup--recovery)

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Review System Requirements**
  - Node.js 20+ installed
  - 4GB+ RAM available for parallel execution
  - 10GB+ disk space for cache (adjustable via `CTS_CACHE_DIR`)

- [ ] **Configuration Validation**
  - Run `npm run validate-config` to check environment variables
  - Ensure `.ctsrc.json` exists in project root (or use defaults)
  - Test config loading: `node -e "console.log(require('./build/config.js').loadConfig())"`

- [ ] **Build & Test**
  - Clean build: `npm run clean && npm run build`
  - Run tests: `npm test` (requires 30+ tests passing)
  - Verify MCP schema: `node scripts/validate-schemas.js`

- [ ] **Cache Preparation**
  - Create cache directory: `mkdir -p /var/cache/cts-mcp` (or custom path)
  - Set permissions: `chmod 755 /var/cache/cts-mcp`
  - Set ownership: `chown <service-user>:<service-group> /var/cache/cts-mcp`

### Deployment Steps

1. **Install Dependencies**
   ```bash
   npm ci --production  # Production dependencies only
   ```

2. **Build TypeScript**
   ```bash
   npm run build
   ```

3. **Set Environment Variables**
   ```bash
   export NODE_ENV=production
   export LOG_LEVEL=INFO
   export CTS_CACHE_DIR=/var/cache/cts-mcp
   export CTS_ENABLE_CACHE=true
   export CTS_ENABLE_PARALLEL=true
   export CTS_WORKER_COUNT=4
   ```

4. **Run Health Check**
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"ping"}' | node build/index.js
   # Expected: {"jsonrpc":"2.0","id":1,"result":"pong"}
   ```

5. **Start Server**
   ```bash
   # Via MCP client (Claude Desktop, VS Code, etc.)
   # Server starts automatically via stdio transport
   ```

### Post-Deployment

- [ ] **Verify Functionality**
  - Run test audit: `cts_audit` with sample project
  - Check cache creation: `ls -la /var/cache/cts-mcp/.cts_cache/`
  - Validate logs: `tail -f /var/log/cts-mcp.log` (if logging to file)

- [ ] **Performance Baseline**
  - Run benchmark: `npm run benchmark`
  - Record baseline metrics (audit duration, cache hit rate, memory usage)
  - Set up monitoring dashboards

- [ ] **Security Review**
  - Verify file permissions on cache directory
  - Check no sensitive data in logs
  - Validate input sanitization for project paths

---

## Environment Configuration

### Required Variables

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `NODE_ENV` | `production` | Environment mode (production/development) | `production` |
| `LOG_LEVEL` | `INFO` | Logging verbosity (ERROR/WARN/INFO/DEBUG) | `INFO` |

### Optional Variables

| Variable | Default | Description | Recommendation |
|----------|---------|-------------|----------------|
| `CTS_CACHE_DIR` | `/tmp/cts-cache` | Cache directory path | Use persistent storage: `/var/cache/cts-mcp` |
| `CTS_ENABLE_CACHE` | `true` | Enable file hash caching | Keep enabled for 60%+ speedup |
| `CTS_CACHE_TTL` | `300000` (5min) | Cache TTL in milliseconds | Increase to `3600000` (1h) for stable projects |
| `CTS_ENABLE_PARALLEL` | `false` | Enable parallel rule execution | Enable for projects with 10+ rules |
| `CTS_WORKER_COUNT` | `4` | Max concurrent workers | Set to CPU cores - 1 (e.g., `7` for 8-core) |
| `CTS_MAX_FILE_SIZE` | `5242880` (5MB) | Max file size in bytes | Increase to `10485760` (10MB) for large files |
| `CTS_MAX_FILES` | `10000` | Max files to analyze | Increase for monorepos (e.g., `50000`) |
| `CTS_PROFILE` | `false` | Enable performance profiling | Enable for debugging performance issues |
| `DEBUG` | ` ` | Debug namespaces (e.g., `cts:*`) | Use sparingly in production |

### Configuration File (`.ctsrc.json`)

Place in project root to override defaults:

```json
{
  "categories": ["cts", "code_quality"],
  "minScore": 80,
  "fileSize": {
    "maxLines": 500
  },
  "hopSize": {
    "maxLines": 150
  },
  "excludePatterns": [
    "**/addons/**",
    "**/.godot/**",
    "**/test/**"
  ]
}
```

### Configuration Priority

1. **Command-line arguments** (highest priority)
2. **Environment variables**
3. **`.ctsrc.json` in project root**
4. **Built-in defaults** (lowest priority)

---

## Performance Tuning

### Cache Optimization

**Goal:** Achieve 90%+ cache hit rate for incremental analysis

1. **Cache Location**
   ```bash
   # Use fast storage (SSD preferred)
   export CTS_CACHE_DIR=/mnt/fast-storage/cts-cache
   ```

2. **Cache TTL Tuning**
   ```bash
   # Longer TTL for stable projects (reduces re-analysis)
   export CTS_CACHE_TTL=3600000  # 1 hour
   
   # Shorter TTL for rapid development (ensures fresh results)
   export CTS_CACHE_TTL=300000   # 5 minutes
   ```

3. **Cache Persistence**
   - Cache saved to `<CTS_CACHE_DIR>/.cts_cache/file_results.json`
   - Survives server restarts
   - Invalidates automatically on file content changes

### Parallel Execution Tuning

**Goal:** 3x+ speedup for projects with 10+ rules

1. **Worker Count**
   ```bash
   # Rule of thumb: CPU cores - 1
   export CTS_WORKER_COUNT=$(( $(nproc) - 1 ))
   
   # Max recommended: 16 workers
   export CTS_WORKER_COUNT=8
   ```

2. **When to Enable**
   - **Enable:** Projects with 10+ compliance rules
   - **Disable:** Small projects (< 5 rules) - overhead not worth it

3. **Memory Considerations**
   - Each worker uses ~200MB RAM
   - 4 workers = ~800MB baseline + project files
   - Ensure 4GB+ RAM for safe operation

### File Sampling

**Goal:** Reduce analysis time for large projects (100+ files)

```json
{
  "sampling": {
    "enabled": true,
    "strategy": "stratified",
    "maxFiles": 100,
    "seed": 42
  }
}
```

- **Small projects (< 100 files):** Disable sampling (analyze all files)
- **Medium projects (100-500 files):** `maxFiles: 100` (20-80% sampling)
- **Large projects (500+ files):** `maxFiles: 200` (10-40% sampling)

### Performance Benchmarks

| Project Size | Files | Rules | Baseline (No Cache/No Parallel) | With Cache | With Parallel | Combined |
|--------------|-------|-------|--------------------------------|-----------|---------------|----------|
| Small | 10 | 5 | 2s | 1s (2x) | 2s (1x) | 1s (2x) |
| Medium | 100 | 10 | 15s | 4s (3.75x) | 5s (3x) | 2s (7.5x) |
| Large | 500 | 15 | 45s | 8s (5.6x) | 12s (3.75x) | 4s (11.25x) |
| Extra Large | 1000+ | 20 | 120s | 15s (8x) | 30s (4x) | 8s (15x) |

---

## Monitoring & Observability

### Metrics to Track

1. **Audit Performance**
   - Audit duration (target: < 5s for medium projects)
   - Cache hit rate (target: > 90%)
   - Files analyzed per second (target: > 20 files/s)

2. **Resource Usage**
   - Memory usage (peak and average)
   - CPU utilization (parallel execution)
   - Disk I/O (cache reads/writes)

3. **Error Rates**
   - Rule execution failures
   - Worker crashes (parallel mode)
   - Configuration validation errors

### Logging Configuration

**Production Logging:**
```bash
export LOG_LEVEL=INFO
export DEBUG=  # Disable debug logs
```

**Debug Logging:**
```bash
export LOG_LEVEL=DEBUG
export DEBUG=cts:*  # Enable all CTS debug logs
```

**Selective Debug Logging:**
```bash
# Cache operations only
export DEBUG=cts:cache

# Parallel execution only
export DEBUG=cts:parallel

# All audit operations
export DEBUG=cts:audit:*
```

### Log Aggregation

**Structured JSON Logging:**
```javascript
// logs written to stdout in JSON format
{
  "timestamp": "2025-11-04T12:34:56.789Z",
  "level": "INFO",
  "message": "CTS audit completed",
  "duration": 2345,
  "cacheHitRate": 0.92,
  "filesAnalyzed": 123
}
```

**Recommended Tools:**
- **ELK Stack**: Elasticsearch + Logstash + Kibana
- **Grafana Loki**: Lightweight log aggregation
- **Cloud Logging**: AWS CloudWatch, GCP Cloud Logging, Azure Monitor

### Health Checks

**Ping Endpoint:**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"ping"}' | node build/index.js
# Response: {"jsonrpc":"2.0","id":1,"result":"pong"}
```

**Audit Health Check:**
```bash
# Run audit on test project
echo '{"jsonrpc":"2.0","id":1,"method":"cts_audit","params":{"projectPath":"/test/project"}}' | node build/index.js
# Expected: JSON response with overallScore field
```

---

## Troubleshooting

### Common Issues

#### 1. Cache Not Persisting

**Symptoms:**
- Cache hit rate = 0% on every run
- `.cts_cache/` directory empty

**Diagnosis:**
```bash
# Check cache directory permissions
ls -ld $CTS_CACHE_DIR/.cts_cache/

# Verify write permissions
touch $CTS_CACHE_DIR/.cts_cache/test && rm $CTS_CACHE_DIR/.cts_cache/test
```

**Solutions:**
- Create cache directory: `mkdir -p $CTS_CACHE_DIR/.cts_cache`
- Fix permissions: `chmod 755 $CTS_CACHE_DIR/.cts_cache`
- Check disk space: `df -h $CTS_CACHE_DIR`

#### 2. Parallel Execution Crashes

**Symptoms:**
- `Worker thread exited with code 1`
- Incomplete audit results

**Diagnosis:**
```bash
# Check memory availability
free -h

# Monitor memory during execution
watch -n 1 'ps aux | grep node | grep -v grep'
```

**Solutions:**
- Reduce worker count: `export CTS_WORKER_COUNT=2`
- Disable parallel execution: `export CTS_ENABLE_PARALLEL=false`
- Increase system memory (4GB+ recommended)

#### 3. Slow Audit Performance

**Symptoms:**
- Audit takes > 30s for medium projects
- Low cache hit rate (< 50%)

**Diagnosis:**
```bash
# Enable profiling
export CTS_PROFILE=true

# Run audit and check logs for bottlenecks
node build/index.js < audit_request.json 2>&1 | grep -A 5 "Performance"
```

**Solutions:**
- Enable caching: `export CTS_ENABLE_CACHE=true`
- Enable parallel execution: `export CTS_ENABLE_PARALLEL=true`
- Use file sampling for large projects (see Performance Tuning)
- Check disk I/O: Move cache to faster storage (SSD)

#### 4. Configuration Validation Errors

**Symptoms:**
- `Configuration validation failed` error on startup

**Diagnosis:**
```bash
# Test config loading
node -e "const config = require('./build/config.js').loadConfig(); require('./build/config.js').validateConfig(config); console.log('Config valid');"
```

**Solutions:**
- Check environment variables: `env | grep CTS_`
- Validate `.ctsrc.json` syntax: `jq empty .ctsrc.json`
- Reset to defaults: `unset $(env | grep ^CTS_ | cut -d= -f1)`

#### 5. High Memory Usage

**Symptoms:**
- Process killed by OOM killer
- Memory usage > 8GB

**Diagnosis:**
```bash
# Monitor memory growth
while true; do ps aux | grep "node.*cts-mcp" | grep -v grep; sleep 5; done
```

**Solutions:**
- Reduce `CTS_WORKER_COUNT` to 2
- Reduce `CTS_MAX_FILES` to limit file count
- Enable sampling for large projects
- Check for memory leaks: Run with `--expose-gc` and monitor

---

## Scaling Guidelines

### Single Instance

**Suitable for:**
- Projects < 1000 files
- Teams < 10 developers
- CI/CD builds on single runner

**Configuration:**
```bash
export CTS_WORKER_COUNT=4
export CTS_ENABLE_CACHE=true
export CTS_CACHE_DIR=/var/cache/cts-mcp
```

### Horizontal Scaling

**Suitable for:**
- Monorepos with 1000+ files
- Large teams (10+ developers)
- High CI/CD build volume

**Architecture:**
```
[Load Balancer]
      |
      ├── [CTS Server Instance 1] (Cache: /shared/cache1)
      ├── [CTS Server Instance 2] (Cache: /shared/cache2)
      └── [CTS Server Instance 3] (Cache: /shared/cache3)
```

**Shared Cache Strategy:**
- Use distributed file system (NFS, GlusterFS, AWS EFS)
- Each instance writes to shared cache directory
- File hash ensures cache consistency across instances

---

## Security Considerations

### Input Validation

- **Project paths:** Validated against directory traversal attacks
- **File paths:** Restricted to project directory
- **Configuration:** Schema-validated JSON

### File System Access

- **Read-only:** Server only reads project files (never writes)
- **Cache writes:** Limited to `CTS_CACHE_DIR` only
- **Permissions:** Run with least-privilege user account

### Dependency Security

```bash
# Audit dependencies for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

---

## Backup & Recovery

### Cache Backup

**Backup Strategy:**
```bash
# Daily cache backup
tar -czf cts-cache-backup-$(date +%Y%m%d).tar.gz -C $CTS_CACHE_DIR .cts_cache/

# Retention: 7 days
find /backups/cts-cache -name "cts-cache-backup-*.tar.gz" -mtime +7 -delete
```

**Recovery:**
```bash
# Restore cache from backup
tar -xzf cts-cache-backup-20251104.tar.gz -C $CTS_CACHE_DIR
```

### Configuration Backup

```bash
# Backup .ctsrc.json files
rsync -av --include="*/" --include=".ctsrc.json" --exclude="*" /projects/ /backups/cts-config/
```

### Disaster Recovery

1. **Cache Corruption:**
   - Clear cache: `rm -rf $CTS_CACHE_DIR/.cts_cache/*`
   - Restart server (cache rebuilds automatically)

2. **Server Crash:**
   - Restart server process
   - Cache persists across restarts
   - No data loss (stateless server)

---

## Appendix

### Environment Variable Quick Reference

```bash
# Minimal production config
export NODE_ENV=production
export LOG_LEVEL=INFO
export CTS_CACHE_DIR=/var/cache/cts-mcp
export CTS_ENABLE_CACHE=true
export CTS_ENABLE_PARALLEL=true
export CTS_WORKER_COUNT=4

# Optimal performance config (8-core server)
export CTS_WORKER_COUNT=7
export CTS_CACHE_TTL=3600000
export CTS_MAX_FILE_SIZE=10485760

# Debug config
export LOG_LEVEL=DEBUG
export DEBUG=cts:*
export CTS_PROFILE=true
```

### Performance Tuning Checklist

- [ ] Enable caching (`CTS_ENABLE_CACHE=true`)
- [ ] Use persistent cache directory (not `/tmp`)
- [ ] Enable parallel execution for 10+ rules
- [ ] Set worker count = CPU cores - 1
- [ ] Use file sampling for large projects (500+ files)
- [ ] Increase cache TTL for stable projects
- [ ] Monitor cache hit rate (target: 90%+)
- [ ] Profile slow audits (`CTS_PROFILE=true`)

---

**Document Version:** 1.0.0  
**Last Reviewed:** November 4, 2025  
**Next Review:** December 4, 2025
