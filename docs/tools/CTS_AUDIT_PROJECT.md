# CTS Audit Project

Comprehensive Godot project auditing for CTS compliance, code quality, and project structure.

## Overview

The CTS Audit tool analyzes your Godot GDScript project against established standards and best practices, providing:

- **Overall Score** (0-100): Weighted average across all categories
- **Category Scores**: CTS compliance, code quality, project structure
- **Violation Details**: File locations, line numbers, severity levels
- **Actionable Recommendations**: Prioritized fixes with effort estimates
- **Project Metrics**: LOC, complexity, test coverage estimates

## Compliance Categories

### 1. CTS Standards (40% weight)

**Rules:**
- **cts_file_size**: Files should not exceed 500 lines
- **cts_signal_first**: Classes should declare signals for event-driven architecture
- **cts_hop_size**: Hops should stay within estimated LOC targets (±20%)
- **cts_template_usage**: Files should follow CTS template patterns

### 2. Code Quality (40% weight)

**Rules:**
- **type_hints**: Functions should use type hints for parameters and return values
- **error_handling**: Code should include assertions and null checks
- **complexity**: Functions should not exceed cyclomatic complexity of 10
- **naming_conventions**: Identifiers should follow snake_case convention

### 3. Project Structure (20% weight)

**Rules:**
- **addon_integration**: Addons should have proper `plugin.cfg` files
- **directory_organization**: Projects should use standard directories (scripts/, scenes/, assets/)

## Scoring Algorithm

### Overall Score Calculation

```
Overall Score = (CTS Score × 0.4) + (Code Quality Score × 0.4) + (Structure Score × 0.2)
```

### Category Score Calculation

Each category score is the average of individual rule scores within that category:

```
Category Score = Σ(Rule Scores) / Number of Rules
```

### Rule Score Calculation

Individual rule scores are based on violation severity and count:

- **Perfect compliance**: 100 points
- **Info violations**: 95 points (informational only)
- **Warning violations**: 70-90 points (depending on count)
- **Error violations**: 0-60 points (critical issues)

## Parameters

### Required

- **projectPath** (string): Absolute path to the Godot project directory

### Optional

- **categories** (array): Specific categories to audit
  - Options: `["cts", "code_quality", "project_structure"]`
  - Default: All categories
  
- **minScore** (number): Minimum score threshold (0-100)
  - Default: 0
  - Tool returns error if score falls below threshold
  
- **format** (string): Output format
  - Options: `"json"` (default), `"markdown"`

## Usage Examples

### Full Project Audit

```json
{
  "projectPath": "/home/user/godot/my_project"
}
```

**Response:**
```json
{
  "report": {
    "overallScore": 87.5,
    "categoryScores": {
      "cts": 90.0,
      "code_quality": 85.0,
      "project_structure": 88.0
    },
    "violations": [...],
    "recommendations": [...],
    "metrics": {...}
  }
}
```

### CTS-Only Check

```json
{
  "projectPath": "/home/user/godot/my_project",
  "categories": ["cts"]
}
```

### CI Integration (Threshold Enforcement)

```json
{
  "projectPath": "/home/user/godot/my_project",
  "minScore": 80,
  "format": "json"
}
```

**Exit behavior:**
- Score ≥ 80: Returns report normally
- Score < 80: Returns error with report details

### Markdown Report

```json
{
  "projectPath": "/home/user/godot/my_project",
  "format": "markdown"
}
```

**Response:**
```markdown
# 📊 CTS Audit Report

**Overall Score:** 87.5/100 ✔️ Good

## Category Scores
| Category | Score | Status |
|----------|-------|--------|
| CTS Compliance | 90.0/100 | ✅ Excellent |
| Code Quality | 85.0/100 | ✔️ Good |
| Project Structure | 88.0/100 | ✔️ Good |

## 🎯 Recommendations
...
```

## Interpreting Reports

### Score Ranges

- **90-100**: ✅ Excellent - Production ready
- **75-89**: ✔️ Good - Minor improvements needed
- **60-74**: ⚠️ Fair - Significant issues to address
- **0-59**: ❌ Needs Improvement - Critical issues present

### Violation Severity

- **🔴 Error**: Critical issue that breaks standards (priority: fix immediately)
- **🟠 Warning**: Important issue that should be addressed (priority: fix soon)
- **🔵 Info**: Informational notice (priority: optional)

### Recommendation Priority

Recommendations are sorted by priority:

1. **🔴 Critical**: Immediate action required (security, breaking issues)
2. **🟠 High**: Should fix soon (standards violations, major quality issues)
3. **🟡 Medium**: Address when convenient (minor quality issues)
4. **🟢 Low**: Optional improvements (style, organization)

### Effort Estimates

- **Low**: <1 hour (quick fixes, formatting)
- **Medium**: 1-4 hours (refactoring, restructuring)
- **High**: >4 hours (major redesign, complex changes)

## Integration with Other Tools

### Cleanup Tool Integration

After running an audit, use the Cleanup tool to automatically fix some violations:

```json
// 1. Audit to identify issues
{
  "projectPath": "/path/to/project"
}

// 2. Cleanup dead code (fixes unused imports, duplicate files)
{
  "projectPath": "/path/to/project",
  "strategies": ["dead_code", "duplicates"],
  "dryRun": false
}

// 3. Re-audit to verify improvements
{
  "projectPath": "/path/to/project",
  "minScore": 85
}
```

### Bughunter Integration

Combine audit and bughunter for comprehensive analysis:

```json
// Audit for standards compliance
{
  "projectPath": "/path/to/project",
  "categories": ["cts", "code_quality"]
}

// Bughunter for potential bugs
{
  "projectPath": "/path/to/project",
  "minSeverity": "medium"
}
```

## Performance

- **Target**: <5 seconds for full project audit
- **Actual**: Typically 1-3 seconds for projects <100 files
- **Scaling**: Linear with file count (additional files add ~20-50ms each)

**Performance Tips:**
- Use category filtering to reduce audit time
- Run in CI with caching to avoid redundant checks
- Focus audits on changed files during development

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CTS Audit

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run CTS Audit
        run: |
          echo '{"projectPath":"${{ github.workspace }}","minScore":75}' | \
          node /path/to/cts_mcp/build/index.js
        
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: audit-report
          path: audit-report.json
```

### GitLab CI Example

```yaml
cts_audit:
  stage: test
  script:
    - echo '{"projectPath":"$CI_PROJECT_DIR","format":"markdown"}' | node /path/to/cts_mcp/build/index.js > audit-report.md
  artifacts:
    reports:
      codequality: audit-report.json
    paths:
      - audit-report.md
```

## Troubleshooting

### False Positives

**Issue:** Rule incorrectly flags compliant code

**Solution:** Use exclusion patterns in future versions, or customize rules

### Low Scores Despite Good Code

**Issue:** Score lower than expected for quality code

**Cause:** Rules may be strict compared to your team's standards

**Solution:** 
1. Review violations to understand specific issues
2. Consider adjusting team practices to match CTS standards
3. Use category filtering to focus on relevant rules

### Performance Issues

**Issue:** Audit takes >5 seconds

**Cause:** Very large project or slow disk I/O

**Solutions:**
- Use category filtering: `{"categories": ["cts"]}`
- Exclude generated directories: Ensure `.godot/` and `addons/` are excluded
- Run on SSD for faster file I/O

### Missing Violations

**Issue:** Known issues not detected

**Cause:** Rule may not cover specific pattern

**Solution:** Check rule definitions or report enhancement request

## Customizing Rules

### Adding Team-Specific Rules

While the tool has fixed rules, you can extend it by:

1. **Fork the CTS MCP Server**
2. **Add custom rule to `src/tools/audit/checkers.ts`:**

```typescript
const CUSTOM_RULE: ComplianceRule = {
  id: 'custom_team_standard',
  name: 'Team Coding Standard',
  category: 'code_quality',
  description: 'Files should follow team-specific patterns',
  check: async (ctx: AuditContext) => {
    const violations: Violation[] = [];
    
    for (const file of ctx.files.filter(f => f.endsWith('.gd'))) {
      const source = await readFile(join(ctx.projectPath, file), 'utf-8');
      
      // Your custom validation logic
      if (!source.includes('# Author:')) {
        violations.push({
          file,
          line: 1,
          severity: 'warning',
          message: 'Missing author comment'
        });
      }
    }
    
    const score = violations.length === 0 ? 100 : 80;
    return { passed: violations.length === 0, violations, score };
  }
};

// Add to ALL_RULES array
export const ALL_RULES: ComplianceRule[] = [
  // ... existing rules
  CUSTOM_RULE,
];
```

3. **Rebuild:** `npm run build`
4. **Test:** Run audit with custom rule

## Related Tools

- **CTS_Reasoning**: Analyze complex design decisions
- **CTS_Bughunter**: Detect potential bugs and code smells
- **CTS_Cleanup**: Automatically fix dead code and duplicates
- **CTS_Analyze_Project**: Signal intelligence and architecture analysis

## Support

For issues, feature requests, or questions:
- Check the [CTS MCP documentation](../mcp_upgrade_plan.md)
- Review [test cases](../src/tools/audit/__tests__/) for usage patterns
- Consult Pete (MCP Tooling Expert) for architectural guidance
