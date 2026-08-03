/**
 * PURPOSE: Returns the changed-file list for a review scope, measured from an explicit base ref
 *
 * USAGE:
 * const files = await gitDiffFilesAdapter({
 *   cwd: AbsoluteFilePathStub({ value: '/project' }),
 *   baseRef: QuestStub({ baseRef: 'a1b2c3d4' as never }).baseRef!,
 * });
 * // Returns RepoRelativePath[] of files changed between baseRef and HEAD, in git's reported order
 *
 * `packages/ward/src/brokers/git/diff-files/git-diff-files-broker.ts` resolves changed files by
 * detecting the repo's default branch and diffing against its merge-base — correct for ward's lint
 * scoping, wrong for review scope: once the default branch absorbs a quest's own implementation
 * commits, that diff silently collapses to whatever landed after them (one real quest returned 30
 * files where the quest had actually touched 173 — the other ~144 were structurally invisible to
 * every review pass). An explicit baseRef, stamped once when the relay is seeded, pins the
 * measurement for the life of the quest instead of re-deriving it from branch state.
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  repoRelativePathContract,
  type AbsoluteFilePath,
  type Quest,
  type RepoRelativePath,
} from '@dungeonmaster/shared/contracts';

type GitBaseRef = NonNullable<Quest['baseRef']>;

export const gitDiffFilesAdapter = async ({
  cwd,
  baseRef,
}: {
  cwd: AbsoluteFilePath;
  baseRef: GitBaseRef;
}): Promise<RepoRelativePath[]> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['diff', `${baseRef}...HEAD`, '--name-only'],
    cwd,
  });

  if (exitCode !== exitCodeContract.parse(0)) {
    throw new Error(
      `git diff ${baseRef}...HEAD failed with exit code ${String(exitCode)}: ${output}`,
    );
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => repoRelativePathContract.parse(line));
};
