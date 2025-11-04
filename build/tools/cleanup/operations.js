/**
 * Cleanup File Operations
 *
 * Atomic file operations with rollback support:
 * - Two-phase commit (move to trash, then commit/rollback)
 * - Operation logging for audit trail
 * - Safe deletion with recovery capability
 */
import { renameSync, mkdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
export class FileOperations {
    trashDir;
    operations = [];
    dryRun;
    constructor(trashDir, dryRun = false) {
        this.trashDir = trashDir;
        this.dryRun = dryRun;
    }
    /**
     * Delete file by moving to trash (recoverable)
     */
    async deleteFile(filePath) {
        if (this.dryRun) {
            console.log(`[DRY RUN] Would delete: ${filePath}`);
            this.operations.push({
                type: 'delete',
                from: filePath,
                to: join(this.trashDir, basename(filePath)),
                timestamp: Date.now(),
            });
            return;
        }
        // Ensure trash directory exists
        await mkdir(this.trashDir, { recursive: true });
        // Generate unique trash path (append timestamp if file exists)
        let trashPath = join(this.trashDir, basename(filePath));
        if (existsSync(trashPath)) {
            const ext = basename(filePath);
            const timestamp = Date.now();
            trashPath = join(this.trashDir, `${ext}.${timestamp}`);
        }
        // Move to trash (atomic operation)
        await rename(filePath, trashPath);
        // Record operation for rollback
        this.operations.push({
            type: 'delete',
            from: filePath,
            to: trashPath,
            timestamp: Date.now(),
        });
    }
    /**
     * Move file to new location
     */
    async moveFile(from, to) {
        if (this.dryRun) {
            console.log(`[DRY RUN] Would move: ${from} → ${to}`);
            this.operations.push({
                type: 'move',
                from,
                to,
                timestamp: Date.now(),
            });
            return;
        }
        // Ensure target directory exists
        await mkdir(dirname(to), { recursive: true });
        // Move file
        await rename(from, to);
        // Record operation
        this.operations.push({
            type: 'move',
            from,
            to,
            timestamp: Date.now(),
        });
    }
    /**
     * Rollback all operations (restore from trash)
     */
    async rollback() {
        if (this.dryRun) {
            console.log('[DRY RUN] Would rollback all operations');
            return;
        }
        // Reverse operations in LIFO order
        for (const op of this.operations.slice().reverse()) {
            if (op.type === 'delete') {
                // Restore from trash
                await mkdir(dirname(op.from), { recursive: true });
                await rename(op.to, op.from);
            }
            else if (op.type === 'move') {
                // Move back to original location
                await rename(op.to, op.from);
            }
        }
        this.operations = [];
    }
    /**
     * Commit operations (permanently delete trash)
     */
    async commit() {
        if (this.dryRun) {
            console.log('[DRY RUN] Would commit and delete trash');
            return;
        }
        // Permanently delete trash directory
        if (existsSync(this.trashDir)) {
            await rm(this.trashDir, { recursive: true, force: true });
        }
        this.operations = [];
    }
    /**
     * Get operation log
     */
    getLog() {
        return {
            operations: this.operations,
            totalFiles: this.operations.length,
            totalBytes: 0, // Would need fs.stat for actual sizes
        };
    }
    /**
     * Clear operation log without committing
     */
    clearLog() {
        this.operations = [];
    }
    /**
     * List files in trash directory
     */
    async listTrash() {
        if (!existsSync(this.trashDir)) {
            return [];
        }
        const files = await readdir(this.trashDir);
        return files.map((file) => join(this.trashDir, file));
    }
    /**
     * Restore specific file from trash
     */
    async restoreFile(fileName, originalPath) {
        if (this.dryRun) {
            console.log(`[DRY RUN] Would restore: ${fileName} → ${originalPath}`);
            return;
        }
        const trashPath = join(this.trashDir, fileName);
        if (!existsSync(trashPath)) {
            throw new Error(`File not found in trash: ${fileName}`);
        }
        mkdirSync(dirname(originalPath), { recursive: true });
        renameSync(trashPath, originalPath);
    }
    /**
     * Get operation count
     */
    getOperationCount() {
        return this.operations.length;
    }
    /**
     * Check if dry-run mode
     */
    isDryRun() {
        return this.dryRun;
    }
}
//# sourceMappingURL=operations.js.map