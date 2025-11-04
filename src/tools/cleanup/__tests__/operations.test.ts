/**
 * File Operations Tests
 * 
 * Tests for atomic file operations, rollback, and dry-run mode.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileOperations } from '../operations';
import { mkdir, writeFile, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TEST_DIR = '/tmp/cleanup-ops-test';
const TRASH_DIR = join(TEST_DIR, '.cleanup_trash');

describe('Cleanup File Operations', () => {
  beforeEach(async () => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up after tests
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Delete Operations', () => {
    it('should move file to trash', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const testFile = join(TEST_DIR, 'test.txt');
      await writeFile(testFile, 'test content');

      await ops.deleteFile(testFile);

      expect(existsSync(testFile)).toBe(false);
      const trashFiles = await ops.listTrash();
      expect(trashFiles.length).toBe(1);
    });

    it('should record operation in log', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const testFile = join(TEST_DIR, 'test.txt');
      await writeFile(testFile, 'test content');

      await ops.deleteFile(testFile);

      const log = ops.getLog();
      expect(log.operations.length).toBe(1);
      expect(log.operations[0].type).toBe('delete');
      expect(log.operations[0].from).toBe(testFile);
    });

    it('should handle duplicate filenames in trash', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const file1 = join(TEST_DIR, 'test.txt');
      const file2 = join(TEST_DIR, 'subdir', 'test.txt');

      await writeFile(file1, 'content1');
      await mkdir(join(TEST_DIR, 'subdir'), { recursive: true });
      await writeFile(file2, 'content2');

      await ops.deleteFile(file1);
      await ops.deleteFile(file2);

      const trashFiles = await ops.listTrash();
      expect(trashFiles.length).toBe(2);
    });
  });

  describe('Move Operations', () => {
    it('should move file to new location', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const from = join(TEST_DIR, 'from.txt');
      const to = join(TEST_DIR, 'subdir', 'to.txt');
      await writeFile(from, 'test content');

      await ops.moveFile(from, to);

      expect(existsSync(from)).toBe(false);
      expect(existsSync(to)).toBe(true);
      const content = await readFile(to, 'utf-8');
      expect(content).toBe('test content');
    });

    it('should create target directory if missing', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const from = join(TEST_DIR, 'from.txt');
      const to = join(TEST_DIR, 'deep', 'nested', 'dir', 'to.txt');
      await writeFile(from, 'test content');

      await ops.moveFile(from, to);

      expect(existsSync(to)).toBe(true);
    });
  });

  describe('Rollback', () => {
    it('should restore deleted files', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const testFile = join(TEST_DIR, 'test.txt');
      await writeFile(testFile, 'original content');

      await ops.deleteFile(testFile);
      expect(existsSync(testFile)).toBe(false);

      await ops.rollback();
      expect(existsSync(testFile)).toBe(true);
      const content = await readFile(testFile, 'utf-8');
      expect(content).toBe('original content');
    });

    it('should restore moved files', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const from = join(TEST_DIR, 'from.txt');
      const to = join(TEST_DIR, 'to.txt');
      await writeFile(from, 'content');

      await ops.moveFile(from, to);
      expect(existsSync(from)).toBe(false);
      expect(existsSync(to)).toBe(true);

      await ops.rollback();
      expect(existsSync(from)).toBe(true);
      expect(existsSync(to)).toBe(false);
    });

    it('should rollback multiple operations in reverse order', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const file1 = join(TEST_DIR, 'file1.txt');
      const file2 = join(TEST_DIR, 'file2.txt');
      await writeFile(file1, 'content1');
      await writeFile(file2, 'content2');

      await ops.deleteFile(file1);
      await ops.deleteFile(file2);

      await ops.rollback();

      expect(existsSync(file1)).toBe(true);
      expect(existsSync(file2)).toBe(true);
    });

    it('should clear operation log after rollback', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const testFile = join(TEST_DIR, 'test.txt');
      await writeFile(testFile, 'content');

      await ops.deleteFile(testFile);
      expect(ops.getOperationCount()).toBe(1);

      await ops.rollback();
      expect(ops.getOperationCount()).toBe(0);
    });
  });

  describe('Commit', () => {
    it('should permanently delete trash', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const testFile = join(TEST_DIR, 'test.txt');
      await writeFile(testFile, 'content');

      await ops.deleteFile(testFile);
      expect(existsSync(TRASH_DIR)).toBe(true);

      await ops.commit();
      expect(existsSync(TRASH_DIR)).toBe(false);
    });

    it('should clear operation log after commit', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const testFile = join(TEST_DIR, 'test.txt');
      await writeFile(testFile, 'content');

      await ops.deleteFile(testFile);
      await ops.commit();

      expect(ops.getOperationCount()).toBe(0);
    });
  });

  describe('Dry-Run Mode', () => {
    it('should not modify files in dry-run mode', async () => {
      const ops = new FileOperations(TRASH_DIR, true);
      const testFile = join(TEST_DIR, 'test.txt');
      await writeFile(testFile, 'content');

      await ops.deleteFile(testFile);

      expect(existsSync(testFile)).toBe(true);
      expect(existsSync(TRASH_DIR)).toBe(false);
    });

    it('should still record operations in dry-run', async () => {
      const ops = new FileOperations(TRASH_DIR, true);
      const testFile = join(TEST_DIR, 'test.txt');
      await writeFile(testFile, 'content');

      await ops.deleteFile(testFile);

      const log = ops.getLog();
      expect(log.operations.length).toBe(1);
    });

    it('should indicate dry-run mode', () => {
      const ops = new FileOperations(TRASH_DIR, true);
      expect(ops.isDryRun()).toBe(true);

      const opsLive = new FileOperations(TRASH_DIR, false);
      expect(opsLive.isDryRun()).toBe(false);
    });
  });

  describe('Trash Management', () => {
    it('should list files in trash', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const file1 = join(TEST_DIR, 'file1.txt');
      const file2 = join(TEST_DIR, 'file2.txt');
      await writeFile(file1, 'content1');
      await writeFile(file2, 'content2');

      await ops.deleteFile(file1);
      await ops.deleteFile(file2);

      const trashFiles = await ops.listTrash();
      expect(trashFiles.length).toBe(2);
    });

    it('should restore specific file from trash', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const original = join(TEST_DIR, 'original.txt');
      await writeFile(original, 'content');

      await ops.deleteFile(original);
      const trashFiles = await ops.listTrash();
      const trashFileName = trashFiles[0].split('/').pop()!;

      await ops.restoreFile(trashFileName, original);

      expect(existsSync(original)).toBe(true);
      const content = await readFile(original, 'utf-8');
      expect(content).toBe('content');
    });

    it('should handle empty trash', async () => {
      const ops = new FileOperations(TRASH_DIR, false);
      const trashFiles = await ops.listTrash();
      expect(trashFiles).toEqual([]);
    });
  });
});
