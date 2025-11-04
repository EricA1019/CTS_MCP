/**
 * Bughunter Report Formatters
 * 
 * Formats bug scan results into multiple output formats:
 * - JSON: Structured data for programmatic consumption
 * - Markdown: Human-readable report
 * - CTS Plan: Hop-based task format for Shrimp integration
 */

import { BugScanReport, FileBugReport } from './scanner.js';
import { BugMatch } from './heuristics.js';

/**
 * Format bug report in specified format
 */
export function formatReport(
  report: BugScanReport,
  format: 'json' | 'markdown' | 'cts_plan'
): string {
  switch (format) {
    case 'json':
      return formatJSON(report);
    case 'markdown':
      return formatMarkdown(report);
    case 'cts_plan':
      return formatCTSPlan(report);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

/**
 * Format as JSON with indentation
 */
function formatJSON(report: BugScanReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Format as Markdown report
 */
function formatMarkdown(report: BugScanReport): string {
  let md = `# 🐛 Bug Hunter Report\n\n`;
  
  // Summary section
  md += `## 📊 Summary\n\n`;
  md += `- **Project**: \`${report.projectPath}\`\n`;
  md += `- **Files Scanned**: ${report.totalFiles}\n`;
  md += `- **Total Bugs Found**: ${report.totalBugs}\n`;
  md += `- **Quality Score**: ${report.overallScore}/100 ${getScoreEmoji(report.overallScore)}\n`;
  md += `- **Scan Time**: ${report.scanTimeMs}ms\n\n`;
  
  // Severity breakdown
  md += `### Severity Breakdown\n\n`;
  md += `| Severity | Count |\n`;
  md += `|----------|-------|\n`;
  md += `| 🔴 Critical | ${report.severityBreakdown.critical} |\n`;
  md += `| 🟠 High | ${report.severityBreakdown.high} |\n`;
  md += `| 🟡 Medium | ${report.severityBreakdown.medium} |\n`;
  md += `| ⚪ Low | ${report.severityBreakdown.low} |\n\n`;
  
  // Top problematic files
  if (report.byFile.length > 0) {
    md += `## 🔥 Most Problematic Files\n\n`;
    const topFiles = report.byFile.slice(0, 10);
    
    for (const fileReport of topFiles) {
      md += `### \`${fileReport.file}\`\n\n`;
      md += `**${fileReport.bugCount} bugs found**\n\n`;
      
      // Group bugs by severity for this file
      const criticalBugs = fileReport.bugs.filter(b => b.severity === 'critical');
      const highBugs = fileReport.bugs.filter(b => b.severity === 'high');
      const mediumBugs = fileReport.bugs.filter(b => b.severity === 'medium');
      const lowBugs = fileReport.bugs.filter(b => b.severity === 'low');
      
      // Show critical and high priority bugs with details
      [...criticalBugs, ...highBugs].forEach(bug => {
        md += `- **Line ${bug.line}:${bug.column}** [${getSeverityEmoji(bug.severity)} ${bug.severity.toUpperCase()}] ${bug.name}\n`;
        md += `  - ${bug.message}\n`;
        if (bug.suggestion) {
          md += `  - 💡 *Suggestion*: ${bug.suggestion}\n`;
        }
        md += `\n`;
      });
      
      // Summarize medium and low bugs
      if (mediumBugs.length > 0) {
        md += `\n*+ ${mediumBugs.length} medium severity issues*\n`;
      }
      if (lowBugs.length > 0) {
        md += `*+ ${lowBugs.length} low severity issues*\n`;
      }
      
      md += `\n`;
    }
  } else {
    md += `## ✅ No Bugs Found!\n\n`;
    md += `Your code looks clean! 🎉\n\n`;
  }
  
  // Recommendations
  if (report.totalBugs > 0) {
    md += `## 💡 Recommendations\n\n`;
    
    if (report.severityBreakdown.critical > 0) {
      md += `- ⚠️ **URGENT**: Fix ${report.severityBreakdown.critical} critical bugs immediately (memory leaks, crashes)\n`;
    }
    if (report.severityBreakdown.high > 0) {
      md += `- 🔴 **HIGH PRIORITY**: Address ${report.severityBreakdown.high} high severity bugs (potential runtime errors)\n`;
    }
    if (report.severityBreakdown.medium > 0) {
      md += `- 🟡 Review ${report.severityBreakdown.medium} medium severity bugs (code quality issues)\n`;
    }
    if (report.severityBreakdown.low > 0) {
      md += `- ⚪ Consider ${report.severityBreakdown.low} low severity improvements (best practices)\n`;
    }
  }
  
  return md;
}

/**
 * Format as CTS Plan for Shrimp task integration
 */
function formatCTSPlan(report: BugScanReport): string {
  // Group bugs by file for task creation
  const tasks = [];
  
  for (const fileReport of report.byFile) {
    // Only create tasks for files with high/critical bugs
    const priorityBugs = fileReport.bugs.filter(
      b => b.severity === 'critical' || b.severity === 'high'
    );
    
    if (priorityBugs.length === 0) continue;
    
    const task = {
      hopId: `bugfix-${sanitizeFilename(fileReport.file)}`,
      name: `Fix Bugs in ${getFilename(fileReport.file)}`,
      description: `Address ${priorityBugs.length} ${priorityBugs.length === 1 ? 'bug' : 'bugs'} found by Bughunter scan`,
      estimatedLOC: priorityBugs.length * 5, // Estimate 5 LOC per bug fix
      deliverables: [
        `All critical and high severity bugs resolved in ${getFilename(fileReport.file)}`,
        'Code passes Bughunter re-scan with 0 critical/high bugs',
      ],
      acceptanceCriteria: priorityBugs.map(bug => 
        `Line ${bug.line}: ${bug.name} - ${bug.message}`
      ),
      technicalNotes: generateTechnicalNotes(priorityBugs),
      dependencies: [],
    };
    
    tasks.push(task);
  }
  
  const plan = {
    planName: 'Bughunter Remediation',
    planDescription: `Fix ${report.totalBugs} bugs found in project scan`,
    totalEstimatedLOC: tasks.reduce((sum, t) => sum + t.estimatedLOC, 0),
    hops: tasks,
    metadata: {
      generatedBy: 'CTS_Bughunter',
      scanDate: new Date().toISOString(),
      qualityScore: report.overallScore,
      totalBugs: report.totalBugs,
    },
  };
  
  return JSON.stringify(plan, null, 2);
}

/**
 * Get emoji for quality score
 */
function getScoreEmoji(score: number): string {
  if (score >= 95) return '🌟';
  if (score >= 85) return '✅';
  if (score >= 70) return '⚠️';
  if (score >= 50) return '🔴';
  return '💀';
}

/**
 * Get emoji for severity level
 */
function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '⚪';
    default: return '❓';
  }
}

/**
 * Sanitize filename for use in hop ID
 */
function sanitizeFilename(filePath: string): string {
  return filePath
    .replace(/\//g, '-')
    .replace(/\\/g, '-')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-]/g, '_')
    .toLowerCase();
}

/**
 * Get filename from path
 */
function getFilename(filePath: string): string {
  return filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
}

/**
 * Generate technical notes for bug fixes
 */
function generateTechnicalNotes(bugs: BugMatch[]): string {
  let notes = `## Bug Fixes Required\n\n`;
  
  bugs.forEach((bug, index) => {
    notes += `${index + 1}. **${bug.name}** (Line ${bug.line})\n`;
    notes += `   - Issue: ${bug.message}\n`;
    if (bug.suggestion) {
      notes += `   - Fix: ${bug.suggestion}\n`;
    }
    notes += `\n`;
  });
  
  return notes;
}
