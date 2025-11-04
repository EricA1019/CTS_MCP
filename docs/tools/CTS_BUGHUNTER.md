# CTS Bughunter Tool

## Overview

The CTS Bughunter tool performs automated static analysis on GDScript codebases to detect common bugs, anti-patterns, and code quality issues. It uses heuristic-based pattern matching to identify potential problems before they cause runtime errors.

**Key Features:**
- 10 bug detection patterns (5 general + 5 GDScript-specific)
- Severity-based scoring system (low, medium, high, critical)
- Three export formats (JSON, Markdown, CTS Plan)
- Performance optimized for large codebases (<3s target)
- Configurable exclusion patterns and severity filtering

## Supported Bug Patterns

| Pattern ID | Severity | Description |
|------------|----------|-------------|
| `missing_null_check` | High | Potential null pointer dereference without validation |
| `missing_error_handling` | Medium | Function calls without try/catch or error checking |
| `type_mismatch_likely` | Medium | Probable type incompatibility between assignments |
| `division_by_zero_risk` | Critical | Division operation without denominator validation |
| `unused_return_value` | Low | Function return value ignored without explicit discard |
| `signal_leak` | High | Signal connection without corresponding disconnection |
| `node_not_freed` | Medium | Node instantiation without queue_free() or remove_child() |
| `missing_ready_check` | Medium | Node access in _init() before scene tree is ready |
| `export_without_type` | Low | Export variable lacks explicit type annotation |
| `onready_with_null_path` | High | @onready variable with invalid NodePath |

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectPath` | string | Yes | - | Absolute path to the Godot project directory |
| `excludePatterns` | string[] | No | `[]` | Glob patterns for files to ignore (e.g., `addons/**`, `test/**`) |
| `maxFiles` | number | No | `1000` | Maximum number of files to scan (performance limiter) |
| `minSeverity` | enum | No | `low` | Minimum severity to report (`low`, `medium`, `high`, `critical`) |
| `format` | enum | No | `markdown` | Output format (`json`, `markdown`, `cts_plan`) |

## Usage Examples

### Basic Scan

Scan entire project with default settings:

```typescript
// MCP Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "CTS_Bughunter",
    "arguments": {
      "projectPath": "/home/user/my_game"
    }
  }
}
```

**Output:** Markdown report with all bugs from low to critical severity.

### Filtered Scan (Critical Only)

Focus on critical bugs in production code:

```typescript
{
  "projectPath": "/home/user/my_game",
  "excludePatterns": ["addons/**", "test/**", "tools/**"],
  "minSeverity": "critical",
  "format": "json"
}
```

**Output:** JSON report containing only division-by-zero and other critical issues.

### CTS Plan Export

Convert high-priority bugs into Shrimp task plan:

```typescript
{
  "projectPath": "/home/user/my_game",
  "minSeverity": "high",
  "format": "cts_plan"
}
```

**Output:** JSON structure with hop-based task breakdown for Shrimp MCP integration.

Example CTS Plan output:

```json
{
  "metadata": {
    "projectPath": "/home/user/my_game",
    "totalBugs": 15,
    "criticalCount": 3,
    "highCount": 12,
    "overallScore": 72
  },
  "hops": [
    {
      "hopId": "bugfix-001-critical",
      "description": "Fix 3 critical bugs in scripts/combat.gd",
      "tasks": [
        "Line 45: Add null check before accessing node",
        "Line 128: Validate denominator before division"
      ],
      "estimatedHours": 2
    }
  ]
}
```

## Output Formats

### JSON Format

Structured data for programmatic processing:

```json
{
  "projectPath": "/home/user/my_game",
  "totalFiles": 127,
  "totalBugs": 45,
  "overallScore": 82,
  "severityBreakdown": {
    "low": 20,
    "medium": 18,
    "high": 6,
    "critical": 1
  },
  "byFile": [
    {
      "file": "/home/user/my_game/scripts/player.gd",
      "bugCount": 3,
      "bugs": [
        {
          "pattern": "signal_leak",
          "name": "Signal Connection Leak",
          "severity": "high",
          "line": 45,
          "column": 12,
          "message": "Signal connected but never disconnected"
        }
      ]
    }
  ],
  "scanTimeMs": 1247
}
```

### Markdown Format

Human-readable report with emoji indicators:

```markdown
# 🐛 CTS Bughunter Report

**Project:** /home/user/my_game  
**Scan Time:** 1247ms  
**Files Scanned:** 127  
**Total Bugs:** 45  
**Quality Score:** 82/100 ⚠️

## Severity Breakdown
| Severity | Count |
|----------|-------|
| 🔴 Critical | 1 |
| 🟠 High | 6 |
| 🟡 Medium | 18 |
| 🟢 Low | 20 |

## Top 10 Buggy Files
### scripts/player.gd (3 bugs)
- **Line 45** [🟠 High] Signal Connection Leak: Signal connected but never disconnected
```

### CTS Plan Format

Shrimp-compatible task structure (see example above). Only includes critical and high severity bugs.

## Performance Characteristics

- **Target:** <3s for projects with 1000+ files
- **Actual:** Varies based on file size and pattern complexity
- **Optimization:** Uses AST cursor-based traversal (no full tree cloning)
- **Limitation:** Tree-sitter parsing overhead (~1-2ms per file)

### Performance Tips

1. **Use exclusion patterns** to skip vendor code:
   ```typescript
   excludePatterns: ["addons/**", "*.import"]
   ```

2. **Set maxFiles** for incremental scans:
   ```typescript
   maxFiles: 50  // Focus on recently changed files
   ```

3. **Filter by severity** to reduce report size:
   ```typescript
   minSeverity: "medium"  // Skip low-priority issues
   ```

## Integration with Other Tools

### Cleanup Tool (Future)

The Bughunter tool will feed into the Cleanup tool for automated fixes:

```typescript
// Step 1: Identify bugs
const bugs = await bughunter({ projectPath: "/project" });

// Step 2: Auto-fix safe patterns
const fixes = await cleanup({
  projectPath: "/project",
  issues: bugs.byFile.filter(f => f.bugs.some(b => b.pattern === "unused_return_value"))
});
```

### Audit Tool Integration

Bughunter results contribute to overall code quality audits:

```typescript
const auditReport = await audit({ projectPath: "/project" });
// Includes bughunter score + other metrics
```

## Troubleshooting

### False Positives

**Problem:** Tool reports bugs in valid code.

**Solution:** Some patterns use heuristics (e.g., `type_mismatch_likely` keyword detection). Review reported issues manually and use exclusion patterns for known-good files.

### Performance Issues

**Problem:** Scans take >3s on large projects.

**Solution:**
1. Use `excludePatterns` to skip large addons
2. Set `maxFiles` to limit scope
3. Run incremental scans on changed files only

### Missing Detections

**Problem:** Real bugs not caught by tool.

**Solution:** Bughunter uses static analysis patterns, not full type checking. It may miss:
- Complex control flow bugs
- Logic errors
- Race conditions

Consider complementing with unit tests and Godot's built-in linter.

### Tree-Sitter Errors

**Problem:** `tree-sitter-gdscript` module not found.

**Solution:** Install the native module:
```bash
npm install tree-sitter-gdscript
```

If unavailable, the tool will gracefully degrade (integration tests use mocks).

## Technical Architecture

### Heuristics Engine (`heuristics.ts`)

- 10 pattern matchers using AST traversal
- Each pattern returns `BugMatch[]` with location + metadata
- Severity scoring: `low=1, medium=3, high=7, critical=15`

### Scanner (`scanner.ts`)

- Integrates ProjectScanner (file discovery) + TreeSitterBridge (parsing)
- Groups bugs by file for efficient reporting
- Calculates overall quality score (100 - weighted penalty)

### Reporter (`reporter.ts`)

- Three format implementations (JSON, Markdown, CTS Plan)
- Top-10 file ranking for focused remediation
- Emoji-based severity indicators for UX

### MCP Wrapper (`index.ts`)

- Zod schema validation (pre-scan)
- Performance logging (post-scan)
- Error handling (validation vs runtime failures)

## API Reference

### `createBughunterHandler()`

Returns MCP-compatible handler function.

**Signature:**
```typescript
function createBughunterHandler(): (params: unknown) => Promise<MCPResult>
```

**Error Codes:**
- `-32602`: Invalid parameters (validation failure)
- `-32603`: Internal error (scan/formatting failure)

### `applyHeuristics(node, sourceCode)`

Run all 10 pattern matchers on AST node.

**Returns:** `BugMatch[]`

### `scanForBugs(projectPath, options)`

Main scanning orchestrator.

**Returns:** `BugScanReport`

### `formatReport(report, format)`

Convert scan results to specified format.

**Returns:** `string` (JSON/Markdown) or `CTSPlan`

## Version History

- **v3.0.0** (2025-01-24): Initial release
  - 10 bug patterns
  - 3 output formats
  - <3s performance target

## License

MIT License - see project root for details.
