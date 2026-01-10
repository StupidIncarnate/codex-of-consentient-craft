/**
 * PURPOSE: E2E tests for dungeonmaster CLI binary
 *
 * USAGE:
 * npm test -- dungeonmaster.e2e.test.ts
 */

import { spawn } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const BIN_PATH = resolve(__dirname, '../dist/bin/dungeonmaster.mjs');
const TIMEOUT_MS = 5000;

describe('dungeonmaster binary', () => {
  describe('file structure', () => {
    it('VALID: {} => bin file exists', () => {
      expect(existsSync(BIN_PATH)).toBe(true);
    });

    it('VALID: {} => bin file is executable', () => {
      const stats = statSync(BIN_PATH);
      // Check if user execute bit is set (0o100)
      const isExecutable = (stats.mode & 0o100) !== 0;

      expect(isExecutable).toBe(true);
    });

    it('VALID: {} => bin file has shebang', async () => {
      const { readFile } = await import('node:fs/promises');
      const content = await readFile(BIN_PATH, 'utf-8');

      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });
  });

  describe('process execution', () => {
    it(
      'VALID: {non-TTY} => exits with raw mode error in non-TTY environment',
      (done) => {
        const child = spawn('node', [BIN_PATH], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, FORCE_COLOR: '0' },
        });

        let stderr = '';

        child.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        child.on('exit', (code) => {
          // In non-TTY environment, ink exits with raw mode error - this is expected
          expect(code).toBe(1);
          expect(stderr).toMatch(/Raw mode is not supported/u);

          done();
        });

        child.on('error', (err) => {
          done(err);
        });
      },
      TIMEOUT_MS,
    );

    it('VALID: {} => loads module without syntax errors', async () => {
      // Verify the module can be imported without throwing
      const modulePromise = import(BIN_PATH);

      // The module will try to run but fail on raw mode - we just want to verify no syntax errors
      await expect(modulePromise).resolves.toBeDefined();
    });
  });
});
