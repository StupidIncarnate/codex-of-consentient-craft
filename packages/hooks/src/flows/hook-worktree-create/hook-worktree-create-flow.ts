/**
 * PURPOSE: Parses raw JSON input, delegates to the worktree-create hook responder, and produces process output
 *
 * USAGE:
 * const result = HookWorktreeCreateFlow({ inputData: '{"worktree_path":"/path","branch":"my-branch",...}' });
 * // Returns ExecResult carrying the responder's refusal on stderr
 */

import { execResultContract, type ExecResult } from '@dungeonmaster/shared/contracts';
import { worktreeCreateHookDataContract } from '../../contracts/worktree-create-hook-data/worktree-create-hook-data-contract';
import { HookWorktreeCreateResponder } from '../../responders/hook/worktree-create/hook-worktree-create-responder';

export const HookWorktreeCreateFlow = ({ inputData }: { inputData: string }): ExecResult => {
  try {
    const parsed: unknown = JSON.parse(inputData);
    // Parsed and discarded: the responder refuses every worktree whatever its name, but a hook
    // handed a payload it cannot read is a wiring fault rather than a refusal, and the two answer
    // with different exit codes.
    worktreeCreateHookDataContract.parse(parsed);

    const result = HookWorktreeCreateResponder();

    return execResultContract.parse({
      stderr: result.stderr,
      stdout: '',
      exitCode: result.exitCode,
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
