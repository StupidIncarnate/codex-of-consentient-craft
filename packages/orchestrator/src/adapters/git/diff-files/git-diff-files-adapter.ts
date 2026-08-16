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
 * `comparison` picks WHAT the ref is compared against, and the two answers are not
 * interchangeable. `merge-base-to-head` (`<ref>...HEAD`) reads committed history and is what a
 * review measured from a pinned base wants. `ref-to-working-tree` (`<ref>`, no range) reads the
 * working tree — the shape a pre-commit review needs, because nothing it is about to review is
 * committed yet, and `HEAD...HEAD` would collapse to nothing. `ref-to-working-tree` still reports
 * TRACKED files only; an untracked file is in no diff at all, and `gitUntrackedFilesAdapter` is the
 * other half of that reading.
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
  comparison = 'merge-base-to-head',
}: {
  cwd: AbsoluteFilePath;
  baseRef: GitBaseRef;
  comparison?: 'merge-base-to-head' | 'ref-to-working-tree';
}): Promise<RepoRelativePath[]> => {
  const revisionArg = comparison === 'ref-to-working-tree' ? baseRef : `${baseRef}...HEAD`;

  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['diff', revisionArg, '--name-only'],
    cwd,
  });

  if (exitCode !== exitCodeContract.parse(0)) {
    throw new Error(`git diff ${revisionArg} failed with exit code ${String(exitCode)}: ${output}`);
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => repoRelativePathContract.parse(line));
};
