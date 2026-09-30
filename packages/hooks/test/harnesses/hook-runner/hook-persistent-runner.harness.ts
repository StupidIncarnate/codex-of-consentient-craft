/**
 * PURPOSE: Provides a persistent child process for running hook flows without respawning per test
 *
 * A READY worker is not a WARM one, and the gap is the whole reason `warmupHookData` exists. Spawning
 * the child loads the flow module; the expensive half — `require(eslint.config.js)` and the first
 * TypeScript program ESLint builds — happens lazily, on the first hook invocation. Left to a test,
 * that one-time cost lands inside `assertionResults[].duration` and ward's slow-test gate reads it as
 * a slow TEST. Measured on `start-pre-edit-hook`: first test 3297ms, every later one about 180ms, for
 * the same work. Send `start()` a representative payload and jest charges the init to `beforeAll`,
 * which it runs outside the test_start..test_done window — the same placement, and the same reason,
 * as the `beforeAll` require in packages/testing/src/jest.setup.js.
 *
 * USAGE:
 * const runner = hookPersistentRunnerHarness();
 * beforeAll(async () => {
 *   await runner.start({ hookName: 'start-pre-edit-hook', warmupHookData: someData });
 * });
 * afterAll(async () => { await runner.stop(); });
 * const result = await runner.runHook({ hookData: someData });
 * // result.exitCode, result.stdout, result.stderr
 */
import { spawnPiped } from '#gateway/node/child_process';
import { clearTimeout } from '#gateway/node/clearTimeout';
import { join, resolve } from '#gateway/node/path';
import { envSnapshot } from '#gateway/node/process';
import { setTimeout } from '#gateway/node/setTimeout';
import { tsxCliPath } from '#gateway/npm/tsx';


import { ExecResultStub } from '@dungeonmaster/shared/contracts/exec-result/exec-result.stub';

type HookName =
  | 'start-pre-bash-hook'
  | 'start-post-edit-hook'
  | 'start-pre-edit-hook'
  | 'start-pre-folder-detail-hook'
  | 'start-pre-mcp-caller-hook'
  | 'start-pre-search-hook'
  | 'start-session-snippet-hook'
  | 'start-subagent-stop-hook'
  | 'start-agy-pre-tool-hook'
  | 'start-agy-stop-hook';

const PACKAGE_DIR = resolve(__dirname, '../../..');
const WORKER_PATH = join(__dirname, 'hook-persistent-worker.ts');
const STARTUP_TIMEOUT_MS = 30000;
const STOP_TIMEOUT_MS = 5000;

export const hookPersistentRunnerHarness = (): {
  start: (params: { hookName: HookName; warmupHookData?: unknown }) => Promise<void>;
  stop: () => Promise<void>;
  runHook: (params: {
    hookData: unknown;
    args?: readonly string[];
  }) => Promise<ReturnType<typeof ExecResultStub>>;
  runHookRaw: (params: {
    rawInput: string;
    args?: readonly string[];
  }) => Promise<ReturnType<typeof ExecResultStub>>;
} => {
  const state: { child: ReturnType<typeof spawnPiped> | null } = { child: null };
  const exitState: { exited: boolean; waiters: (() => void)[] } = { exited: false, waiters: [] };
  const queueState: {
    responseQueue: {
      resolve: (value: ReturnType<typeof ExecResultStub>) => void;
      reject: (error: Error) => void;
    }[];
  } = { responseQueue: [] };

  const resolveFlowPath = ({ hookName }: { hookName: HookName }): string => {
    const flowName = hookName.replace('start-', 'hook-').replace(/-hook$/u, '');
    return join(PACKAGE_DIR, 'src', 'flows', flowName, `${flowName}-flow`);
  };

  const handleResponse = (line: string): void => {
    const pending = queueState.responseQueue.shift();
    if (pending) {
      try {
        const parsed: unknown = JSON.parse(line);
        pending.resolve(ExecResultStub(parsed as Parameters<typeof ExecResultStub>[0]));
      } catch {
        pending.reject(new Error(`Failed to parse worker response: ${line}`));
      }
    }
  };

  const sendEnvelope = async (envelope: {
    hookData?: unknown;
    rawInput?: string;
    args?: readonly string[];
  }): Promise<ReturnType<typeof ExecResultStub>> => {
    const { child } = state;
    if (!child) {
      throw new Error('Worker not started. Call start() first.');
    }

    return new Promise((resolvePending, rejectPending) => {
      queueState.responseQueue.push({ resolve: resolvePending, reject: rejectPending });
      child.writeLine(JSON.stringify(envelope));
    });
  };

  const start = async ({
    hookName,
    warmupHookData,
  }: {
    hookName: HookName;
    warmupHookData?: unknown;
  }): Promise<void> => {
    const flowPath = resolveFlowPath({ hookName });

    // `--conditions=source` matches jest's `customExportConditions: ['source', ...]` (see
    // jest.config.base.js) so this worker child — and the flow module it dynamically imports —
    // resolves `@dungeonmaster/*` imports to the same TypeScript source jest runs in-process,
    // not whatever `dist/` was last built.
    const child = spawnPiped({
      command: 'node',
      args: [tsxCliPath(), '--conditions=source', WORKER_PATH, String(flowPath)],
      cwd: PACKAGE_DIR,
      // Specimens live under the globally-ignored `.test-tmp` sandbox; opt the hook into linting
      // ESLint-ignored paths so violation detection is still exercised.
      env: { ...envSnapshot(), DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS: 'true' },
    });
    state.child = child;
    exitState.exited = false;

    const readyState: { ready: boolean; stderr: ReturnType<typeof ExecResultStub>['stderr'] } = {
      ready: false,
      stderr: ExecResultStub({ stderr: '' }).stderr,
    };
    child.onStderrLine((line) => {
      readyState.stderr = ExecResultStub({ stderr: `${readyState.stderr}${line}\n` }).stderr;
    });
    child.onExit(() => {
      exitState.exited = true;
      for (const waiter of exitState.waiters) {
        waiter();
      }
      exitState.waiters = [];
    });

    // Wait for READY signal
    await new Promise<void>((resolveReady, rejectReady) => {
      const timeout = setTimeout(() => {
        rejectReady(new Error('Worker startup timeout (30s)'));
      }, STARTUP_TIMEOUT_MS);

      child.onStdoutLine((line) => {
        if (readyState.ready) {
          handleResponse(line);
          return;
        }
        if (line === 'READY') {
          clearTimeout(timeout);
          readyState.ready = true;
          resolveReady();
        }
      });

      child.onExit(({ code, error }) => {
        if (readyState.ready) {
          return;
        }
        clearTimeout(timeout);
        rejectReady(
          error ?? new Error(`Worker exited with code ${String(code)}: ${readyState.stderr}`),
        );
      });
    });

    if (warmupHookData !== undefined) {
      await sendEnvelope({ hookData: warmupHookData });
    }
  };

  const stop = async (): Promise<void> => {
    const currentChild = state.child;

    state.child = null;
    queueState.responseQueue = [];

    if (currentChild) {
      currentChild.endStdin();
      await new Promise<void>((resolveStop) => {
        if (exitState.exited) {
          resolveStop();
          return;
        }
        const killTimeout = setTimeout(() => {
          currentChild.kill();
          resolveStop();
        }, STOP_TIMEOUT_MS);
        exitState.waiters.push(() => {
          clearTimeout(killTimeout);
          resolveStop();
        });
      });
    }
  };

  const runHook = async ({
    hookData,
    args,
  }: {
    hookData: unknown;
    args?: readonly string[];
  }): Promise<ReturnType<typeof ExecResultStub>> =>
    sendEnvelope(args === undefined ? { hookData } : { hookData, args });

  const runHookRaw = async ({
    rawInput,
    args,
  }: {
    rawInput: string;
    args?: readonly string[];
  }): Promise<ReturnType<typeof ExecResultStub>> =>
    sendEnvelope(args === undefined ? { rawInput } : { rawInput, args });

  return { start, stop, runHook, runHookRaw };
};
