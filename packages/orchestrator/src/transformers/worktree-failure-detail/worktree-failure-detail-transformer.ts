/**
 * PURPOSE: Shared detail-string builder for every worktree-preparation failure point (worktree
 * creation, node_modules population, build) so the composing 500 handler's detail segment always
 * carries the worktree path and cause in one shape, and — since a failed prepare rolls the
 * worktree back — never silently drops a cleanup failure alongside the original cause.
 *
 * USAGE:
 * worktreeFailureDetailTransformer({
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/quest-slug-a1b2c3d4' }),
 *   cause: 'npm run build exited with code 1',
 * });
 * // Returns '/repo/worktrees/quest-slug-a1b2c3d4: npm run build exited with code 1'
 */

import {
  errorMessageContract,
  type AbsoluteFilePath,
  type ErrorMessage,
} from '@dungeonmaster/shared/contracts';

export const worktreeFailureDetailTransformer = ({
  worktreePath,
  cause,
  cleanupOutput,
}: {
  worktreePath: AbsoluteFilePath;
  cause: string;
  cleanupOutput?: ErrorMessage;
}): ErrorMessage => {
  const detail = `${worktreePath}: ${cause}`;

  if (cleanupOutput !== undefined && cleanupOutput.trim().length > 0) {
    return errorMessageContract.parse(`${detail} (worktree cleanup also failed: ${cleanupOutput})`);
  }

  return errorMessageContract.parse(detail);
};
