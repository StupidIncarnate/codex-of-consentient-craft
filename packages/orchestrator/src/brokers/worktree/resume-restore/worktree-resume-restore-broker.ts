/**
 * PURPOSE: Reach for this over `worktreeDiscardBroker` when the worktree is expected to survive —
 * discard tears down a half-built worktree after a failed Start, while this one puts a surviving
 * worktree back on its branch without touching its contents. Never runs `git stash`, `git reset`,
 * `git checkout -- <path>`, `git clean`, or a forced checkout: the uncommitted edits an interrupted
 * agent left behind are the resumed session's starting point, so a checkout is skipped entirely when
 * the worktree is already on the quest branch, and only ever passes a bare branch name (never `-f`,
 * `-B`, or `--`) when it has to run.
 *
 * USAGE:
 * const { restored, currentBranch, output } = await worktreeResumeRestoreBroker({
 *   worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' }),
 *   branchName: QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' }),
 * });
 * // restored is true once the worktree is confirmed on branchName, whether or not a checkout ran
 */

import {
  errorMessageContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type QuestBranchName,
} from '@dungeonmaster/shared/contracts';

import { gitCheckoutAdapter } from '../../../adapters/git/checkout/git-checkout-adapter';
import { gitCurrentBranchAdapter } from '../../../adapters/git/current-branch/git-current-branch-adapter';

export const worktreeResumeRestoreBroker = async ({
  worktreePath,
  branchName,
}: {
  worktreePath: AbsoluteFilePath;
  branchName: QuestBranchName;
}): Promise<{ restored: boolean; currentBranch: ErrorMessage; output: ErrorMessage }> => {
  const { exitCode, output } = await gitCurrentBranchAdapter({ cwd: worktreePath });

  const currentBranch = errorMessageContract.parse(
    output
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? '',
  );

  if (exitCode !== 0) {
    return { restored: false, currentBranch, output };
  }

  if (currentBranch === errorMessageContract.parse(branchName)) {
    return { restored: true, currentBranch, output };
  }

  const checkoutResult = await gitCheckoutAdapter({ cwd: worktreePath, branchName });

  return {
    restored: checkoutResult.exitCode === 0,
    currentBranch,
    output: checkoutResult.output,
  };
};
