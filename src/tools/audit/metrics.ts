/**
 * Audit Metrics Collection
 * 
 * Collects project-wide metrics:
 * - Lines of Code (LOC)
 * - Cyclomatic Complexity
 * - File counts
 * - Test coverage (placeholder)
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export interface ProjectMetrics {
  loc: {
    total: number;
    byFile: Record<string, number>;
    average: number;
  };
  complexity: {
    total: number;
    byFile: Record<string, number>;
    average: number;
    max: number;
    maxFile: string;
  };
  files: {
    total: number;
    gdscript: number;
    scenes: number;
    resources: number;
  };
  testCoverage: number; // Percentage (0-100)
}

/**
 * Collect comprehensive project metrics
 */
export async function collectMetrics(
  projectPath: string,
  files: string[]
): Promise<ProjectMetrics> {
  const metrics: ProjectMetrics = {
    loc: { total: 0, byFile: {}, average: 0 },
    complexity: { total: 0, byFile: {}, average: 0, max: 0, maxFile: '' },
    files: { total: files.length, gdscript: 0, scenes: 0, resources: 0 },
    testCoverage: 0,
  };

  // Filter by file type
  const gdFiles = files.filter((f) => f.endsWith('.gd'));
  const sceneFiles = files.filter((f) => f.endsWith('.tscn'));
  const resourceFiles = files.filter((f) => f.endsWith('.tres'));

  metrics.files.gdscript = gdFiles.length;
  metrics.files.scenes = sceneFiles.length;
  metrics.files.resources = resourceFiles.length;

  // Analyze GDScript files
  for (const file of gdFiles) {
    const filePath = join(projectPath, file);
    try {
      const source = readFileSync(filePath, 'utf-8');

      // Count lines of code
      const lines = source.split('\n').length;
      metrics.loc.total += lines;
      metrics.loc.byFile[file] = lines;

      // Calculate cyclomatic complexity (simplified)
      const complexityScore = calculateComplexity(source);
      metrics.complexity.total += complexityScore;
      metrics.complexity.byFile[file] = complexityScore;

      if (complexityScore > metrics.complexity.max) {
        metrics.complexity.max = complexityScore;
        metrics.complexity.maxFile = file;
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Calculate averages
  if (gdFiles.length > 0) {
    metrics.loc.average = Math.round(metrics.loc.total / gdFiles.length);
    metrics.complexity.average = Math.round(
      metrics.complexity.total / gdFiles.length
    );
  }

  // Estimate test coverage (count test files vs. source files)
  const testFiles = files.filter((f) => f.includes('/test/') || f.includes('_test.gd'));
  const sourceFiles = gdFiles.filter((f) => !f.includes('/test/') && !f.includes('_test.gd'));
  
  if (sourceFiles.length > 0) {
    metrics.testCoverage = Math.round((testFiles.length / sourceFiles.length) * 100);
    metrics.testCoverage = Math.min(100, metrics.testCoverage); // Cap at 100%
  }

  return metrics;
}

/**
 * Calculate cyclomatic complexity for source code
 * 
 * Simplified metric: count control flow statements
 * - Base complexity: 1
 * - +1 for each: if, elif, for, while, match, and, or
 */
function calculateComplexity(source: string): number {
  let complexity = 1; // Base complexity

  // Count control flow keywords
  const controlFlowPatterns = [
    /\bif\b/g,
    /\belif\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bmatch\b/g,
    /\band\b/g,
    /\bor\b/g,
  ];

  for (const pattern of controlFlowPatterns) {
    const matches = source.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

/**
 * Calculate file-level complexity breakdown
 */
export function getComplexityBreakdown(metrics: ProjectMetrics): {
  low: number;
  medium: number;
  high: number;
} {
  const breakdown = { low: 0, medium: 0, high: 0 };

  for (const complexity of Object.values(metrics.complexity.byFile)) {
    if (complexity <= 10) {
      breakdown.low++;
    } else if (complexity <= 20) {
      breakdown.medium++;
    } else {
      breakdown.high++;
    }
  }

  return breakdown;
}

/**
 * Get top N most complex files
 */
export function getTopComplexFiles(
  metrics: ProjectMetrics,
  n: number = 10
): Array<{ file: string; complexity: number }> {
  const entries = Object.entries(metrics.complexity.byFile);
  entries.sort((a, b) => b[1] - a[1]);
  
  return entries.slice(0, n).map(([file, complexity]) => ({
    file,
    complexity,
  }));
}

/**
 * Get top N largest files
 */
export function getTopLargestFiles(
  metrics: ProjectMetrics,
  n: number = 10
): Array<{ file: string; loc: number }> {
  const entries = Object.entries(metrics.loc.byFile);
  entries.sort((a, b) => b[1] - a[1]);
  
  return entries.slice(0, n).map(([file, loc]) => ({
    file,
    loc,
  }));
}
