/**
 * PURPOSE: E2E tests for dungeonmaster CLI binary
 *
 * USAGE:
 * npm test -- dungeonmaster.e2e.test.ts
 */

import { spawn } from 'node:child_process';
import { accessSync, constants, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { FilePathStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

const BIN_PATH = resolve(__dirname, '../dist/bin/dungeonmaster.js');
const TIMEOUT_MS = 5000;

const isExecutable = ({ filePath }: { filePath: string }): boolean => {
  try {
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

const createTempDir = (): ReturnType<typeof FilePathStub> =>
  FilePathStub({ value: mkdtempSync(join(tmpdir(), 'dungeonmaster-e2e-')) });

describe('dungeonmaster binary', () => {
  describe('file structure', () => {
    it('VALID: {} => bin file exists', () => {
      expect(existsSync(BIN_PATH)).toBe(true);
    });

    it('VALID: {} => bin file is executable', () => {
      expect(isExecutable({ filePath: BIN_PATH })).toBe(true);
    });

    it('VALID: {} => bin file has shebang', async () => {
      const { readFile } = await import('node:fs/promises');
      const content = await readFile(BIN_PATH, 'utf-8');

      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });
  });

  describe('process execution', () => {
    it(
      'VALID: {non-TTY, init} => runs init command and exits successfully',
      async () => {
        const tempDir = createTempDir();

        let exitCode: ReturnType<typeof ExitCodeStub> | null = null;

        await new Promise<void>((promiseResolve, promiseReject) => {
          const child = spawn('node', [BIN_PATH, 'init'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '0' },
            cwd: tempDir,
          });

          child.stdout.on('data', (_data: Buffer) => {
            // stdout consumed but not asserted in this test
          });

          child.on('exit', (code) => {
            exitCode = ExitCodeStub({ value: code! });
            promiseResolve();
          });

          child.on('error', (err) => {
            promiseReject(err);
          });
        });

        rmSync(tempDir, { recursive: true, force: true });

        // Init command should complete without error (exit 0)
        expect(exitCode).toBe(ExitCodeStub({ value: 0 }));
      },
      TIMEOUT_MS,
    );

    it('VALID: {} => loads module without syntax errors', async () => {
      const mod = await import(BIN_PATH);

      expect(mod.__esModule).toBe(true);
    });
  });
});
