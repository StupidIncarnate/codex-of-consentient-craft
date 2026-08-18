/**
 * PURPOSE: Reads the sha the current branch's upstream points at via `git rev-parse @{upstream}`,
 * so a caller can measure what has been committed but NOT yet pushed
 *
 * USAGE:
 * const sha = await gitUpstreamShaAdapter({ cwd: AbsoluteFilePathStub({ value: '/worktree' }) });
 * // Returns the branded GitBaseRef sha, or null when the branch tracks nothing, git is
 * // unavailable, or the ref cannot be read — never throws
 *
 * `@{upstream}..HEAD` IS THE ROUND BOUNDARY. Every minion commits its own work as it goes, and the
 * operator pushes once at the end of each round, so "committed but unpushed" is exactly the
 * round in flight — and it stays exactly that with no id threaded through any prompt, no field on
 * any contract, and nothing for an agent to get wrong.
 *
 * NULL IS A REAL ANSWER, not a failure. A branch with no upstream is what a quest carved before
 * riftcarver started pushing looks like; the caller falls back to the quest's pinned `baseRef`,
 * which over-reports the surface rather than hiding part of it.
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath, Quest } from '@dungeonmaster/shared/contracts';

type GitBaseRef = NonNullable<Quest['baseRef']>;

export const gitUpstreamShaAdapter = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitBaseRef | null> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['rev-parse', '@{upstream}'],
    cwd,
  });

  if (exitCode !== 0) {
    return null;
  }

  const sha = output.trim();

  if (sha.length === 0) {
    return null;
  }

  return sha as unknown as GitBaseRef;
};
