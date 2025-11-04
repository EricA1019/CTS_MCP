# CTS Cleanup Tool

## Overview

The CTS Cleanup tool provides **safe, reversible filesystem cleanup** with git validation, dry-run mode, and atomic operations. It analyzes Godot projects for code quality issues (unused imports, duplicate files) while preventing accidental data loss through comprehensive safety checks.

**Safety-First Philosophy:**
- 🛡️ Git working tree validation (blocks cleanup on uncommitted changes)
- 🔍 Dry-run mode enabled by default (preview before execution)
- ♻️ Two-phase commit (move to `.cleanup_trash/`, then commit/rollback)
- 🚫 Critical file protection (project.godot, README.md, etc.)
- 📋 Operation logging for audit trail

## Safety Features

### Git Validation

Prevents cleanup when working tree is dirty:

```bash
# Blocked - uncommitted changes detected
{
  "projectPath": "/my/project",
  "requireCleanGit": true,  # Default
  "dryRun": false
}
# Result: Safety check failed - commit changes first
```

### Dry-Run Mode

**Always preview before executing:**

```typescript
// Default behavior (safe)
{
  "projectPath": "/my/project"
}
// Returns: mode: "preview", no files modified

// Explicit live mode (requires clean git)
{
  "projectPath": "/my/project",
  "dryRun": false,
  "requireCleanGit": true
}
```

### Two-Phase Commit

Files moved to `.cleanup_trash/` before permanent deletion:

```bash
# Phase 1: Move to trash (recoverable)
cleanup() → files moved to .cleanup_trash/

# Phase 2a: Commit (permanent deletion)
commit() → .cleanup_trash/ deleted

# Phase 2b: Rollback (restore all)
rollback() → files restored from .cleanup_trash/
```

### Critical File Protection

Hardcoded exclusions for essential files:
- `project.godot` (Godot project configuration)
- `README.md` (project documentation)
- `package.json` (Node.js dependencies)
- `Cargo.toml` (Rust dependencies)
- `.gitignore` (git configuration)

Additional exclusions via `exclusions` parameter.

## Cleanup Strategies

### 1. Dead Code Detection

Identifies unused imports in GDScript files:

**Pattern Detected:**
```gdscript
const UnusedClass = preload("res://unused.gd")  # ❌ Unused

extends Node

func _ready():
  print("No reference to UnusedClass")
```

**Heuristic:** Variable appears only once in source (in the import line).

**Action:**
```json
{
  "type": "remove_unused_imports",
  "file": "scripts/player.gd",
  "details": ["UnusedClass"],
  "impact": "low"
}
```

### 2. Duplicate File Detection

Finds identical files using SHA-256 hashing:

**Example:**
```
project/
  ├── assets/icon.png       (hash: abc123...)
  ├── backup/icon_old.png   (hash: abc123...)  # Duplicate!
  └── sprites/icon_copy.png (hash: abc123...)  # Duplicate!
```

**Action:**
```json
{
  "type": "duplicate_files",
  "files": [
    "assets/icon.png",
    "backup/icon_old.png",
    "sprites/icon_copy.png"
  ],
  "impact": "medium",
  "bytesFreed": 81920  // 2 duplicates * 40KB each
}
```

**Decision:** Keep first file, suggest deleting others.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `projectPath` | string | Yes | - | Absolute path to Godot project directory |
| `strategies` | array | No | `["dead_code"]` | Cleanup strategies to apply (`dead_code`, `duplicates`) |
| `dryRun` | boolean | No | `true` | Preview mode - no files modified |
| `requireCleanGit` | boolean | No | `true` | Require clean git working tree |
| `exclusions` | array | No | `["**/.godot/**", "*.import"]` | Glob patterns to exclude |
| `maxActions` | number | No | `100` | Maximum cleanup actions to return |

## Usage Examples

### 1. Basic Preview (Safe Default)

```typescript
// MCP Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "CTS_Cleanup",
    "arguments": {
      "projectPath": "/home/user/my_game"
    }
  }
}
```

**Output:**
```json
{
  "mode": "preview",
  "safetyReport": "✅ All Passed\n✅ git_clean: Working tree clean\n...",
  "actions": [
    {
      "type": "remove_unused_imports",
      "file": "scripts/enemy.gd",
      "details": ["OldWeapon"],
      "impact": "low"
    }
  ],
  "summary": {
    "totalActions": 1,
    "returnedActions": 1,
    "byType": { "remove_unused_imports": 1 },
    "estimatedBytesFreed": 0
  },
  "performanceMs": 247
}
```

### 2. Duplicate Detection

```typescript
{
  "projectPath": "/home/user/my_game",
  "strategies": ["duplicates"],
  "dryRun": true
}
```

**Output:** List of duplicate file groups with bytes-freed estimates.

### 3. Combined Analysis

```typescript
{
  "projectPath": "/home/user/my_game",
  "strategies": ["dead_code", "duplicates"],
  "maxActions": 50,
  "dryRun": true
}
```

**Output:** All cleanup opportunities from both strategies.

### 4. Exclude Specific Directories

```typescript
{
  "projectPath": "/home/user/my_game",
  "exclusions": [
    "**/.godot/**",
    "*.import",
    "addons/**",       // Skip third-party addons
    "test/**",         // Skip test files
    "prototype/**"     // Skip experimental code
  ],
  "dryRun": true
}
```

## Workflow: From Preview to Execution

**Step 1: Preview (Dry-Run)**
```bash
cleanup(dryRun: true) → Preview actions, no modifications
```

**Step 2: Review Output**
- Check `actions` array for what would be cleaned
- Verify `safetyReport` shows all checks passed
- Review `summary.byType` for action distribution

**Step 3: Execute (if desired)**
```bash
cleanup(dryRun: false, requireCleanGit: true) → Actual cleanup
```

**Step 4: Rollback (if needed)**
```bash
# Files are in .cleanup_trash/ until commit()
# Use FileOperations.rollback() to restore
```

## Performance Characteristics

- **Target:** <1s analysis for typical project (500-1000 files)
- **Actual:** 200-500ms for most projects
- **Bottlenecks:**
  - File I/O (reading source files)
  - SHA-256 hashing (duplicate detection)
  - Directory traversal (recursive scanning)

**Optimization Tips:**
1. Use `exclusions` to skip large directories (e.g., `addons/**`)
2. Set `maxActions` to limit result size
3. Run single strategy at a time for faster iteration

## Troubleshooting

### "Safety checks failed - cleanup blocked"

**Problem:** Git working tree has uncommitted changes.

**Solution:**
```bash
# Option 1: Commit changes
git add .
git commit -m "WIP: Before cleanup"

# Option 2: Skip git check (use with caution)
cleanup({ requireCleanGit: false })

# Option 3: Use dry-run mode (always allowed)
cleanup({ dryRun: true })
```

### False Positives (Unused Imports)

**Problem:** Tool flags imports as unused when they're actually needed.

**Example:**
```gdscript
const Util = preload("res://util.gd")  # Flagged as unused

func get_util():
  return Util  # Used indirectly
```

**Solution:** Review flagged imports manually. Tool uses simple heuristic (single occurrence) which may miss complex usage patterns.

### Exclusion Patterns Not Working

**Problem:** Files still scanned despite exclusion patterns.

**Solution:** Use proper glob syntax:
```typescript
// ❌ Wrong
"exclusions": [".godot"]  // Only matches exact filename

// ✅ Correct
"exclusions": ["**/.godot/**"]  // Matches directory at any depth
```

### Performance Issues

**Problem:** Analysis takes >1s on large project.

**Solution:**
1. **Exclude build artifacts:**
   ```typescript
   "exclusions": ["**/.godot/**", "**/build/**", "**/target/**"]
   ```

2. **Limit file count:**
   ```typescript
   "maxActions": 20  // Return fewer results
   ```

3. **Run strategies separately:**
   ```typescript
   // Fast: dead_code only
   "strategies": ["dead_code"]
   
   // Slow: duplicates (hashes all files)
   "strategies": ["duplicates"]
   ```

## Integration with Other Tools

### Bughunter → Cleanup Pipeline

```typescript
// Step 1: Find bugs
const bugs = await bughunter({ projectPath: "/project" });

// Step 2: Clean up code quality issues
const cleanup = await cleanup({
  projectPath: "/project",
  strategies: ["dead_code"],
  dryRun: false  // Execute after review
});
```

### Cleanup → Audit Verification

```typescript
// Step 1: Clean up project
await cleanup({ projectPath: "/project", dryRun: false });

// Step 2: Verify improvements
const audit = await audit({ projectPath: "/project" });
// Should show improved code quality scores
```

## API Reference

### `validateSafety(projectPath, config)`

Runs pre-flight safety checks.

**Returns:** `SafetyReport` with check results.

### `isExcluded(filePath, exclusions)`

Checks if file matches exclusion patterns.

**Returns:** `boolean`

### `FileOperations.deleteFile(path)`

Moves file to trash (atomic, reversible).

**Returns:** `Promise<void>`

### `FileOperations.rollback()`

Restores all files from trash.

**Returns:** `Promise<void>`

### `FileOperations.commit()`

Permanently deletes trash.

**Returns:** `Promise<void>`

### `deadCodeStrategy.analyze(projectPath, exclusions)`

Finds unused imports in GDScript files.

**Returns:** `Promise<CleanupAction[]>`

### `duplicateStrategy.analyze(projectPath, exclusions)`

Finds duplicate files by hash.

**Returns:** `Promise<CleanupAction[]>`

## Version History

- **v3.0.0** (2025-10-31): Initial release
  - 2 cleanup strategies (dead_code, duplicates)
  - Safety-first design (git validation, dry-run, rollback)
  - <1s performance target achieved

## License

MIT License - see project root for details.
