/**
 * Cleanup File Operations
 *
 * Atomic file operations with rollback support:
 * - Two-phase commit (move to trash, then commit/rollback)
 * - Operation logging for audit trail
 * - Safe deletion with recovery capability
 */
export interface Operation {
    type: 'delete' | 'move';
    from: string;
    to: string;
    timestamp: number;
}
export interface OperationLog {
    operations: Operation[];
    totalFiles: number;
    totalBytes: number;
}
export declare class FileOperations {
    private trashDir;
    private operations;
    private dryRun;
    constructor(trashDir: string, dryRun?: boolean);
    /**
     * Delete file by moving to trash (recoverable)
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * Move file to new location
     */
    moveFile(from: string, to: string): Promise<void>;
    /**
     * Rollback all operations (restore from trash)
     */
    rollback(): Promise<void>;
    /**
     * Commit operations (permanently delete trash)
     */
    commit(): Promise<void>;
    /**
     * Get operation log
     */
    getLog(): OperationLog;
    /**
     * Clear operation log without committing
     */
    clearLog(): void;
    /**
     * List files in trash directory
     */
    listTrash(): Promise<string[]>;
    /**
     * Restore specific file from trash
     */
    restoreFile(fileName: string, originalPath: string): Promise<void>;
    /**
     * Get operation count
     */
    getOperationCount(): number;
    /**
     * Check if dry-run mode
     */
    isDryRun(): boolean;
}
//# sourceMappingURL=operations.d.ts.map