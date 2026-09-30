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

import { type QuestBranchName } from '@dungeonmaster/shared/contracts';
import { checkout, currentBranch } from '#gateway/bin/git';

const COLON_SEPARATOR = ': ';
const EXIT_CODE_MARKER = 'with exit code ';

export const worktreeResumeRestoreBroker = async ({
  worktreePath,
  branchName,
}: {
  worktreePath: string;
  branchName: QuestBranchName;
}): Promise<{ restored: boolean; currentBranch: string; output: string }> => {
  const branchAttempt = await (async () => {
    try {
      const result = await currentBranch({ cwd: worktreePath });
      return { success: true as const, branch: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const markerIndex = message.indexOf(EXIT_CODE_MARKER);
      const colonIndex = markerIndex === -1 ? -1 : message.indexOf(COLON_SEPARATOR, markerIndex);
      const output =
        colonIndex === -1 ? message : message.slice(colonIndex + COLON_SEPARATOR.length);
      return { success: false as const, error: output };
    }
  })();

  if (!branchAttempt.success) {
    return {
      restored: false,
      currentBranch: branchAttempt.error,
      output: branchAttempt.error,
    };
  }

  const { branch: rawBranch } = branchAttempt;

  const branch =
    rawBranch === null
      ? null
      : (rawBranch
          .split('\n')
          .map((line) => line.trim())
          .find((line) => line.length > 0) ?? null);

  if (branch !== null && branch === String(branchName)) {
    return {
      restored: true,
      currentBranch: branch,
      output: rawBranch,
    };
  }

  const checkoutResult = await checkout({ cwd: worktreePath, branchName });

  return {
    restored: checkoutResult.exitCode === 0,
    currentBranch: (branch ?? 'HEAD'),
    output: checkoutResult.output,
  };
};
