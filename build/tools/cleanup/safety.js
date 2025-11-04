/**
 * Cleanup Safety Validation
 *
 * Pre-flight safety checks to prevent accidental data loss:
 * - Git working tree validation
 * - Critical file protection
 * - Pattern-based exclusion matching
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { minimatch } from 'minimatch';
import { statSync } from 'fs';
import { join } from 'path';
const execAsync = promisify(exec);
/**
 * Validate project safety before cleanup operations
 */
export async function validateSafety(projectPath, config) {
    const checks = [];
    // Check 1: Git status validation
    if (config.requireCleanGit) {
        try {
            const { stdout } = await execAsync('git status --porcelain', {
                cwd: projectPath,
            });
            const isClean = stdout.trim() === '';
            checks.push({
                name: 'git_clean',
                passed: isClean,
                message: isClean
                    ? 'Working tree clean'
                    : `Uncommitted changes detected:\n${stdout.trim()}`,
            });
        }
        catch (error) {
            checks.push({
                name: 'git_clean',
                passed: false,
                message: `Git validation failed: ${error instanceof Error ? error.message : String(error)}`,
            });
        }
    }
    else {
        checks.push({
            name: 'git_clean',
            passed: true,
            message: 'Git validation skipped (requireCleanGit=false)',
        });
    }
    // Check 2: Critical files protected
    const criticalFiles = [
        'project.godot',
        'README.md',
        'package.json',
        'Cargo.toml',
        '.gitignore',
    ];
    const protectedCount = criticalFiles.filter((file) => isExcluded(join(projectPath, file), config.exclusions)).length;
    checks.push({
        name: 'critical_files_protected',
        passed: true, // Always pass, just informational
        message: `${protectedCount}/${criticalFiles.length} critical files in exclusion patterns`,
    });
    // Check 3: Trash directory accessible
    try {
        try {
            statSync(config.trashDir);
        }
        catch {
            // Trash dir doesn't exist yet, that's OK
        }
        checks.push({
            name: 'trash_dir_accessible',
            passed: true,
            message: `Trash directory: ${config.trashDir}`,
        });
    }
    catch (error) {
        checks.push({
            name: 'trash_dir_accessible',
            passed: false,
            message: `Cannot access trash directory: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
    // Check 4: Dry-run mode indicator
    checks.push({
        name: 'dry_run_mode',
        passed: true,
        message: config.dryRun
            ? '🔍 DRY RUN MODE - No files will be modified'
            : '⚠️  LIVE MODE - Files will be moved to trash',
    });
    return {
        allPassed: checks.every((c) => c.passed),
        checks,
    };
}
/**
 * Check if a file path matches any exclusion pattern
 *
 * Uses minimatch for glob pattern matching:
 * - ** matches any directory depth
 * - * matches any characters except /
 * - ? matches a single character
 */
export function isExcluded(filePath, exclusions) {
    return exclusions.some((pattern) => minimatch(filePath, pattern));
}
/**
 * Check if cleanup operation would delete critical files
 */
export function willDeleteCritical(criticalFiles, exclusions) {
    return criticalFiles.some((file) => !isExcluded(file, exclusions));
}
/**
 * Format safety report for display
 */
export function formatSafetyReport(report) {
    const lines = [
        '## Safety Pre-Flight Checks',
        '',
        `**Status:** ${report.allPassed ? '✅ All Passed' : '❌ Failed'}`,
        '',
    ];
    for (const check of report.checks) {
        const icon = check.passed ? '✅' : '❌';
        lines.push(`${icon} **${check.name}**`);
        lines.push(`   ${check.message}`);
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=safety.js.map