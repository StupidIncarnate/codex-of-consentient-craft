/**
 * PURPOSE: Publishes the current branch with `git push`, optionally establishing its upstream on the
 * first push. Never throws on a failed push — a push that fails leaves a perfectly good worktree
 * with all its commits, only the publication is missing, so the caller decides what that means.
 *
 * USAGE:
 * await push({ cwd: '/repo', setUpstream: { branchName: 'quest/foo' } });
 * // Runs `git push -u origin quest/foo`
 *
 * await push({ cwd: '/repo' });
 * // Runs `git push`
 */

import { gitRun } from '../git-run/git-run';

const DEFAULT_REMOTE = 'origin';

export const push = async ({
  cwd,
  setUpstream,
}: {
  cwd: string;
  setUpstream?: { branchName: string };
}): Promise<{ exitCode: number; output: string }> => {
  const args =
    setUpstream === undefined ? ['push'] : ['push', '-u', DEFAULT_REMOTE, setUpstream.branchName];
  const { exitCode, output } = await gitRun({ args, cwd });
  return { exitCode, output };
};
