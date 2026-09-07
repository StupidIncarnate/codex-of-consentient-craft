/**
 * PURPOSE: Refuses Claude Code's own WorktreeCreate path so this repo keeps exactly ONE route to a
 * worktree, and a session that reached for the wrong one is told which one to use instead. Claude
 * Code's own command leaves `node_modules` pointing at the main checkout, so every command run in
 * that tree resolves the main checkout's packages and reports green against code the worktree never
 * saw — a failure with no other symptom. Reach for the `create-worktree` MCP tool, which mirrors,
 * seeds and audits the tree before handing the path back.
 *
 * USAGE:
 * const { stderr, exitCode } = HookWorktreeCreateResponder();
 * // exitCode 2 is the code Claude Code reads as a BLOCK, and the one that feeds stderr back to the
 * //   model rather than showing it to the user alone
 */

import { errorMessageContract, exitCodeContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage, ExitCode } from '@dungeonmaster/shared/contracts';

import { hookExitCodeStatics } from '../../../statics/hook-exit-code/hook-exit-code-statics';
import { worktreeBlockMessageStatics } from '../../../statics/worktree-block-message/worktree-block-message-statics';

export const HookWorktreeCreateResponder = (): {
  stderr: ErrorMessage;
  exitCode: ExitCode;
} => ({
  stderr: errorMessageContract.parse(`${worktreeBlockMessageStatics.blockMessage}\n`),
  exitCode: exitCodeContract.parse(hookExitCodeStatics.blockingFailure),
});
