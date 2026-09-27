/**
 * PURPOSE: Detects whether the git repo uses 'main' or 'master' as its default branch
 *
 * USAGE:
 * const branch = await gitDetectDefaultBranchBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitBranchName('main'), GitBranchName('master'), or null if neither exists
 */

import { run } from '#gateway/node/child_process';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitBranchName } from '../../../contracts/git-branch-name/git-branch-name-contract';
import { gitBranchNameContract } from '../../../contracts/git-branch-name/git-branch-name-contract';

export const gitDetectDefaultBranchBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitBranchName | null> => {
  const mainResult = await run({ command: 'git', args: ['rev-parse', '--verify', 'main'], cwd });

  if (mainResult.exitCode === 0) {
    return gitBranchNameContract.parse('main');
  }

  const masterResult = await run({
    command: 'git',
    args: ['rev-parse', '--verify', 'master'],
    cwd,
  });

  if (masterResult.exitCode === 0) {
    return gitBranchNameContract.parse('master');
  }

  return null;
};
