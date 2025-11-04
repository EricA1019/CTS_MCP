# CI/CD Integration Guide for CTS MCP Server

This guide explains how to integrate the CTS (Close-to-Shore) MCP Server into your CI/CD pipeline for automated code quality auditing.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Platform-Specific Setup](#platform-specific-setup)
  - [GitHub Actions](#github-actions)
  - [GitLab CI](#gitlab-ci)
  - [Jenkins](#jenkins)
- [Configuration Options](#configuration-options)
- [Caching Strategy](#caching-strategy)
- [Threshold Enforcement](#threshold-enforcement)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

The CTS MCP Server provides automated code quality auditing for Godot GDScript projects, checking compliance with:
- **CTS Standards**: File size limits, signal-first architecture, hop boundaries
- **Code Quality**: Type hints, error handling, complexity metrics
- **Project Structure**: Template usage, addon integration, directory organization

### Benefits of CI/CD Integration

✅ **Automated Quality Gates** - Prevent low-quality code from merging  
✅ **Fast Feedback** - Catch issues before code review  
✅ **Caching** - 60%+ reduction in CI time with file hash caching  
✅ **PR Comments** - Audit results posted directly to pull requests  
✅ **Historical Tracking** - Monitor quality trends over time  

---

## Quick Start

### Prerequisites

1. **CTS MCP Server** installed in your project (`cts_mcp/` directory)
2. **Node.js 20+** available in CI environment
3. **jq** (JSON processor) for report parsing

### Minimum Configuration

All templates require these environment variables:

```yaml
MIN_CTS_SCORE: "75"      # Minimum acceptable quality score (0-100)
CTS_MCP_DIR: "cts_mcp"   # Path to CTS MCP server directory
```

---

## Platform-Specific Setup

### GitHub Actions

#### 1. Copy Template

```bash
cp cts_mcp/ci_templates/.github/workflows/cts-audit.yml .github/workflows/
```

#### 2. Configure Permissions

The workflow needs these permissions for PR comments:

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

#### 3. Customize Thresholds

Edit `.github/workflows/cts-audit.yml`:

```yaml
- name: Check quality threshold
  env:
    MIN_SCORE: 75  # Change this value
    ACTUAL_SCORE: ${{ steps.audit.outputs.score }}
```

#### 4. Enable Workflow

Push changes to trigger the workflow:

```bash
git add .github/workflows/cts-audit.yml
git commit -m "Add CTS quality audit workflow"
git push
```

#### Features

- ✅ **Automatic PR Comments** - Audit results posted to pull requests
- ✅ **Step Summaries** - Results visible in GitHub UI
- ✅ **Caching** - File hash-based caching reduces CI time
- ✅ **Artifact Upload** - Full reports saved for 90 days

#### Example Output

```
## 📊 CTS Quality Audit Results

**Overall Score**: 82.5/100
**Threshold**: 75/100
**Status**: ✅ PASSED

### Category Scores
- **cts**: 85.0/100
- **code_quality**: 80.0/100
- **project_structure**: 82.5/100

### Top Violations
- [WARNING] scenes/combat/turn_engine.gd:512 - File exceeds 500 line limit (configured: 500)
- [INFO] ui/inventory_panel.gd:45 - Missing type hint for variable 'items'
```

---

### GitLab CI

#### 1. Copy Template

```bash
cp cts_mcp/ci_templates/.gitlab-ci.yml .
```

#### 2. Add GitLab CI Variables

In your GitLab project, go to **Settings → CI/CD → Variables** and add:

```
MIN_CTS_SCORE = 75
GITLAB_TOKEN = <your-gitlab-token>  # For MR comments (optional)
```

#### 3. Customize Parallel Jobs

Edit `.gitlab-ci.yml` to enable/disable category-specific audits:

```yaml
# Disable individual category jobs if not needed
cts_audit_cts_only:
  # ...
  only:
    - main  # Run only on main branch
```

#### 4. Enable Pipeline

Push changes to trigger the pipeline:

```bash
git add .gitlab-ci.yml
git commit -m "Add CTS audit pipeline"
git push
```

#### Features

- ✅ **Parallel Jobs** - Categories audited in parallel for speed
- ✅ **Cache Optimization** - Smart caching based on file hashes
- ✅ **Artifact Reports** - Results saved for 30 days
- ✅ **MR Comments** - Optional merge request comments with results

#### Cache Configuration

GitLab CI uses smart caching based on:
1. `package-lock.json` - Dependency changes
2. `**/*.gd` - GDScript file changes

```yaml
cache:
  key:
    files:
      - ${CTS_MCP_DIR}/package-lock.json
      - '**/*.gd'
  paths:
    - ${CTS_MCP_DIR}/node_modules/
    - .cts_cache/
```

---

### Jenkins

#### 1. Copy Template

```bash
cp cts_mcp/ci_templates/Jenkinsfile .
```

#### 2. Create Jenkins Pipeline

1. Go to **New Item** → **Pipeline**
2. Under **Pipeline**, select:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Script Path**: `Jenkinsfile`

#### 3. Install Required Plugins (Optional)

For enhanced features:
- **HTML Publisher** - For HTML report generation
- **Blue Ocean** - For better UI
- **Slack Notification** - For team notifications

#### 4. Configure Environment

In Jenkins **Global Tool Configuration**:
- Add **NodeJS 20** installation
- Add **Docker** if using Docker agent

#### 5. Run Pipeline

Trigger manually or on SCM changes.

#### Features

- ✅ **Declarative Pipeline** - Clear, readable pipeline structure
- ✅ **Parallel Stages** - Category audits run in parallel
- ✅ **Quality Gates** - Build fails if threshold not met
- ✅ **HTML Reports** - Visual audit reports (with plugin)

#### Docker Agent Configuration

The Jenkinsfile uses a Docker agent by default:

```groovy
agent {
    docker {
        image 'node:20'
        args '-u root:root'
    }
}
```

For non-Docker setups, change to:

```groovy
agent {
    label 'nodejs'  // Node with NodeJS installed
}
```

---

## Configuration Options

### Audit Parameters

All platforms support these audit configuration options:

```json
{
  "projectPath": "../",
  "categories": ["cts", "code_quality", "project_structure"],
  "minScore": 75,
  "format": "json"
}
```

#### Categories

- **`cts`**: CTS methodology compliance (file size, hop boundaries, signal-first)
- **`code_quality`**: Type hints, error handling, complexity
- **project_structure`**: Template usage, addon integration

#### Thresholds

Recommended thresholds by project maturity:

| Project Stage | Recommended Score |
|---------------|-------------------|
| Prototype | 50-60 |
| Alpha | 65-75 |
| Beta | 75-85 |
| Production | 85+ |

### Custom `.ctsrc.json`

Create `.ctsrc.json` in your project root to customize rules:

```json
{
  "rules": {
    "maxFileLines": 500,
    "maxFunctionLines": 50,
    "maxComplexity": 10,
    "requireTypeHints": true,
    "signalFirstEnforcement": true
  },
  "exclude": [
    "addons/**",
    "**/.godot/**",
    "**/test/**"
  ]
}
```

---

## Caching Strategy

### How Caching Works

The CTS MCP Server uses **file hash-based caching**:

1. **First Run**: Analyzes all files, caches results by file hash
2. **Subsequent Runs**: Only re-analyzes changed files
3. **Cache Key**: `SHA256(file_content) + rule_id + rule_version`

### Expected Performance

| Project Size | First Run | Cached Run | Speedup |
|--------------|-----------|------------|---------|
| Small (<100 files) | ~5s | ~2s | 2.5x |
| Medium (100-500 files) | ~15s | ~4s | 3.75x |
| Large (500+ files) | ~45s | ~8s | 5.6x |

### Cache Storage

**GitHub Actions**:
```yaml
- uses: actions/cache@v4
  with:
    path: .cts_cache/
    key: cts-cache-${{ hashFiles('**/*.gd') }}
```

**GitLab CI**:
```yaml
cache:
  paths:
    - .cts_cache/
  key:
    files:
      - '**/*.gd'
```

**Jenkins**:
- Caching handled by workspace persistence
- Use **Workspace Cleanup** plugin to manage cache size

---

## Threshold Enforcement

### How It Works

1. CTS audit runs and generates score (0-100)
2. Score compared to `MIN_CTS_SCORE` threshold
3. Build fails if `score < threshold`

### Gradual Rollout Strategy

Don't start with strict thresholds! Use gradual enforcement:

#### Week 1-2: Monitoring Only
```yaml
MIN_CTS_SCORE: 0  # Don't fail builds
```

Establish baseline, identify problem areas.

#### Week 3-4: Soft Enforcement
```yaml
MIN_CTS_SCORE: 60  # Easy target
```

Allow failures but don't block merges.

#### Month 2+: Progressive Tightening
```yaml
MIN_CTS_SCORE: 70  # Increase gradually
```

Raise threshold by 5 points every 2 weeks until reaching production target (85+).

### Override for Hotfixes

Add ability to skip audit for emergencies:

**GitHub Actions**:
```yaml
- name: Check quality threshold
  if: "!contains(github.event.head_commit.message, '[skip-audit]')"
```

**GitLab CI**:
```yaml
cts_audit_full:
  except:
    variables:
      - $CI_COMMIT_MESSAGE =~ /\[skip-audit\]/
```

**Jenkins**:
```groovy
stage('Quality Gate') {
    when {
        not {
            changelog '.*\\[skip-audit\\].*'
        }
    }
}
```

---

## Troubleshooting

### Issue: "Command not found: jq"

**Solution**: Install `jq` in CI environment.

**GitHub Actions**:
```yaml
- name: Install jq
  run: sudo apt-get install -y jq
```

**GitLab CI** (add to Docker image):
```yaml
before_script:
  - apt-get update && apt-get install -y jq
```

**Jenkins** (Docker):
```groovy
agent {
    docker {
        image 'node:20'
        args '--entrypoint="" -u root'
    }
}
steps {
    sh 'apt-get update && apt-get install -y jq'
}
```

---

### Issue: "CTS audit score is 0"

**Causes**:
1. Audit command failed silently
2. JSON parsing error
3. Project path incorrect

**Solution**: Add debug output:

```bash
node build/index.js cts_audit '...' || echo "Audit failed with exit code $?"
cat audit_results.json  # Inspect raw output
```

---

### Issue: Cache not working

**GitHub Actions**:
- Check cache key matches pattern
- Verify `.cts_cache/` directory exists
- Review cache hit/miss in workflow logs

**GitLab CI**:
- Ensure `cache:policy: pull-push`
- Check cache key includes all relevant files
- Review job logs for "Cache restored" message

---

### Issue: PR comments not posting

**GitHub Actions**:
- Verify workflow has `pull-requests: write` permission
- Check `GITHUB_TOKEN` has correct scopes
- Ensure running on pull request event

**GitLab CI**:
- Set `GITLAB_TOKEN` variable with `api` scope
- Verify `CI_MERGE_REQUEST_IID` exists
- Check GitLab API permissions

---

## Best Practices

### 1. Start with Monitoring

Don't enforce thresholds immediately:
```yaml
MIN_CTS_SCORE: 0  # Monitor for 2 weeks
```

### 2. Use Gradual Enforcement

Increase threshold incrementally:
```
Week 1-2: 0 (monitor)
Week 3-4: 60
Week 5-6: 70
Week 7+: 80
```

### 3. Cache Aggressively

Enable caching on all platforms for 60%+ speedup.

### 4. Parallel Category Audits

Run category audits in parallel for faster feedback (GitLab CI, Jenkins).

### 5. Archive Reports

Save audit reports for trend analysis:
- GitHub: 90 days retention
- GitLab: 30 days retention
- Jenkins: Unlimited (with cleanup policy)

### 6. Monitor Cache Hit Rate

Track cache effectiveness:
```bash
# In CI logs, look for:
"Using cached results: 85% hit rate"
```

### 7. Fail Fast

Run CTS audit early in pipeline (before expensive tests).

### 8. Notify Teams

Integrate with Slack/Discord for build failures:

**GitHub Actions** (with slack-notify action):
```yaml
- uses: 8398a7/action-slack@v3
  if: failure()
  with:
    status: ${{ job.status }}
    text: 'CTS audit failed: score ${{ steps.audit.outputs.score }}/100'
```

---

## Advanced Examples

### Example 1: Multi-Environment Thresholds

Different thresholds for dev/staging/prod:

**GitHub Actions**:
```yaml
- name: Set threshold by branch
  run: |
    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      echo "MIN_SCORE=85" >> $GITHUB_ENV
    elif [ "${{ github.ref }}" == "refs/heads/develop" ]; then
      echo "MIN_SCORE=75" >> $GITHUB_ENV
    else
      echo "MIN_SCORE=60" >> $GITHUB_ENV
    fi
```

### Example 2: Diff-Only Auditing

Only audit changed files in PRs:

```yaml
- name: Get changed files
  id: changed
  run: |
    git diff --name-only origin/${{ github.base_ref }}...HEAD > changed_files.txt
    
- name: Audit changed files only
  run: |
    # Filter for .gd files
    grep '\.gd$' changed_files.txt > gd_files.txt || true
    # Run audit on changed files
    # (requires custom audit script)
```

### Example 3: Quality Trend Tracking

Store scores over time for dashboards:

```yaml
- name: Record score
  run: |
    echo "$(date +%s),${{ steps.audit.outputs.score }}" >> quality_history.csv
    git add quality_history.csv
    git commit -m "Update quality metrics [skip ci]"
```

---

## Migration Checklist

When adding CTS auditing to an existing project:

- [ ] Install CTS MCP Server in `cts_mcp/` directory
- [ ] Create `.ctsrc.json` with project-specific rules
- [ ] Copy appropriate CI template (GitHub/GitLab/Jenkins)
- [ ] Set `MIN_CTS_SCORE=0` for initial baseline
- [ ] Run audit locally to establish baseline score
- [ ] Configure caching for your CI platform
- [ ] Enable PR/MR comments (optional)
- [ ] Run first CI build and verify audit runs
- [ ] Review baseline score and set target threshold
- [ ] Gradually increase threshold over 4-8 weeks
- [ ] Document threshold policy in `CONTRIBUTING.md`
- [ ] Set up alerts for quality degradation

---

## Support & Resources

- **Documentation**: `/cts_mcp/README.md`
- **Issue Tracker**: GitHub Issues
- **Examples**: `/cts_mcp/ci_templates/`

---

## Appendix: Complete Examples

### GitHub Actions (Complete)

See: `ci_templates/.github/workflows/cts-audit.yml`

### GitLab CI (Complete)

See: `ci_templates/.gitlab-ci.yml`

### Jenkins (Complete)

See: `ci_templates/Jenkinsfile`

---

**Last Updated**: November 4, 2025  
**CTS MCP Server Version**: 3.0.0
