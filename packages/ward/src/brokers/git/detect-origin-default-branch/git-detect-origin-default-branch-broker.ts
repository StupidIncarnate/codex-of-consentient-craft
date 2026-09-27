/**
 * PURPOSE: Resolves which ref stands for "origin's default branch", so a committed-work diff has a
 * remote-side base to measure against. Reach for this over gitDetectDefaultBranchBroker when the
 * question is what the REMOTE holds — the local main/master that broker finds can itself be ahead of
 * origin, so a diff against it reports nothing for commits origin has never seen.
 *
 * THE BRANCH'S OWN TRACKING REF IS DELIBERATELY NOT CONSULTED. `--committed` asks "what has this
 * branch added on top of origin's main line", and `@{upstream}` answers a different question — on a
 * branch that has already been pushed it resolves to that branch's own remote copy, so the diff
 * collapses to nothing the moment a reviewer pushes. That collapse is what made every reviewer on a
 * long quest grade a window that shrank to its own pass.
 *
 * USAGE:
 * const ref = await gitDetectOriginDefaultBranchBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitBranchName('origin/master'), or null when the repo has no origin refs at all
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitBranchName } from '../../../contracts/git-branch-name/git-branch-name-contract';
import { gitBranchNameContract } from '../../../contracts/git-branch-name/git-branch-name-contract';
import { gitRemoteRefsStatics } from '../../../statics/git-remote-refs/git-remote-refs-statics';

export const gitDetectOriginDefaultBranchBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitBranchName | null> => {
  // A missing `git` binary rejects `run` with RunNotFoundError rather than resolving a result —
  // caught here and folded into the same failed-run shape the old spawn-capture adapter resolved
  // for an ENOENT, so "git is not on this machine" reads as "neither origin ref verified" below.
  const mainResult = await run({
    command: 'git',
    args: ['rev-parse', '--verify', gitRemoteRefsStatics.originMain],
    cwd,
  }).catch((error: unknown) => {
    if (!(error instanceof RunNotFoundError)) {
      throw error;
    }
    return { exitCode: 1, output: '', signal: null, timedOut: false };
  });

  if (mainResult.exitCode === 0) {
    return gitBranchNameContract.parse(gitRemoteRefsStatics.originMain);
  }

  const masterResult = await run({
    command: 'git',
    args: ['rev-parse', '--verify', gitRemoteRefsStatics.originMaster],
    cwd,
  }).catch((error: unknown) => {
    if (!(error instanceof RunNotFoundError)) {
      throw error;
    }
    return { exitCode: 1, output: '', signal: null, timedOut: false };
  });

  if (masterResult.exitCode === 0) {
    return gitBranchNameContract.parse(gitRemoteRefsStatics.originMaster);
  }

  return null;
};
