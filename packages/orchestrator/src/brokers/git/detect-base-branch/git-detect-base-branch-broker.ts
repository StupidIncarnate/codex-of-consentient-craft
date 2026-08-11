/**
 * PURPOSE: Reach for this over ward's own git-detect-default-branch-broker when the caller needs
 * Start's worktree-lifecycle answer — the shared BaseBranchName enum brand, resolved through the
 * orchestrator's gitVerifyRefAdapter — rather than ward's lint-scoping GitBranchName brand and its
 * own spawn call.
 *
 * USAGE:
 * const branch = await gitDetectBaseBranchBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns BaseBranchName('main'), BaseBranchName('master'), or null if neither exists locally
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { baseBranchNameContract, type BaseBranchName } from '@dungeonmaster/shared/contracts';
import { baseBranchStatics } from '@dungeonmaster/shared/statics';

import { gitVerifyRefAdapter } from '../../../adapters/git/verify-ref/git-verify-ref-adapter';

export const gitDetectBaseBranchBroker = async ({
  cwd,
  candidates = baseBranchStatics.candidates,
}: {
  cwd: AbsoluteFilePath;
  // Internal: shrinks on each tail-recursive probe. Callers should leave this at its default;
  // the broker walks baseBranchStatics.candidates itself, in order.
  candidates?: readonly string[];
}): Promise<BaseBranchName | null> => {
  const [candidate, ...rest] = candidates;

  if (candidate === undefined) {
    return null;
  }

  const exists = await gitVerifyRefAdapter({ cwd, ref: candidate });

  if (exists) {
    return baseBranchNameContract.parse(candidate);
  }

  return gitDetectBaseBranchBroker({ cwd, candidates: rest });
};
