/**
 * PURPOSE: Resolves which git ref represents "what origin already has", so an unpushed-work diff has
 * something to measure against. Reach for this over gitDetectDefaultBranchBroker when the question is
 * what the REMOTE holds — the local main/master that broker finds can itself be ahead of origin, and a
 * branch tracking origin/release-2 must not be measured against origin/main.
 *
 * USAGE:
 * const ref = await gitDetectUpstreamBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitBranchName('origin/master'), or null when the repo has no origin refs at all
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { exitCodeContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitBranchName } from '../../../contracts/git-branch-name/git-branch-name-contract';
import { gitBranchNameContract } from '../../../contracts/git-branch-name/git-branch-name-contract';
import { gitRemoteRefsStatics } from '../../../statics/git-remote-refs/git-remote-refs-statics';

export const gitDetectUpstreamBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitBranchName | null> => {
  const upstreamResult = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['rev-parse', '--abbrev-ref', '--symbolic-full-name', gitRemoteRefsStatics.upstreamAlias],
    cwd,
  });

  const upstreamRef = upstreamResult.output.trim();

  if (upstreamResult.exitCode === exitCodeContract.parse(0) && upstreamRef.length > 0) {
    return gitBranchNameContract.parse(upstreamRef);
  }

  // No tracking branch — the branch has never been pushed. Fall back to origin's own default so the
  // diff still measures against a ref origin actually holds.
  const mainResult = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['rev-parse', '--verify', gitRemoteRefsStatics.originMain],
    cwd,
  });

  if (mainResult.exitCode === exitCodeContract.parse(0)) {
    return gitBranchNameContract.parse(gitRemoteRefsStatics.originMain);
  }

  const masterResult = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['rev-parse', '--verify', gitRemoteRefsStatics.originMaster],
    cwd,
  });

  if (masterResult.exitCode === exitCodeContract.parse(0)) {
    return gitBranchNameContract.parse(gitRemoteRefsStatics.originMaster);
  }

  return null;
};
