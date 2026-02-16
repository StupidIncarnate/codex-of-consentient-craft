/**
 * PURPOSE: Returns changed file paths by running git diff with merge-base detection against the default branch
 *
 * USAGE:
 * const files = await gitDiffFilesBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitRelativePath[] of files changed relative to main/master branch
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { exitCodeContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { parseDiffOutputTransformer } from '../../../transformers/parse-diff-output/parse-diff-output-transformer';
import { gitDetectDefaultBranchBroker } from '../detect-default-branch/git-detect-default-branch-broker';

export const gitDiffFilesBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitRelativePath[]> => {
  const defaultBranch = await gitDetectDefaultBranchBroker({ cwd });

  if (defaultBranch) {
    const mergeBaseResult = await childProcessSpawnCaptureAdapter({
      command: 'git',
      args: ['merge-base', 'HEAD', defaultBranch],
      cwd,
    });

    if (mergeBaseResult.exitCode === exitCodeContract.parse(0)) {
      const mergeBase = mergeBaseResult.output.trim();
      const diffResult = await childProcessSpawnCaptureAdapter({
        command: 'git',
        args: ['diff', '--name-only', `${mergeBase}...HEAD`],
        cwd,
      });

      return parseDiffOutputTransformer({ output: diffResult.output });
    }
  }

  const fallbackResult = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['diff', '--name-only', 'HEAD'],
    cwd,
  });

  return parseDiffOutputTransformer({ output: fallbackResult.output });
};
