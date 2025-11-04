/**
 * Cleanup Strategies
 *
 * Analysis strategies for detecting cleanup opportunities:
 * - Dead code detection (unused imports, unreferenced files)
 * - Duplicate file detection (hash-based comparison)
 */
import { createHash } from 'crypto';
import { statSync } from 'fs';
import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
/**
 * Find unused imports in GDScript source code
 */
function findUnusedImports(source) {
    const unusedImports = [];
    const lines = source.split('\n');
    // Pattern: const/var NAME = preload("...")
    const importPattern = /^(?:const|var)\s+(\w+)\s*=\s*(?:preload|load)\(/;
    for (const line of lines) {
        const match = line.match(importPattern);
        if (match) {
            const varName = match[1];
            // Check if variable is used elsewhere in the code
            const usageCount = source.split(varName).length - 1;
            if (usageCount === 1) {
                // Only appears once (in the import line itself)
                unusedImports.push(varName);
            }
        }
    }
    return unusedImports;
}
/**
 * Dead code detection strategy
 */
export const deadCodeStrategy = {
    name: 'dead_code',
    analyze: async (projectPath, exclusions) => {
        const actions = [];
        // Find all .gd files
        const gdFiles = await findGDScriptFiles(projectPath, exclusions);
        for (const file of gdFiles) {
            const filePath = join(projectPath, file);
            try {
                const source = await readFile(filePath, 'utf-8');
                const unusedImports = findUnusedImports(source);
                if (unusedImports.length > 0) {
                    actions.push({
                        type: 'remove_unused_imports',
                        file,
                        details: unusedImports,
                        impact: 'low',
                    });
                }
            }
            catch (error) {
                // Skip files that can't be read
                continue;
            }
        }
        return actions;
    },
};
/**
 * Duplicate file detection strategy
 */
export const duplicateStrategy = {
    name: 'duplicates',
    analyze: async (projectPath, exclusions) => {
        const actions = [];
        const hashMap = new Map();
        // Find all files
        const allFiles = await findAllFiles(projectPath, exclusions);
        // Hash all files
        for (const file of allFiles) {
            const filePath = join(projectPath, file);
            try {
                const content = await readFile(filePath);
                const hash = createHash('sha256').update(content).digest('hex');
                if (!hashMap.has(hash)) {
                    hashMap.set(hash, []);
                }
                hashMap.get(hash).push(file);
            }
            catch (error) {
                // Skip files that can't be read
                continue;
            }
        }
        // Find duplicates (more than one file with same hash)
        for (const [hash, paths] of hashMap) {
            if (paths.length > 1) {
                // Calculate bytes that could be freed
                const firstFile = join(projectPath, paths[0]);
                let fileSize = 0;
                try {
                    const fileStats = statSync(firstFile);
                    fileSize = fileStats.size;
                }
                catch {
                    fileSize = 0;
                }
                const bytesFreed = fileSize * (paths.length - 1);
                actions.push({
                    type: 'duplicate_files',
                    files: paths,
                    impact: 'medium',
                    bytesFreed,
                });
            }
        }
        return actions;
    },
};
/**
 * Recursively find all GDScript files
 */
async function findGDScriptFiles(dir, exclusions) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(process.cwd(), fullPath);
        // Skip excluded paths
        if (shouldExclude(relativePath, exclusions)) {
            continue;
        }
        if (entry.isDirectory()) {
            const subFiles = await findGDScriptFiles(fullPath, exclusions);
            files.push(...subFiles);
        }
        else if (entry.name.endsWith('.gd')) {
            files.push(relative(dir, fullPath));
        }
    }
    return files;
}
/**
 * Recursively find all files (for duplicate detection)
 */
async function findAllFiles(dir, exclusions) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(process.cwd(), fullPath);
        // Skip excluded paths
        if (shouldExclude(relativePath, exclusions)) {
            continue;
        }
        if (entry.isDirectory()) {
            const subFiles = await findAllFiles(fullPath, exclusions);
            files.push(...subFiles);
        }
        else {
            files.push(relative(dir, fullPath));
        }
    }
    return files;
}
/**
 * Check if path should be excluded
 */
function shouldExclude(path, exclusions) {
    // Always exclude hidden directories and common build artifacts
    const alwaysExclude = ['.godot', '.git', 'node_modules', '.cleanup_trash'];
    if (alwaysExclude.some((dir) => path.includes(dir))) {
        return true;
    }
    // Check custom exclusions (simple string matching for now)
    return exclusions.some((pattern) => path.includes(pattern));
}
/**
 * Get all available strategies
 */
export const STRATEGIES = {
    dead_code: deadCodeStrategy,
    duplicates: duplicateStrategy,
};
//# sourceMappingURL=strategies.js.map