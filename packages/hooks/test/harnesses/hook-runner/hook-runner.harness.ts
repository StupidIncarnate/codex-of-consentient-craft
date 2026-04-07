/**
 * PURPOSE: Provides a spawnSync wrapper for running hook startup scripts in integration tests
 *
 * USAGE:
 * const runner = hookRunnerHarness();
 * const result = runner.runHook({ hookName: 'start-pre-bash-hook', hookData: HookDataStub({ ... }) });
 * // result.exitCode, result.stdout, result.stderr
 */
import * as path from 'path';
import { spawnSync } from 'child_process';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { ExecResultStub } from '../../../src/contracts/exec-result/exec-result.stub';

type HookName =
  | 'start-pre-bash-hook'
  | 'start-post-edit-hook'
  | 'start-pre-edit-hook'
  | 'start-pre-search-hook'
  | 'start-session-start-hook'
  | 'start-subagent-start-hook'
  | 'start-worktree-create-hook';

export const hookRunnerHarness = (): {
  runHook: (params: { hookName: HookName; hookData: unknown }) => ReturnType<typeof ExecResultStub>;
  runHookRaw: (params: {
    hookName: HookName;
    input: ReturnType<typeof ExecResultStub>['stdout'];
  }) => ReturnType<typeof spawnSync>;
  resolveHookPath: (params: { hookName: HookName }) => FilePath;
} => {
  const resolveHookPath = ({ hookName }: { hookName: HookName }): FilePath =>
    FilePathStub({ value: path.join(process.cwd(), 'src', 'startup', `${hookName}.ts`) });

  const runHook = ({
    hookName,
    hookData,
  }: {
    hookName: HookName;
    hookData: unknown;
  }): ReturnType<typeof ExecResultStub> => {
    const hookPath = resolveHookPath({ hookName });
    const input = JSON.stringify(hookData);

    const result = spawnSync('npx', ['tsx', String(hookPath)], {
      input,
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    return ExecResultStub({
      exitCode: result.status === null ? 1 : result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  };

  const runHookRaw = ({
    hookName,
    input,
  }: {
    hookName: HookName;
    input: ReturnType<typeof ExecResultStub>['stdout'];
  }): ReturnType<typeof spawnSync> => {
    const hookPath = resolveHookPath({ hookName });

    return spawnSync('npx', ['tsx', String(hookPath)], {
      input: String(input),
      encoding: 'utf8',
      cwd: process.cwd(),
    });
  };

  return {
    runHook,
    runHookRaw,
    resolveHookPath,
  };
};
