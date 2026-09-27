/**
 * PURPOSE: Detects whether the git repo uses 'main' or 'master' as its default branch
 *
 * USAGE:
 * const branch = await gitDetectDefaultBranchBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitBranchName('main'), GitBranchName('master'), or null if neither exists
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitBranchName } from '../../../contracts/git-branch-name/git-branch-name-contract';
import { gitBranchNameContract } from '../../../contracts/git-branch-name/git-branch-name-contract';

export const gitDetectDefaultBranchBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitBranchName | null> => {
  // A missing `git` binary rejects `run` with RunNotFoundError rather than resolving a result —
  // caught here and folded into the same failed-run shape the old spawn-capture adapter resolved
  // for an ENOENT, so "git is not on this machine" reads as "neither branch verified" below,
  // exactly as it always has.
  const mainResult = await run({
    command: 'git',
    args: ['rev-parse', '--verify', 'main'],
    cwd,
  }).catch((error: unknown) => {
    if (!(error instanceof RunNotFoundError)) {
      throw error;
    }
    return { exitCode: 1, output: '', signal: null, timedOut: false };
  });

  if (mainResult.exitCode === 0) {
    return gitBranchNameContract.parse('main');
  }

  const masterResult = await run({
    command: 'git',
    args: ['rev-parse', '--verify', 'master'],
    cwd,
  }).catch((error: unknown) => {
    if (!(error instanceof RunNotFoundError)) {
      throw error;
    }
    return { exitCode: 1, output: '', signal: null, timedOut: false };
  });

  if (masterResult.exitCode === 0) {
    return gitBranchNameContract.parse('master');
  }

  return null;
};
