/**
 * PURPOSE: Reach for this over ward's own git-detect-default-branch-broker when the caller needs
 * Start's worktree-lifecycle answer — the shared BaseBranchName enum brand, resolved through the
 * the gateway's verifyRef — rather than ward's lint-scoping GitBranchName brand and its
 * own spawn call.
 *
 * USAGE:
 * const branch = await gitDetectBaseBranchBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns BaseBranchName('main'), BaseBranchName('master'), or null if neither exists locally
 */

import { baseBranchNameContract, type BaseBranchName } from '@dungeonmaster/shared/contracts';
import { baseBranchStatics } from '@dungeonmaster/shared/statics';

import { verifyRef } from '#gateway/bin/git';

export const gitDetectBaseBranchBroker = async ({
  cwd,
  candidates = baseBranchStatics.candidates,
}: {
  cwd: string;
  // Internal: shrinks on each tail-recursive probe. Callers should leave this at its default;
  // the broker walks baseBranchStatics.candidates itself, in order.
  candidates?: readonly string[];
}): Promise<BaseBranchName | null> => {
  const [candidate, ...rest] = candidates;

  if (candidate === undefined) {
    return null;
  }

  const exists = await verifyRef({ cwd, ref: candidate });

  if (exists) {
    return baseBranchNameContract.parse(candidate);
  }

  return gitDetectBaseBranchBroker({ cwd, candidates: rest });
};
