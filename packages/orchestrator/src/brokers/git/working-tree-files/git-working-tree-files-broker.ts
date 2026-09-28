/**
 * PURPOSE: Answers "what has this session changed that is not committed yet?" — the surface a
 * reviewer running INSIDE another session's turn has to read, because at that moment nothing it is
 * about to review exists in history. Reach for this over `diffFiles` whenever the
 * measurement is a working tree rather than a commit range: `git diff` in EVERY form reports
 * tracked paths only, so a reviewer handed a bare diff sees none of the net-new files the session
 * just wrote — the files most likely to carry a defect — and comes back green having never opened
 * them. The union of the two readings is the only complete one, and it lives here.
 *
 * USAGE:
 * const files = await gitWorkingTreeFilesBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns RepoRelativePath[] — tracked modifications first, then untracked additions
 *
 * A path can legitimately appear in both readings on a tree where an intent-to-add (`git add -N`)
 * has been staged, so the union is de-duplicated on first appearance rather than concatenated. It
 * needs no review base at all: HEAD is the only reference point, so this answers on a repo whose
 * quest never pinned one.
 */

import type { AbsoluteFilePath, RepoRelativePath } from '@dungeonmaster/shared/contracts';
import { questContract, repoRelativePathContract } from '@dungeonmaster/shared/contracts';
import { diffFiles, untrackedFiles } from '#gateway/bin/git';

export const gitWorkingTreeFilesBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<RepoRelativePath[]> => {
  const [trackedDiff, untrackedAdditions] = await Promise.all([
    diffFiles({
      cwd,
      baseRef: questContract.shape.baseRef.unwrap().parse('HEAD'),
      comparison: 'ref-to-working-tree',
    }),
    untrackedFiles({ cwd }),
  ]);

  const trackedChanges = trackedDiff.map((file) => repoRelativePathContract.parse(file));
  const untrackedChanges = untrackedAdditions.map((file) => repoRelativePathContract.parse(file));

  const seen = new Set<RepoRelativePath>();

  return [...trackedChanges, ...untrackedChanges].filter((file) => {
    if (seen.has(file)) {
      return false;
    }
    seen.add(file);
    return true;
  });
};
