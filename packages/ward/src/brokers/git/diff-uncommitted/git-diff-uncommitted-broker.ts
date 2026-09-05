/**
 * PURPOSE: Collects every file the working tree holds that HEAD does not — staged edits, unstaged
 * edits, and brand-new files nobody has run `git add` on. Reach for this over gitDiffCommittedBroker
 * when the question is what a session has produced but not recorded yet; that broker answers the
 * other half, and the two together cover a branch with no overlap.
 *
 * `git diff` IN EVERY FORM REPORTS TRACKED PATHS ONLY, so the untracked reading is not a nicety —
 * it is most of the answer. Measured on quest 1be07040: a reviewer's gate saw 6 files of a 99-file
 * pass because the other 93 were new, exited 0, and both defects that later went red came out of
 * that commit. Another gate exited 0 having never opened six brand-new browser-package files. The
 * union is the only complete reading, and dropping either half restores a false green on every new
 * file in the repo.
 *
 * USAGE:
 * const files = await gitDiffUncommittedBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitRelativePath[] — tracked edits first, then untracked additions
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { parseDiffOutputTransformer } from '../../../transformers/parse-diff-output/parse-diff-output-transformer';

export const gitDiffUncommittedBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitRelativePath[]> => {
  const [trackedResult, untrackedResult] = await Promise.all([
    childProcessSpawnCaptureAdapter({
      command: 'git',
      args: ['diff', '--name-only', '--diff-filter=d', 'HEAD'],
      cwd,
    }),
    // `--exclude-standard` applies .gitignore and friends, so build output and node_modules never
    // reach a check runner. Without it the untracked reading is every generated file in the repo.
    childProcessSpawnCaptureAdapter({
      command: 'git',
      args: ['ls-files', '--others', '--exclude-standard'],
      cwd,
    }),
  ]);

  const tracked = parseDiffOutputTransformer({ output: trackedResult.output });
  const untracked = parseDiffOutputTransformer({ output: untrackedResult.output });

  // An intent-to-add (`git add -N`) puts one path in BOTH readings, so the union is de-duplicated
  // on first appearance rather than concatenated — a check runner handed the same path twice
  // reports it twice.
  const seen = new Set<GitRelativePath>();

  return [...tracked, ...untracked].filter((file) => {
    if (seen.has(file)) {
      return false;
    }
    seen.add(file);
    return true;
  });
};
