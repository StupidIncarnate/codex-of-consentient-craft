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
import { spawnPiped } from '#gateway/node/child_process';
import { clearTimeout } from '#gateway/node/clearTimeout';
import {
  accessSync,
  constants,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from '#gateway/node/fs';
import { tmpdir } from '#gateway/node/os';
import { join, resolve } from '#gateway/node/path';
import { envSnapshot, execPath } from '#gateway/node/process';
import { setTimeout } from '#gateway/node/setTimeout';
import { tsxCliPath } from '#gateway/npm/tsx';

import {
  errorMessageContract,
  fileContentsContract,
  type ErrorMessage,
  type FileContents,
} from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts/exit-code/exit-code.stub';

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
// Measured solo against a real `siegelense <call> --help` spawn: 2.5s-4.7s, dominated by tsx
// compiling the CLI's module graph and dynamically importing @dungeonmaster/siegelense. Measured
// with all 15 of this suite's `siegelense`-seam spawns fired at once (this file's own second
// describe block): still only ~8s wall-clock on an otherwise-idle 12-core box. Neither measurement
// is what a FULL, unscoped `npm run ward` produces — every package's own unit/integration/lint/
// typecheck workers compete for the same cores at once there, and `npx` itself (package resolution,
// occasional registry-adjacent I/O) is far more sensitive to that contention than a CPU-bound
// task is. 60s is generous headroom for that case while still catching a genuine hang; it must
// stay comfortably under `SPAWNS_TIMEOUT_MS`/`SIEGELENSE_SEAM_TIMEOUT_MS` in
// `cli-entry.integration.test.ts`, since both wrap the SAME per-spawn timer.
const RUN_COMMAND_TIMEOUT_MS = 60_000;
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
  runWithClosedStdoutReader: ({ args }: { args: readonly string[] }) => Promise<{
    cliExitCode: ReturnType<typeof ExitCodeStub>;
    cliStderr: ErrorMessage;
  }>;
} => {
  // One spawn with every stdio stream a pipe, each read line by line and rejoined with the newline
  // its lines lost — the text comes back exactly as the CLI wrote it whenever the stream ended on a
  // newline, which every stream asserted on here does.
  const spawnCaptured = async ({
    command,
    args,
    cwd,
    env,
    timeoutLabel,
    closeStdin,
  }: {
    command: string;
    args: string[];
    cwd: string;
    env: Record<string, string | undefined>;
    timeoutLabel: string;
    closeStdin: boolean;
  }): Promise<{
    exitCode: ReturnType<typeof ExitCodeStub>;
    stdout: ErrorMessage;
    stderr: ErrorMessage;
  }> =>
    new Promise((promiseResolve, promiseReject) => {
      const child = spawnPiped({ command, args, cwd, env });
      const text = {
        stdout: errorMessageContract.parse(''),
        stderr: errorMessageContract.parse(''),
      };

      child.onStdoutLine((line) => {
        text.stdout = errorMessageContract.parse(`${text.stdout}${line}\n`);
      });
      child.onStderrLine((line) => {
        text.stderr = errorMessageContract.parse(`${text.stderr}${line}\n`);
      });
      if (closeStdin) {
        child.endStdin();
      }

      const timer = setTimeout(() => {
        child.kill();
        promiseReject(new Error(timeoutLabel));
      }, RUN_COMMAND_TIMEOUT_MS);

      // spawnPiped reports on the child's `close`, not its `exit` — a child's `exit` fires once the
      // process ends, which is not the same moment its stdio pipes finish draining. This harness's
      // whole job is asserting the exact bytes on those pipes, so it waits for the event Node fires
      // once both are closed.
      child.onExit(({ code, error }) => {
        clearTimeout(timer);
        if (error !== undefined) {
          promiseReject(error);
          return;
        }
        promiseResolve({
          exitCode: ExitCodeStub({ value: code ?? 1 }),
          stdout: text.stdout,
          stderr: text.stderr,
        });
      });
    });

  // Spawns bin/cli-entry.ts under tsx with the given argv, capturing BOTH stdio streams (never
  // discarding either — every assertion above the CLI gate depends on reading them back exactly)
  // and a throwaway DUNGEONMASTER_HOME, so a siegelense call under test reads and writes its own
  // registry rather than the developer's real `~/.dungeonmaster`. tsx's own CLI runs under this
  // node, not `npx tsx`: npx adds its own startup to every run.
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

    const result = await spawnCaptured({
      command: execPath,
      args: [tsxCliPath(), '--conditions=source', SOURCE_ENTRY_PATH, ...args],
      cwd: tempDir,
      env: { ...envSnapshot(), FORCE_COLOR: '0', DUNGEONMASTER_HOME: dungeonmasterHome },
      timeoutLabel: `cli-bin runCommand timed out on args: ${args.join(' ')}`,
      closeStdin: false,
    });

    rmSync(tempDir, { recursive: true, force: true });
    rmSync(dungeonmasterHome, { recursive: true, force: true });

    return result;
  };

  // `head -n 0` exits the instant it starts, before ever reading — so its read end of the pipe is
  // already closed by the time the CLI's own tsx boot (RUN_COMMAND_TIMEOUT_MS's own comment: 3.7s
  // to 4.7s) finishes and attempts its first process.stdout.write. That reproduces a closed-stdout
  // write deterministically for ANY call's output, however small, rather than racing a real reader
  // against a real writer over `head -n 3` — a race that only resolves the way a person piping to
  // `head` expects when the output is large enough to force more than one write() syscall. A real
  // shell pipeline is required (not a Node .pipe() relay through this harness's own process): only
  // a direct OS pipe between the CLI and `head` closes the CLI's OWN write end when `head` exits.
  // PIPESTATUS[0] is the CLI's own exit code, distinct from `head`'s — bash writes it to a file
  // rather than mixing it into the stdout `head` already consumed.
  const runWithClosedStdoutReader = async ({
    args,
  }: {
    args: readonly string[];
  }): Promise<{
    cliExitCode: ReturnType<typeof ExitCodeStub>;
    cliStderr: ErrorMessage;
  }> => {
    const tempDir = mkdtempSync(join(tmpdir(), 'dungeonmaster-e2e-'));
    const dungeonmasterHome = mkdtempSync(join(tmpdir(), 'dungeonmaster-e2e-home-'));
    const exitCodeFile = join(tempDir, 'cli-exit-code.txt');
    const shellCommand =
      `${execPath} ${tsxCliPath()} --conditions=source ${SOURCE_ENTRY_PATH} ${args.join(' ')} | head -n 0; ` +
      `echo -n "\${PIPESTATUS[0]}" > ${exitCodeFile}`;

    const { stderr: cliStderr } = await spawnCaptured({
      command: 'bash',
      args: ['-c', shellCommand],
      cwd: tempDir,
      env: { ...envSnapshot(), FORCE_COLOR: '0', DUNGEONMASTER_HOME: dungeonmasterHome },
      timeoutLabel: `cli-bin runWithClosedStdoutReader timed out on args: ${args.join(' ')}`,
      closeStdin: true,
    });

    const cliExitCode = ExitCodeStub({ value: Number(readFileSync(exitCodeFile)) });

    rmSync(tempDir, { recursive: true, force: true });
    rmSync(dungeonmasterHome, { recursive: true, force: true });

    return { cliExitCode, cliStderr };
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

    readBinContent: (): FileContents => fileContentsContract.parse(readFileSync(BIN_PATH)),

    runCommand,

    runWithClosedStdoutReader,

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
        const child = spawnPiped({
          command: execPath,
          args: ['-e', `require(${JSON.stringify(String(BIN_PATH))})`],
          cwd: tempDir,
          env: {
            ...envSnapshot(),
            // Ward's own integration-check spawn sets NODE_OPTIONS=--conditions=source on THIS
            // jest process (check-run-integration-broker.ts) so its transform glue resolves
            // @dungeonmaster/* to source. That var inherits through the environment snapshot into
            // every spawned child by default. This child requires the real BUNDLE, whose
            // externalized `@dungeonmaster/*` requires would then follow shared's own "source"
            // export condition straight to a .ts file plain Node can't parse — measured:
            // ERR_MODULE_NOT_FOUND, read back here as `exitedCleanly: false`. Clear it so this test
            // measures what an actual consumer requiring the shipped bundle gets, not ward's own
            // resolution mode.
            NODE_OPTIONS: '',
            FORCE_COLOR: '0',
            BROWSER: '/bin/true',
            DUNGEONMASTER_PORT: String(IMPORT_PROBE_PORT),
          },
        });
        child.endStdin();

        const seen = { stdout: errorMessageContract.parse('') };
        child.onStdoutLine((line) => {
          seen.stdout = errorMessageContract.parse(`${seen.stdout}${line}\n`);
        });

        const settle = ({ exitedCleanly }: { exitedCleanly: boolean }): void => {
          rmSync(tempDir, { recursive: true, force: true });
          promiseResolve({
            exitedCleanly,
            servedLineSeen: seen.stdout.includes('Dungeonmaster server running at'),
          });
        };

        const timer = setTimeout(() => {
          child.kill();
          settle({ exitedCleanly: false });
        }, IMPORT_PROBE_TIMEOUT_MS);

        child.onExit(({ code, error }) => {
          clearTimeout(timer);
          settle({ exitedCleanly: error === undefined && code === 0 });
        });
      }),
  };
};
