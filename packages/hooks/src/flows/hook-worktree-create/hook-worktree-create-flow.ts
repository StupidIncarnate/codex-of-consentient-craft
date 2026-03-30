/**
 * PURPOSE: Parses raw JSON input, delegates to the worktree-create hook responder, and produces process output
 *
 * USAGE:
 * const result = HookWorktreeCreateFlow({ inputData: '{"worktree_path":"/path","branch":"my-branch",...}' });
 * // Returns ExecResult with worktree path on stdout
 */

import {
  execResultContract,
  type ExecResult,
} from '../../contracts/exec-result/exec-result-contract';
import { worktreeCreateHookDataContract } from '../../contracts/worktree-create-hook-data/worktree-create-hook-data-contract';
import { HookWorktreeCreateResponder } from '../../responders/hook/worktree-create/hook-worktree-create-responder';

export const HookWorktreeCreateFlow = ({ inputData }: { inputData: string }): ExecResult => {
  try {
    const parsed: unknown = JSON.parse(inputData);
    const input = worktreeCreateHookDataContract.parse(parsed);

    const result = HookWorktreeCreateResponder({ input });

    return execResultContract.parse({
      stderr: '',
      stdout: result.worktreePath,
      exitCode: 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return execResultContract.parse({
      stderr: `Hook error: ${message}\n${stack ? `${stack}\n` : ''}`,
      stdout: '',
      exitCode: 1,
    });
  }
};
