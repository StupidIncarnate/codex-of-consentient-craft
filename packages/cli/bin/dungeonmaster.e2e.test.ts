/**
 * PURPOSE: E2E tests for dungeonmaster CLI binary
 *
 * USAGE:
 * npm test -- dungeonmaster.e2e.test.ts
 */

import { spawn } from 'node:child_process';
import { accessSync, constants, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
        const result = await new Promise((promiseResolve, promiseReject) => {
          const child = spawn('node', [BIN_PATH, 'init'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '0' },
          });

          let stdoutOutput = '';

          child.stdout.on('data', (data: Buffer) => {
            stdoutOutput += data.toString();
          });

          child.on('exit', (exitCode) => {
            promiseResolve({ code: exitCode, stdout: stdoutOutput });
          });

          child.on('error', (err) => {
            promiseReject(err);
          });
        });

        // Extract properties from result using Reflect.get for type safety
        const code = Reflect.get(result as object, 'code');

        // Init command should complete without error (exit 0)
        expect(code).toBe(0);
      },
      TIMEOUT_MS,
    );

    it('VALID: {} => loads module without syntax errors', async () => {
      // Verify the module can be imported without throwing
      const modulePromise = import(BIN_PATH);

      await expect(modulePromise).resolves.toBeDefined();
    });
  });
});
