/**
 * PURPOSE: Reads the current git HEAD commit sha via `git rev-parse HEAD`, so a quest can pin the
 * commit its review diff is measured from at seed time
 *
 * USAGE:
 * const sha = await gitHeadShaAdapter({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns the branded GitBaseRef sha, or null if git is unavailable or HEAD cannot be read —
 * // never throws
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath, Quest } from '@dungeonmaster/shared/contracts';

type GitBaseRef = NonNullable<Quest['baseRef']>;

export const gitHeadShaAdapter = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitBaseRef | null> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['rev-parse', 'HEAD'],
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
