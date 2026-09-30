/**
 * PURPOSE: Rolls a half-built worktree back after a Start Quest preparation step fails, so the
 * quest lands back in the startable status it arrived in instead of leaving a name-collision behind
 * that would refuse every future Start. Always called from a path that has already failed, so it
 * reports the cleanup outcome instead of throwing — a cleanup exception here would replace the real
 * failure with an unrelated one in whatever the caller surfaces to the user. Removes the worktree
 * before the branch because git refuses to delete a branch a live worktree still has checked out, so
 * a failed removal makes the delete call one that cannot succeed and is skipped rather than attempted.
 *
 * USAGE:
 * const { discarded, output } = await worktreeDiscardBroker({
 *   repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' }),
 *   branchName: QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' }),
 * });
 * // discarded is true only when both `git worktree remove` and `git branch -D` exited 0
 */


import { branchDelete, worktreeRemove } from '#gateway/bin/git';

export const worktreeDiscardBroker = async ({
  repoRoot,
  worktreePath,
  branchName,
}: {
  repoRoot: string;
  worktreePath: string;
  branchName: string;
}): Promise<{ discarded: boolean; output: string }> => {
  const removeResult = await worktreeRemove({ cwd: repoRoot, worktreePath });

  if (removeResult.exitCode !== 0) {
    return { discarded: false, output: removeResult.output };
  }

  const deleteResult = await branchDelete({ cwd: repoRoot, branchName });

  if (deleteResult.exitCode !== 0) {
    return { discarded: false, output: deleteResult.output };
  }

  return { discarded: true, output: '' };
};
