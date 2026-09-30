/**
 * PURPOSE: The single body all three quest-pickup surfaces run so none of them can drift out of
 * sync with the others — a user RESUME, startup guild recovery, and the dispatcher's own scan each
 * call this exactly once and differ only in the `trigger` they name. Reach for
 * `worktreeResumeRestoreBroker` instead when the caller already knows it holds a live worktree and
 * needs to act on the git outcome; reach for THIS one when all the caller holds is a quest plus a
 * cwd resolution and a wrong branch must not be allowed to stop the pickup.
 *
 * USAGE:
 * await worktreeEnsureQuestBranchBroker({
 *   quest,
 *   cwdResolution: await questCwdResolveBroker({ questId: quest.id }),
 *   trigger: questResumeTriggerContract.parse('dispatch-scan'),
 * });
 * // { attempted: false, restored: false } when this quest has no worktree branch to put back
 */

import { worktreeEnsureQuestBranchResultContract } from '../../../contracts/worktree-ensure-quest-branch-result/worktree-ensure-quest-branch-result-contract';
import type { WorktreeEnsureQuestBranchResult } from '../../../contracts/worktree-ensure-quest-branch-result/worktree-ensure-quest-branch-result-contract';
import { stderr } from '#gateway/node/process';
import type { Quest } from '@dungeonmaster/shared/contracts';

import type { QuestCwdResolution } from '../../../contracts/quest-cwd-resolution/quest-cwd-resolution-contract';
import type { QuestResumeTrigger } from '../../../contracts/quest-resume-trigger/quest-resume-trigger-contract';
import { worktreeResumeRestoreBroker } from '../resume-restore/worktree-resume-restore-broker';

export const worktreeEnsureQuestBranchBroker = async ({
  quest,
  cwdResolution,
  trigger,
}: {
  quest: Quest;
  cwdResolution: QuestCwdResolution;
  trigger: QuestResumeTrigger;
}): Promise<WorktreeEnsureQuestBranchResult> => {
  const { branchName } = quest;

  // A `repo-root` resolution is a legacy pre-worktree quest, and a quest with no recorded
  // branchName has no branch to be wrong about; neither has anything to restore, and probing git
  // for them would put a `rev-parse` on every dispatcher scan iteration for no possible outcome.
  // A `missing-worktree` resolution is handled by each caller BEFORE it gets here — that halt
  // route is per-trigger (block the quest, name the path) and is deliberately not absorbed.
  if (cwdResolution.kind !== 'worktree' || branchName === undefined) {
    return worktreeEnsureQuestBranchResultContract.parse({ attempted: false, restored: false });
  }

  const { restored, output } = await worktreeResumeRestoreBroker({
    worktreePath: cwdResolution.cwd,
    branchName,
  });

  // A failed re-checkout is not a reason to halt the pickup — the worktree is present, so the
  // resumed agent can still work from whatever branch it is actually on. Log instead of throwing
  // so the mismatch is diagnosable without stopping a resume, a guild sweep, or a dispatch.
  if (!restored) {
    stderr.write(
      `[${trigger}] worktree restore failed for quest ${quest.id} on branch ${branchName}: ${output}\n`,
    );
  }

  return worktreeEnsureQuestBranchResultContract.parse({ attempted: true, restored });
};
