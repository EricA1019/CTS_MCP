/**
 * Performance Trend Data Pipeline
 * Aggregates LOC, test count, and coverage metrics from Git history
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { TrendDataset, TimeSeriesPoint } from '../schemas/trend_data_schema.js';

export class TrendDataPipeline {
  /**
   * Aggregate performance metrics from Git history
   * @param projectPath Path to Git repository
   * @param weeks Number of weeks to analyze (default 12)
   * @returns Time-series dataset with LOC, test count, and coverage
   */
  async aggregateMetrics(projectPath: string, weeks: number = 12): Promise<TrendDataset> {
    if (!existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    const gitDir = join(projectPath, '.git');
    const hasGit = existsSync(gitDir);

    // Calculate week boundaries (ISO weeks)
    const endDate = Date.now();
    const startDate = endDate - (weeks * 7 * 24 * 60 * 60 * 1000);
    const weekBoundaries = this.generateWeekBoundaries(startDate, endDate, weeks);

    if (!hasGit) {
      // No Git history - use current snapshot for all weeks
      return this.generateSnapshotDataset(projectPath, startDate, endDate, weeks, weekBoundaries);
    }

    // Get Git commits in date range
    const commits = this.getCommitsInRange(projectPath, startDate, endDate);

    // Aggregate metrics per week
    const weeklyMetrics = await this.aggregateWeeklyMetrics(
      projectPath,
      commits,
      weekBoundaries
    );

    // Interpolate missing data
    const interpolatedMetrics = this.interpolateMissingData(weeklyMetrics, weekBoundaries);

    return {
      projectPath,
      startDate,
      endDate,
      weekCount: weeks,
      loc: interpolatedMetrics.loc,
      tests: interpolatedMetrics.tests,
      coverage: interpolatedMetrics.coverage,
    };
  }

  /**
   * Generate dataset from current project snapshot (no Git history)
   */
  private async generateSnapshotDataset(
    projectPath: string,
    startDate: number,
    endDate: number,
    weeks: number,
    weekBoundaries: number[]
  ): Promise<TrendDataset> {
    const loc = this.countLinesOfCode(projectPath);
    const tests = this.countTests(projectPath);
    const coverage = this.estimateCoverage(projectPath, loc, tests);

    // Use same metrics for all weeks (flat line)
    const locPoints: TimeSeriesPoint[] = [];
    const testPoints: TimeSeriesPoint[] = [];
    const coveragePoints: TimeSeriesPoint[] = [];

    for (let i = 1; i < weekBoundaries.length; i++) {
      locPoints.push({ timestamp: weekBoundaries[i], value: loc });
      testPoints.push({ timestamp: weekBoundaries[i], value: tests });
      coveragePoints.push({ timestamp: weekBoundaries[i], value: coverage });
    }

    return {
      projectPath,
      startDate,
      endDate,
      weekCount: weeks,
      loc: locPoints,
      tests: testPoints,
      coverage: coveragePoints,
    };
  }

  /**
   * Generate ISO week boundaries for time range
   */
  private generateWeekBoundaries(startDate: number, endDate: number, weeks: number): number[] {
    const boundaries: number[] = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    // Align to Monday 00:00:00 (ISO week start)
    const startMonday = this.getMonday(new Date(startDate)).getTime();

    for (let i = 0; i <= weeks; i++) {
      boundaries.push(startMonday + (i * weekMs));
    }

    return boundaries;
  }

  /**
   * Get Monday of the week containing given date at 00:00:00
   */
  private getMonday(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(date);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0); // Set to midnight
    return monday;
  }

  /**
   * Get Git commits in date range
   */
  private getCommitsInRange(projectPath: string, startDate: number, endDate: number): Array<{ hash: string; timestamp: number }> {
    try {
      const sinceDate = new Date(startDate).toISOString();
      const untilDate = new Date(endDate).toISOString();

      const gitLog = execSync(
        `git log --since="${sinceDate}" --until="${untilDate}" --pretty=format:"%H|%ct" --all`,
        { cwd: projectPath, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );

      if (!gitLog.trim()) {
        return [];
      }

      return gitLog.split('\n').map(line => {
        const [hash, timestamp] = line.split('|');
        return { hash, timestamp: parseInt(timestamp, 10) * 1000 };
      });
    } catch (error) {
      console.warn(`[TrendDataPipeline] Git log failed: ${error}`);
      return [];
    }
  }

  /**
   * Aggregate metrics per week from commits
   */
  private async aggregateWeeklyMetrics(
    projectPath: string,
    commits: Array<{ hash: string; timestamp: number }>,
    weekBoundaries: number[]
  ): Promise<Map<number, { loc: number; tests: number; coverage: number }>> {
    const weeklyMetrics = new Map<number, { loc: number; tests: number; coverage: number }>();

    // Sample one commit per week (closest to week end)
    for (let i = 0; i < weekBoundaries.length - 1; i++) {
      const weekStart = weekBoundaries[i];
      const weekEnd = weekBoundaries[i + 1];

      // Find commits in this week
      const weekCommits = commits.filter(
        c => c.timestamp >= weekStart && c.timestamp < weekEnd
      );

      if (weekCommits.length === 0) {
        continue; // Will be interpolated later
      }

      // Use latest commit in week
      const latestCommit = weekCommits[weekCommits.length - 1];
      const metrics = await this.calculateMetricsAtCommit(projectPath, latestCommit.hash);

      weeklyMetrics.set(weekEnd, metrics);
    }

    return weeklyMetrics;
  }

  /**
   * Calculate LOC, test count, and coverage at specific commit
   */
  private async calculateMetricsAtCommit(
    projectPath: string,
    commitHash: string
  ): Promise<{ loc: number; tests: number; coverage: number }> {
    try {
      // Checkout commit (stash current changes first)
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: projectPath,
        encoding: 'utf-8',
      }).trim();

      execSync(`git stash`, { cwd: projectPath, stdio: 'ignore' });
      execSync(`git checkout ${commitHash}`, { cwd: projectPath, stdio: 'ignore' });

      // Calculate metrics
      const loc = this.countLinesOfCode(projectPath);
      const tests = this.countTests(projectPath);
      const coverage = this.estimateCoverage(projectPath, loc, tests);

      // Restore original state
      execSync(`git checkout ${currentBranch}`, { cwd: projectPath, stdio: 'ignore' });
      execSync(`git stash pop`, { cwd: projectPath, stdio: 'ignore' });

      return { loc, tests, coverage };
    } catch (error) {
      console.warn(`[TrendDataPipeline] Metrics calculation failed at ${commitHash}: ${error}`);
      return { loc: 0, tests: 0, coverage: 0 };
    }
  }

  /**
   * Count lines of code (TypeScript/JavaScript files)
   */
  private countLinesOfCode(projectPath: string): number {
    const srcDir = join(projectPath, 'src');
    if (!existsSync(srcDir)) {
      return 0;
    }

    let totalLines = 0;
    const countInDir = (dir: string) => {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
          countInDir(fullPath);
        } else if (stat.isFile() && /\.(ts|js)$/.test(entry) && !entry.endsWith('.test.ts')) {
          const content = readFileSync(fullPath, 'utf-8');
          totalLines += content.split('\n').filter(line => line.trim().length > 0).length;
        }
      }
    };

    countInDir(srcDir);
    return totalLines;
  }

  /**
   * Count test files and test cases
   */
  private countTests(projectPath: string): number {
    const testDir = join(projectPath, 'src', '__tests__');
    if (!existsSync(testDir)) {
      return 0;
    }

    let totalTests = 0;
    const entries = readdirSync(testDir);

    for (const entry of entries) {
      if (entry.endsWith('.test.ts')) {
        const content = readFileSync(join(testDir, entry), 'utf-8');
        // Count test cases (it('...') or test('...'))
        const matches = content.match(/\b(it|test)\s*\(/g);
        totalTests += matches ? matches.length : 0;
      }
    }

    return totalTests;
  }

  /**
   * Estimate coverage percentage (simple heuristic: tests / LOC ratio)
   */
  private estimateCoverage(projectPath: string, loc: number, tests: number): number {
    if (loc === 0) return 0;

    // Simple heuristic: assume each test covers ~10 lines of code
    const estimatedCoveredLines = tests * 10;
    const coverage = Math.min(100, (estimatedCoveredLines / loc) * 100);

    return Math.round(coverage * 10) / 10; // Round to 1 decimal
  }

  /**
   * Interpolate missing data points using linear interpolation
   */
  private interpolateMissingData(
    weeklyMetrics: Map<number, { loc: number; tests: number; coverage: number }>,
    weekBoundaries: number[]
  ): { loc: TimeSeriesPoint[]; tests: TimeSeriesPoint[]; coverage: TimeSeriesPoint[] } {
    const loc: TimeSeriesPoint[] = [];
    const tests: TimeSeriesPoint[] = [];
    const coverage: TimeSeriesPoint[] = [];

    for (let i = 1; i < weekBoundaries.length; i++) {
      const timestamp = weekBoundaries[i];
      const metrics = weeklyMetrics.get(timestamp);

      if (metrics) {
        // Data available for this week
        loc.push({ timestamp, value: metrics.loc });
        tests.push({ timestamp, value: metrics.tests });
        coverage.push({ timestamp, value: metrics.coverage });
      } else {
        // Interpolate from neighbors
        const interpolated = this.interpolatePoint(weeklyMetrics, weekBoundaries, i);
        loc.push({ timestamp, value: interpolated.loc });
        tests.push({ timestamp, value: interpolated.tests });
        coverage.push({ timestamp, value: interpolated.coverage });
      }
    }

    return { loc, tests, coverage };
  }

  /**
   * Linear interpolation for missing data point
   */
  private interpolatePoint(
    weeklyMetrics: Map<number, { loc: number; tests: number; coverage: number }>,
    weekBoundaries: number[],
    index: number
  ): { loc: number; tests: number; coverage: number } {
    // Find previous and next available data points
    let prevIndex = index - 1;
    while (prevIndex >= 0 && !weeklyMetrics.has(weekBoundaries[prevIndex])) {
      prevIndex--;
    }

    let nextIndex = index + 1;
    while (nextIndex < weekBoundaries.length && !weeklyMetrics.has(weekBoundaries[nextIndex])) {
      nextIndex++;
    }

    if (prevIndex < 0 && nextIndex >= weekBoundaries.length) {
      // No data available at all
      return { loc: 0, tests: 0, coverage: 0 };
    } else if (prevIndex < 0) {
      // Use next value (forward fill)
      return weeklyMetrics.get(weekBoundaries[nextIndex])!;
    } else if (nextIndex >= weekBoundaries.length) {
      // Use previous value (backward fill)
      return weeklyMetrics.get(weekBoundaries[prevIndex])!;
    } else {
      // Linear interpolation between prev and next
      const prev = weeklyMetrics.get(weekBoundaries[prevIndex])!;
      const next = weeklyMetrics.get(weekBoundaries[nextIndex])!;
      const ratio = (index - prevIndex) / (nextIndex - prevIndex);

      return {
        loc: Math.round(prev.loc + (next.loc - prev.loc) * ratio),
        tests: Math.round(prev.tests + (next.tests - prev.tests) * ratio),
        coverage: Math.round((prev.coverage + (next.coverage - prev.coverage) * ratio) * 10) / 10,
      };
    }
  }
}
