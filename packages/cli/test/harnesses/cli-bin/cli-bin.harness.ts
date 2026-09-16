/**
 * PURPOSE: Resolves the built dungeonmaster bin, checks its file structure, and spawns it for cli-entry integration tests
 *
 * USAGE:
 * const harness = cliBinHarness();
 * expect(harness.binExists()).toBe(true);
 * const { exitCode, stdout, stderr } = await harness.runCommand({ args: ['siegelense', 'status', '--help'] });
 * const { exitCode } = await harness.runInit();
 * expect(exitCode).toBe(ExitCodeStub({ value: 0 }));
 */
import { spawn } from 'node:child_process';
import { accessSync, constants, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  errorMessageContract,
  fileContentsContract,
  FilePathStub,
  ExitCodeStub,
  type ErrorMessage,
  type FileContents,
} from '@dungeonmaster/shared/contracts';

// binExists/binIsExecutable/readBinContent back the "file structure" assertions in
// cli-entry.integration.test.ts, which must keep grading the built esbuild bundle — see that
// file's comment. requireWithoutAutorun also stays on this path deliberately: it proves the
// BUNDLE's top-level `require.main === module` guard survives esbuild's wrapping (cli-entry.ts's
// own comment notes the bundle keeps real Node CommonJS semantics at the top level), which only
// the real bundle can answer — running the un-bundled source would not exercise that risk.
const BIN_PATH = FilePathStub({ value: resolve(__dirname, '../../../dist/bin/dungeonmaster.js') });
// runCommand exercises real CLI behaviour, so it spawns the source entry directly under tsx
// instead of the built bundle. `--conditions=source` resolves every @dungeonmaster/* import to TS
// source (see jest.config.base.js's `customExportConditions`), matching how `npm run dev` runs
// source.
const SOURCE_ENTRY_PATH = FilePathStub({ value: resolve(__dirname, '../../../bin/cli-entry.ts') });
// Measured against a real `siegelense <call> --help` spawn: 3.7s-4.7s, dominated by tsx compiling
// the CLI's module graph and dynamically importing @dungeonmaster/siegelense. 20s leaves headroom
// for a loaded machine running several of these spawns at once — callers fire them off in
// parallel from one beforeAll rather than paying that cost once per `it`.
const RUN_COMMAND_TIMEOUT_MS = 20_000;
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
  runCommand: ({ args }: { args: readonly string[] }) => Promise<{
    exitCode: ReturnType<typeof ExitCodeStub>;
    stdout: ErrorMessage;
    stderr: ErrorMessage;
  }>;
  runInit: () => Promise<{ exitCode: ReturnType<typeof ExitCodeStub> }>;
  requireWithoutAutorun: () => Promise<{ exitedCleanly: boolean; servedLineSeen: boolean }>;
} => {
  // Spawns bin/cli-entry.ts under tsx with the given argv, capturing BOTH stdio streams (never
  // discarding either — every assertion above the CLI gate depends on reading them back exactly)
  // and a throwaway DUNGEONMASTER_HOME, so a siegelense call under test reads and writes its own
  // registry rather than the developer's real `~/.dungeonmaster`.
  const runCommand = async ({
    args,
  }: {
    args: readonly string[];
  }): Promise<{
    exitCode: ReturnType<typeof ExitCodeStub>;
    stdout: ErrorMessage;
    stderr: ErrorMessage;
  }> => {
    const tempDir = mkdtempSync(join(tmpdir(), 'dungeonmaster-e2e-'));
    const dungeonmasterHome = mkdtempSync(join(tmpdir(), 'dungeonmaster-e2e-home-'));

    const result = await new Promise<{
      exitCode: ReturnType<typeof ExitCodeStub>;
      stdout: ErrorMessage;
      stderr: ErrorMessage;
    }>((promiseResolve, promiseReject) => {
      const child = spawn('npx', ['tsx', '--conditions=source', SOURCE_ENTRY_PATH, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0', DUNGEONMASTER_HOME: dungeonmasterHome },
        cwd: tempDir,
      });

      let stdoutBuffer = '';
      let stderrBuffer = '';

      const timer = setTimeout(() => {
        child.kill();
        promiseReject(new Error(`cli-bin runCommand timed out on args: ${args.join(' ')}`));
      }, RUN_COMMAND_TIMEOUT_MS);

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBuffer += chunk.toString();
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderrBuffer += chunk.toString();
      });

      // `close`, not `exit` — a child's `exit` fires once the process ends, which is not the same
      // moment its stdio pipes finish draining. This harness's whole job is asserting the exact
      // bytes on those pipes, so it waits for the event Node fires once both are closed.
      child.on('close', (code) => {
        clearTimeout(timer);
        promiseResolve({
          exitCode: ExitCodeStub({ value: code ?? 1 }),
          stdout: errorMessageContract.parse(stdoutBuffer),
          stderr: errorMessageContract.parse(stderrBuffer),
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        promiseReject(err);
      });
    });

    rmSync(tempDir, { recursive: true, force: true });
    rmSync(dungeonmasterHome, { recursive: true, force: true });

    return result;
  };

  return {
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

    runCommand,

    runInit: async (): Promise<{ exitCode: ReturnType<typeof ExitCodeStub> }> => {
      const { exitCode } = await runCommand({ args: ['init'] });
      return { exitCode };
    },

    // Requires the built bin in a child process to prove that importing it is side-effect-free:
    // a valid module loads (no syntax error) and exits cleanly, WITHOUT booting the HTTP server
    // or opening a browser. A child process is used (not in-process import) so a regression that
    // re-enables the import-time serve can't leave a server/browser in the jest process.
    requireWithoutAutorun: async (): Promise<{
      exitedCleanly: boolean;
      servedLineSeen: boolean;
    }> =>
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
  };
};
