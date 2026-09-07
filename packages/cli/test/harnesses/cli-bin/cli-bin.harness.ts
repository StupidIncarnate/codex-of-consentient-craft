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
  fileContentsContract,
  FilePathStub,
  ExitCodeStub,
  type FileContents,
} from '@dungeonmaster/shared/contracts';

// binExists/binIsExecutable/readBinContent back the "file structure" assertions in
// cli-entry.integration.test.ts, which must keep grading the built esbuild bundle — see that
// file's comment. requireWithoutAutorun also stays on this path deliberately: it proves the
// BUNDLE's top-level `require.main === module` guard survives esbuild's wrapping (cli-entry.ts's
// own comment notes the bundle keeps real Node CommonJS semantics at the top level), which only
// the real bundle can answer — running the un-bundled source would not exercise that risk.
const BIN_PATH = FilePathStub({ value: resolve(__dirname, '../../../dist/bin/dungeonmaster.js') });
// runInit exercises real CLI behaviour, so it spawns the source entry directly under tsx instead
// of the built bundle. `--conditions=source` resolves every @dungeonmaster/* import to TS source
// (see jest.config.base.js's `customExportConditions`), matching how `npm run dev` runs source.
const SOURCE_ENTRY_PATH = FilePathStub({ value: resolve(__dirname, '../../../bin/cli-entry.ts') });
const SPAWN_TIMEOUT_MS = 5000;
// Probe-only port + timeout for `requireWithoutAutorun`. The port is a neutralizer: if the
// import-time autorun guard ever regresses, the booted server lands here instead of the
// configured port (4800), so the probe can't collide with a running instance.
const IMPORT_PROBE_PORT = 59_999;
const IMPORT_PROBE_TIMEOUT_MS = 3000;

export const cliBinHarness = (): {
  binPath: ReturnType<typeof FilePathStub>;
  binExists: () => boolean;
  binIsExecutable: () => boolean;
  readBinContent: () => FileContents;
  runInit: () => Promise<{ exitCode: ReturnType<typeof ExitCodeStub> }>;
  requireWithoutAutorun: () => Promise<{ exitedCleanly: boolean; servedLineSeen: boolean }>;
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
        const child = spawn('npx', ['tsx', '--conditions=source', SOURCE_ENTRY_PATH, 'init'], {
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

  // Requires the built bin in a child process to prove that importing it is side-effect-free:
  // a valid module loads (no syntax error) and exits cleanly, WITHOUT booting the HTTP server
  // or opening a browser. A child process is used (not in-process import) so a regression that
  // re-enables the import-time serve can't leave a server/browser in the jest process.
  requireWithoutAutorun: async (): Promise<{ exitedCleanly: boolean; servedLineSeen: boolean }> =>
    new Promise((promiseResolve) => {
      const tempDir = mkdtempSync(join(tmpdir(), 'dungeonmaster-import-'));
      const child = spawn('node', ['-e', `require(${JSON.stringify(String(BIN_PATH))})`], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Ward's own integration-check spawn sets NODE_OPTIONS=--conditions=source on THIS
          // jest process (check-run-integration-broker.ts) so its transform glue resolves
          // @dungeonmaster/* to source. That var inherits through `...process.env` into every
          // spawned child by default. This child requires the real BUNDLE, whose externalized
          // `@dungeonmaster/*` requires would then follow shared's own "source" export condition
          // straight to a .ts file plain Node can't parse — measured: ERR_MODULE_NOT_FOUND,
          // read back here as `exitedCleanly: false`. Clear it so this test measures what an
          // actual consumer requiring the shipped bundle gets, not ward's own resolution mode.
          NODE_OPTIONS: '',
          FORCE_COLOR: '0',
          BROWSER: '/bin/true',
          DUNGEONMASTER_PORT: String(IMPORT_PROBE_PORT),
        },
        cwd: tempDir,
      });

      let captured = '';
      child.stdout.on('data', (chunk) => {
        captured += String(chunk);
      });

      const settle = ({ exitedCleanly }: { exitedCleanly: boolean }): void => {
        rmSync(tempDir, { recursive: true, force: true });
        promiseResolve({
          exitedCleanly,
          servedLineSeen: captured.includes('Dungeonmaster server running at'),
        });
      };

      const timer = setTimeout(() => {
        child.kill();
        settle({ exitedCleanly: false });
      }, IMPORT_PROBE_TIMEOUT_MS);

      child.on('exit', (exitCode) => {
        clearTimeout(timer);
        settle({ exitedCleanly: exitCode === 0 });
      });

      child.on('error', () => {
        clearTimeout(timer);
        settle({ exitedCleanly: false });
      });
    }),
});
