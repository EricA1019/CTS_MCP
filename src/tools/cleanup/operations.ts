/**
 * Cleanup File Operations
 * 
 * Atomic file operations with rollback support:
 * - Two-phase commit (move to trash, then commit/rollback)
 * - Operation logging for audit trail
 * - Safe deletion with recovery capability
 */

import { renameSync, mkdirSync, rmSync, readdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname, basename, relative } from 'path';

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

export class FileOperations {
  private trashDir: string;
  private operations: Operation[] = [];
  private dryRun: boolean;

  constructor(trashDir: string, dryRun: boolean = false) {
    this.trashDir = trashDir;
    this.dryRun = dryRun;
  }

  /**
   * Delete file by moving to trash (recoverable)
   */
  async deleteFile(filePath: string): Promise<void> {
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
  async moveFile(from: string, to: string): Promise<void> {
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
  async rollback(): Promise<void> {
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
      } else if (op.type === 'move') {
        // Move back to original location
        await rename(op.to, op.from);
      }
    }

    this.operations = [];
  }

  /**
   * Commit operations (permanently delete trash)
   */
  async commit(): Promise<void> {
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
  getLog(): OperationLog {
    return {
      operations: this.operations,
      totalFiles: this.operations.length,
      totalBytes: 0, // Would need fs.stat for actual sizes
    };
  }

  /**
   * Clear operation log without committing
   */
  clearLog(): void {
    this.operations = [];
  }

  /**
   * List files in trash directory
   */
  async listTrash(): Promise<string[]> {
    if (!existsSync(this.trashDir)) {
      return [];
    }

    const files = await readdir(this.trashDir);
    return files.map((file) => join(this.trashDir, file));
  }

  /**
   * Restore specific file from trash
   */
  async restoreFile(fileName: string, originalPath: string): Promise<void> {
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
  getOperationCount(): number {
    return this.operations.length;
  }

  /**
   * Check if dry-run mode
   */
  isDryRun(): boolean {
    return this.dryRun;
  }
}
