/**
 * PURPOSE: Provides a spawnSync wrapper for running hook startup scripts in integration tests
 *
 * USAGE:
 * const runner = hookRunnerHarness();
 * const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData: HookDataStub({ ... }) });
 * // result.exitCode, result.stdout, result.stderr
 */
import * as path from 'path';
import { pathToFileURL } from 'url';
import { spawnSync } from 'child_process';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { ExecResultStub } from '@dungeonmaster/shared/contracts';

// `node --import <tsx loader>` is tsx's own documented equivalent of the `tsx` bin, minus two
// process launches: `npx` re-resolves the bin through npm on every call, and the `tsx` CLI then
// re-execs node to install this loader. Every runHook here is a fresh process that pays both again,
// which is why a launch cost is worth chasing — measured at 2.22s against 2.84s for one whole
// start-post-ask-question-hook child (median of five), and 2.8s against 2.3s of test-body time for
// that file under ward. The child's `--conditions=source` resolution is unchanged: both forms load
// the same 477 `packages/shared` TypeScript modules and no `dist/`.
const TSX_LOADER = pathToFileURL(require.resolve('tsx')).href;

type HookName =
  | 'start-pre-bash-hook'
  | 'start-post-edit-hook'
  | 'start-post-ask-question-hook'
  | 'start-pre-edit-hook'
  | 'start-pre-folder-detail-hook'
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
  }) => ReturnType<typeof spawnSync>;
  resolveHookPath: (params: { hookName: HookName }) => FilePath;
} => {
  const resolveHookPath = ({ hookName }: { hookName: HookName }): FilePath =>
    FilePathStub({ value: path.join(process.cwd(), 'src', 'startup', `${hookName}.ts`) });

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
  }): ReturnType<typeof spawnSync> =>
    spawnSync(
      process.execPath,
      [
        '--conditions=source',
        '--import',
        TSX_LOADER,
        String(resolveHookPath({ hookName })),
        ...args,
      ],
      {
        input,
        encoding: 'utf8',
        cwd: process.cwd(),
        // Specimens live under the globally-ignored `.test-tmp` sandbox; opt the hook into linting
        // ESLint-ignored paths so violation detection is still exercised.
        env: { ...process.env, DUNGEONMASTER_HOOK_LINT_IGNORED_PATHS: 'true' },
      },
    );

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
      stdout: String(result.stdout),
      stderr: String(result.stderr),
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
  }): ReturnType<typeof spawnSync> =>
    spawnHook({ hookName, input: String(input), args: args ?? [] });

  return {
    runHook,
    runHookRaw,
    resolveHookPath,
  };
};
