/**
 * PURPOSE: Collects every file this branch's COMMITS have touched, measured from where the branch
 * left origin's default line. Reach for this over gitDiffUncommittedBroker when the question is what
 * has been recorded in history; that broker answers the opposite half — what is still only in the
 * working tree. Together the two cover a branch with no overlap, which is why `--committed` and
 * `--uncommitted` may be passed together.
 *
 * THE DIFF ENDS AT HEAD, NOT AT THE WORKING TREE. `git diff <base>` with no second ref compares the
 * base to whatever is on disk, so it silently folds uncommitted edits into a set that claims to be
 * about commits. Naming HEAD explicitly is what keeps the two halves disjoint.
 *
 * The base is a merge-base rather than the upstream tip, so commits another author pushed to
 * origin's default branch while this one sat behind are not reported as this branch's work.
 *
 * USAGE:
 * const files = await gitDiffCommittedBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitRelativePath[] covering every commit this branch added on top of origin/main
 */

import { diffFiles, gitRun, GitNotInstalledError } from '#gateway/bin/git';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { parseDiffOutputTransformer } from '../../../transformers/parse-diff-output/parse-diff-output-transformer';
import { gitDetectDefaultBranchBroker } from '../detect-default-branch/git-detect-default-branch-broker';
import { gitDetectOriginDefaultBranchBroker } from '../detect-origin-default-branch/git-detect-origin-default-branch-broker';

export const gitDiffCommittedBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitRelativePath[]> => {
  // A missing `git` binary makes the gateway throw GitNotInstalledError rather than resolve a
  // result — folded into an empty answer so it reads as "no merge base" / "empty diff", exactly as
  // it always has.
  try {
    // Origin's default branch first, the LOCAL one only as a fallback: a repo with no remote at all
    // (a fresh `git init`, an offline clone that has never fetched) still has a main line worth
    // measuring from, and refusing to answer there would leave `--committed` permanently empty.
    const baseBranch =
      (await gitDetectOriginDefaultBranchBroker({ cwd })) ??
      (await gitDetectDefaultBranchBroker({ cwd }));

    if (baseBranch === null) {
      return [];
    }

    const mergeBaseResult = await gitRun({
      args: ['merge-base', 'HEAD', String(baseBranch)],
      cwd,
    });

    if (mergeBaseResult.exitCode !== 0) {
      return [];
    }

    // `<merge-base>...HEAD` ends at HEAD, never the working tree; `excludeDeleted` keeps a removed
    // path out of the set a check runner will open.
    const files = await diffFiles({
      cwd,
      baseRef: mergeBaseResult.output.trim(),
      excludeDeleted: true,
    });

    return parseDiffOutputTransformer({ output: files.join('\n') });
  } catch (error: unknown) {
    if (!(error instanceof GitNotInstalledError)) {
      throw error;
    }
    return [];
  }
};
