/**
 * PURPOSE: Answers "what has this session changed that is not committed yet?" — the surface a
 * reviewer running INSIDE another session's turn has to read, because at that moment nothing it is
 * about to review exists in history. Reach for this over `gitDiffFilesAdapter` whenever the
 * measurement is a working tree rather than a commit range: `git diff` in EVERY form reports
 * tracked paths only, so a reviewer handed a bare diff sees none of the net-new files the session
 * just wrote — the files most likely to carry a defect — and comes back green having never opened
 * them. The union of the two readings is the only complete one, and it lives here rather than in
 * an adapter because an adapter may not compose a sibling adapter.
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
import { questContract } from '@dungeonmaster/shared/contracts';

import { gitDiffFilesAdapter } from '../../../adapters/git/diff-files/git-diff-files-adapter';
import { gitUntrackedFilesAdapter } from '../../../adapters/git/untracked-files/git-untracked-files-adapter';

export const gitWorkingTreeFilesBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<RepoRelativePath[]> => {
  const [trackedChanges, untrackedAdditions] = await Promise.all([
    gitDiffFilesAdapter({
      cwd,
      baseRef: questContract.shape.baseRef.unwrap().parse('HEAD'),
      comparison: 'ref-to-working-tree',
    }),
    gitUntrackedFilesAdapter({ cwd }),
  ]);

  const seen = new Set<RepoRelativePath>();

  return [...trackedChanges, ...untrackedAdditions].filter((file) => {
    if (seen.has(file)) {
      return false;
    }
    seen.add(file);
    return true;
  });
};
