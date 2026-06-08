/**
 * PURPOSE: Resolves the built dungeonmaster bin, checks its file structure, and spawns it for cli-entry integration tests
 *
 * USAGE:
 * const harness = cliBinHarness();
 * expect(harness.binExists()).toBe(true);
 * const { exitCode } = await harness.runInit();
 * expect(exitCode).toBe(ExitCodeStub({ value: 0 }));
 */
import { spawn } from 'node:child_process';
import { accessSync, constants, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  filePathContract,
  fileContentsContract,
  FilePathStub,
  ExitCodeStub,
  type FileContents,
} from '@dungeonmaster/shared/contracts';

const BIN_PATH = FilePathStub({ value: resolve(__dirname, '../../../dist/bin/dungeonmaster.js') });
const SPAWN_TIMEOUT_MS = 5000;

export const cliBinHarness = (): {
  binPath: ReturnType<typeof FilePathStub>;
  binExists: () => boolean;
  binIsExecutable: () => boolean;
  readBinContent: () => FileContents;
  runInit: () => Promise<{ exitCode: ReturnType<typeof ExitCodeStub> }>;
  loadModule: () => Promise<{ isEsModule: boolean }>;
} => ({
  binPath: BIN_PATH,

  binExists: (): boolean => existsSync(BIN_PATH),

  binIsExecutable: (): boolean => {
    try {
      accessSync(BIN_PATH, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  },

  readBinContent: (): FileContents => fileContentsContract.parse(readFileSync(BIN_PATH, 'utf-8')),

  runInit: async (): Promise<{ exitCode: ReturnType<typeof ExitCodeStub> }> => {
    const tempDir = mkdtempSync(join(tmpdir(), 'dungeonmaster-e2e-'));

    const exitCode = await new Promise<ReturnType<typeof ExitCodeStub>>(
      (promiseResolve, promiseReject) => {
        const child = spawn('node', [BIN_PATH, 'init'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, FORCE_COLOR: '0' },
          cwd: tempDir,
        });

        const timer = setTimeout(() => {
          child.kill();
          promiseReject(new Error('cli-bin runInit timed out'));
        }, SPAWN_TIMEOUT_MS);

        child.stdout.on('data', () => {
          // stdout consumed but not asserted
        });

        child.on('exit', (code) => {
          clearTimeout(timer);
          promiseResolve(ExitCodeStub({ value: code ?? 1 }));
        });

        child.on('error', (err) => {
          clearTimeout(timer);
          promiseReject(err);
        });
      },
    );

    rmSync(tempDir, { recursive: true, force: true });

    return { exitCode };
  },

  loadModule: async (): Promise<{ isEsModule: boolean }> => {
    const mod: unknown = await import(filePathContract.parse(BIN_PATH));
    const isEsModule =
      typeof mod === 'object' &&
      mod !== null &&
      (mod as Record<PropertyKey, unknown>).__esModule === true;
    return { isEsModule };
  },
});
