/**
 * PURPOSE: Collects every file the remote does not yet have — files touched by commits that are not
 * pushed, plus staged and unstaged edits on top of them. Reach for this over gitDiffFilesBroker when
 * the caller is gating a push: gitDiffFilesBroker measures against the LOCAL default branch, which
 * says nothing about what origin holds, so work already pushed still shows up there.
 *
 * The diff runs from the merge-base rather than the upstream tip, so commits another author pushed
 * while this branch sat behind are not reported as this branch's work.
 *
 * USAGE:
 * const files = await gitDiffUnpushedBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitRelativePath[] covering unpushed commits and any uncommitted edits
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { exitCodeContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { parseDiffOutputTransformer } from '../../../transformers/parse-diff-output/parse-diff-output-transformer';
import { gitDetectUpstreamBroker } from '../detect-upstream/git-detect-upstream-broker';
import { gitDiffFilesBroker } from '../diff-files/git-diff-files-broker';

export const gitDiffUnpushedBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitRelativePath[]> => {
  const upstreamRef = await gitDetectUpstreamBroker({ cwd });

  if (upstreamRef !== null) {
    const mergeBaseResult = await childProcessSpawnCaptureAdapter({
      command: 'git',
      args: ['merge-base', 'HEAD', String(upstreamRef)],
      cwd,
    });

    if (mergeBaseResult.exitCode === exitCodeContract.parse(0)) {
      const mergeBase = mergeBaseResult.output.trim();
      const diffResult = await childProcessSpawnCaptureAdapter({
        command: 'git',
        args: ['diff', '--name-only', '--diff-filter=d', mergeBase],
        cwd,
      });

      return parseDiffOutputTransformer({ output: diffResult.output });
    }
  }

  // The repo has no origin refs to measure against (no remote, or a remote that has never been
  // fetched). Nothing here is pushed, so the branch's divergence from its local default branch is
  // the closest honest answer.
  return gitDiffFilesBroker({ cwd });
};
