/**
 * Bughunter Scanner
 *
 * Scans Godot projects for potential bugs using heuristic pattern matching.
 * Reuses ProjectScanner infrastructure for efficient file traversal.
 */
import { readFileSync } from 'fs';
import { ProjectScanner } from '../../artifacts/scanner/index.js';
import { TreeSitterBridge } from '../../artifacts/parsers/tree_sitter_bridge.js';
import { applyHeuristics, calculateSeverityScore } from './heuristics.js';
/**
 * Group bugs by file
 */
function groupByFile(bugs) {
    const fileMap = new Map();
    for (const bug of bugs) {
        if (bug.file) {
            if (!fileMap.has(bug.file)) {
                fileMap.set(bug.file, []);
            }
            fileMap.get(bug.file).push(bug);
        }
    }
    const reports = [];
    for (const [file, fileBugs] of fileMap.entries()) {
        const breakdown = {
            low: fileBugs.filter(b => b.severity === 'low').length,
            medium: fileBugs.filter(b => b.severity === 'medium').length,
            high: fileBugs.filter(b => b.severity === 'high').length,
            critical: fileBugs.filter(b => b.severity === 'critical').length,
        };
        reports.push({
            file,
            bugCount: fileBugs.length,
            bugs: fileBugs,
            severityBreakdown: breakdown,
        });
    }
    // Sort by bug count descending
    reports.sort((a, b) => b.bugCount - a.bugCount);
    return reports;
}
/**
 * Scan project for potential bugs using heuristic analysis
 *
 * @param projectPath - Path to Godot project root
 * @param options - Scan options
 * @returns Bug scan report
 */
export async function scanForBugs(projectPath, options = {}) {
    const startTime = Date.now();
    console.error('[Bughunter] Initializing scanner...');
    // Initialize tree-sitter bridge
    const bridge = new TreeSitterBridge();
    await bridge.init();
    // Use ProjectScanner for efficient file traversal
    const scanner = new ProjectScanner(bridge);
    console.error(`[Bughunter] Scanning project: ${projectPath}`);
    // Scan all GDScript files
    const scanPattern = options.filePattern || '**/*.gd';
    const files = await scanner.scanProject(projectPath);
    console.error(`[Bughunter] Found ${files.length} files to analyze`);
    // Limit files if specified
    const filesToScan = options.maxFiles ? files.slice(0, options.maxFiles) : files;
    const allBugs = [];
    let filesProcessed = 0;
    // Process each file
    for (const fileInfo of filesToScan) {
        try {
            const source = readFileSync(fileInfo.filePath, 'utf-8');
            // Parse using tree-sitter
            const tree = bridge.parseString(source);
            // Apply heuristics to detect bugs
            const bugs = applyHeuristics(tree, source);
            // Tag bugs with file path
            for (const bug of bugs) {
                bug.file = fileInfo.filePath;
                allBugs.push(bug);
            }
            filesProcessed++;
            if (filesProcessed % 10 === 0) {
                console.error(`[Bughunter] Processed ${filesProcessed}/${filesToScan.length} files...`);
            }
        }
        catch (error) {
            console.error(`[Bughunter] Error processing ${fileInfo.filePath}:`, error);
            // Continue with other files
        }
    }
    console.error(`[Bughunter] Analysis complete: ${allBugs.length} potential bugs found`);
    // Calculate severity breakdown
    const severityBreakdown = {
        low: allBugs.filter(b => b.severity === 'low').length,
        medium: allBugs.filter(b => b.severity === 'medium').length,
        high: allBugs.filter(b => b.severity === 'high').length,
        critical: allBugs.filter(b => b.severity === 'critical').length,
    };
    // Group bugs by file
    const byFile = groupByFile(allBugs);
    // Calculate overall quality score
    const overallScore = calculateSeverityScore(allBugs);
    const scanTimeMs = Date.now() - startTime;
    return {
        projectPath,
        totalFiles: filesProcessed,
        totalBugs: allBugs.length,
        overallScore,
        severityBreakdown,
        byFile,
        scanTimeMs,
    };
}
/**
 * Get top N most problematic files
 */
export function getTopBuggyFiles(report, topN = 10) {
    return report.byFile.slice(0, topN);
}
/**
 * Filter bugs by severity
 */
export function filterBySeverity(report, minSeverity) {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const minLevel = severityLevels.indexOf(minSeverity);
    const allBugs = report.byFile.flatMap(f => f.bugs);
    return allBugs.filter(bug => {
        const bugLevel = severityLevels.indexOf(bug.severity);
        return bugLevel >= minLevel;
    });
}
//# sourceMappingURL=scanner.js.map