/**
 * PURPOSE: Provides a synchronous runner for hook startup scripts in integration tests: each call
 * is a fresh process fed the hook payload on stdin
 *
 * USAGE:
 * const runner = hookRunnerHarness();
 * const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData: HookDataStub({ ... }) });
 * // result.exitCode, result.stdout, result.stderr
 */
import { runSyncWithInput } from '#gateway/node/child_process';
import { execPath, envSnapshot } from '#gateway/node/process';
import { join, resolve } from '#gateway/node/path';
import { tsxLoaderUrl } from '#gateway/npm/tsx';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';

import { ExecResultStub } from '@dungeonmaster/shared/contracts/exec-result/exec-result.stub';

// `node --import <tsx loader>` is tsx's own documented equivalent of the `tsx` bin, minus two
// process launches: `npx` re-resolves the bin through npm on every call, and the `tsx` CLI then
// re-execs node to install this loader. Every runHook here is a fresh process that pays both again,
// which is why a launch cost is worth chasing — measured at 2.22s against 2.84s for one whole
// start-post-ask-question-hook child (median of five), and 2.8s against 2.3s of test-body time for
// that file under ward. The child's `--conditions=source` resolution is unchanged: both forms load
// the same 477 `packages/shared` TypeScript modules and no `dist/`.
const PACKAGE_DIR = resolve(__dirname, '../../..');

type HookName =
  | 'start-pre-bash-hook'
  | 'start-post-edit-hook'
  | 'start-post-ask-question-hook'
  | 'start-pre-edit-hook'
  | 'start-pre-folder-detail-hook'
  | 'start-pre-mcp-caller-hook'
  | 'start-pre-search-hook'
  | 'start-session-snippet-hook'
  | 'start-worktree-create-hook';

export const hookRunnerHarness = (): {
  runHook: (params: {
    hookName: HookName;
    hookData: unknown;
    args?: readonly string[];
  }) => ReturnType<typeof ExecResultStub>;
  runHookRaw: (params: {
    hookName: HookName;
    input: ReturnType<typeof ExecResultStub>['stdout'];
    args?: readonly string[];
  }) => ReturnType<typeof runSyncWithInput>;
  resolveHookPath: (params: { hookName: HookName }) => FilePath;
} => {
  const resolveHookPath = ({ hookName }: { hookName: HookName }): FilePath =>
    FilePathStub({ value: join(PACKAGE_DIR, 'src', 'startup', `${hookName}.ts`) });

  // `--conditions=source` matches jest's `customExportConditions: ['source', ...]` (see
  // jest.config.base.js) so this spawned child resolves `@dungeonmaster/*` imports to the same
  // TypeScript source jest runs in-process, not whatever `dist/` was last built.
  const spawnHook = ({
    hookName,
    input,
    args,
  }: {
    hookName: HookName;
    input: string;
    args: readonly string[];
  }): ReturnType<typeof runSyncWithInput> =>
    runSyncWithInput({
      command: execPath,
      args: [
        '--conditions=source',
        '--import',
        tsxLoaderUrl(),
        String(resolveHookPath({ hookName })),
        ...args,
      ],
      cwd: PACKAGE_DIR,
      input,
      // Specimens live under the globally-ignored `.test-tmp` sandbox; opt the hook into linting
      // ESLint-ignored paths so violation detection is still exercised.
      env: { ...envSnapshot(), DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS: 'true' },
    });

  const runHook = ({
    hookName,
    hookData,
    args,
  }: {
    hookName: HookName;
    hookData: unknown;
    args?: readonly string[];
  }): ReturnType<typeof ExecResultStub> => {
    const result = spawnHook({ hookName, input: JSON.stringify(hookData), args: args ?? [] });

    return ExecResultStub({
      exitCode: result.status === null ? 1 : result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  };

  const runHookRaw = ({
    hookName,
    input,
    args,
  }: {
    hookName: HookName;
    input: ReturnType<typeof ExecResultStub>['stdout'];
    args?: readonly string[];
  }): ReturnType<typeof runSyncWithInput> =>
    spawnHook({ hookName, input: String(input), args: args ?? [] });

  return {
    runHook,
    runHookRaw,
    resolveHookPath,
  };
};
