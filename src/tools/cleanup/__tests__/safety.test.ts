/**
 * Safety Validation Tests
 * 
 * Tests for pre-flight safety checks and exclusion pattern matching.
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateSafety,
  isExcluded,
  willDeleteCritical,
  formatSafetyReport,
  type SafetyConfig,
} from '../safety';

describe('Cleanup Safety', () => {
  describe('Pattern Matching', () => {
    it('should match exact file paths', () => {
      const exclusions = ['project.godot', 'README.md'];
      expect(isExcluded('project.godot', exclusions)).toBe(true);
      expect(isExcluded('src/main.gd', exclusions)).toBe(false);
    });

    it('should match wildcard patterns', () => {
      const exclusions = ['*.import', '*.md'];
      expect(isExcluded('icon.png.import', exclusions)).toBe(true);
      expect(isExcluded('README.md', exclusions)).toBe(true);
      expect(isExcluded('main.gd', exclusions)).toBe(false);
    });

    it('should match directory glob patterns', () => {
      const exclusions = ['addons/**', 'test/**'];
      expect(isExcluded('addons/gut/plugin.gd', exclusions)).toBe(true);
      expect(isExcluded('test/unit/test_player.gd', exclusions)).toBe(true);
      expect(isExcluded('scripts/player.gd', exclusions)).toBe(false);
    });

    it('should handle complex patterns', () => {
      const exclusions = ['**/.godot/**', '**/*.import', 'addons/**/test/**'];
      expect(isExcluded('.godot/imported/icon.png', exclusions)).toBe(true);
      expect(isExcluded('assets/icon.svg.import', exclusions)).toBe(true);
      expect(isExcluded('addons/plugin/test/test_plugin.gd', exclusions)).toBe(true);
    });

    it('should handle empty exclusion list', () => {
      expect(isExcluded('any/file.gd', [])).toBe(false);
    });
  });

  describe('Critical File Protection', () => {
    it('should detect unprotected critical files', () => {
      const criticalFiles = ['project.godot', 'README.md'];
      const exclusions = ['*.import']; // Doesn't protect critical files
      expect(willDeleteCritical(criticalFiles, exclusions)).toBe(true);
    });

    it('should detect protected critical files', () => {
      const criticalFiles = ['project.godot', 'README.md'];
      const exclusions = ['project.godot', '*.md'];
      expect(willDeleteCritical(criticalFiles, exclusions)).toBe(false);
    });

    it('should handle partial protection', () => {
      const criticalFiles = ['project.godot', 'README.md', 'package.json'];
      const exclusions = ['project.godot', '*.md']; // Missing package.json
      expect(willDeleteCritical(criticalFiles, exclusions)).toBe(true);
    });
  });

  describe('Safety Validation', () => {
    const mockConfig: SafetyConfig = {
      requireCleanGit: false, // Skip git check in tests
      dryRun: true,
      exclusions: ['**/.godot/**', '*.import'],
      trashDir: '/tmp/test-trash',
    };

    it('should pass validation with safe config', async () => {
      const report = await validateSafety('/tmp/test-project', mockConfig);
      expect(report.allPassed).toBe(true);
      expect(report.checks.length).toBeGreaterThan(0);
    });

    it('should include all safety checks', async () => {
      const report = await validateSafety('/tmp/test-project', mockConfig);
      const checkNames = report.checks.map((c) => c.name);
      expect(checkNames).toContain('git_clean');
      expect(checkNames).toContain('critical_files_protected');
      expect(checkNames).toContain('trash_dir_accessible');
      expect(checkNames).toContain('dry_run_mode');
    });

    it('should indicate dry-run mode', async () => {
      const dryRunConfig = { ...mockConfig, dryRun: true };
      const report = await validateSafety('/tmp/test-project', dryRunConfig);
      const dryRunCheck = report.checks.find((c) => c.name === 'dry_run_mode');
      expect(dryRunCheck?.message).toContain('DRY RUN');
    });

    it('should indicate live mode', async () => {
      const liveConfig = { ...mockConfig, dryRun: false };
      const report = await validateSafety('/tmp/test-project', liveConfig);
      const dryRunCheck = report.checks.find((c) => c.name === 'dry_run_mode');
      expect(dryRunCheck?.message).toContain('LIVE MODE');
    });
  });

  describe('Report Formatting', () => {
    it('should format passing report', () => {
      const report = {
        allPassed: true,
        checks: [
          { name: 'git_clean', passed: true, message: 'Working tree clean' },
          {
            name: 'critical_files_protected',
            passed: true,
            message: '5/5 critical files protected',
          },
        ],
      };

      const formatted = formatSafetyReport(report);
      expect(formatted).toContain('✅ All Passed');
      expect(formatted).toContain('git_clean');
      expect(formatted).toContain('Working tree clean');
    });

    it('should format failing report', () => {
      const report = {
        allPassed: false,
        checks: [
          {
            name: 'git_clean',
            passed: false,
            message: 'Uncommitted changes detected',
          },
        ],
      };

      const formatted = formatSafetyReport(report);
      expect(formatted).toContain('❌ Failed');
      expect(formatted).toContain('Uncommitted changes');
    });

    it('should include all checks in formatted output', () => {
      const report = {
        allPassed: true,
        checks: [
          { name: 'check1', passed: true, message: 'msg1' },
          { name: 'check2', passed: true, message: 'msg2' },
          { name: 'check3', passed: true, message: 'msg3' },
        ],
      };

      const formatted = formatSafetyReport(report);
      expect(formatted).toContain('check1');
      expect(formatted).toContain('check2');
      expect(formatted).toContain('check3');
    });
  });
});
