/**
 * PURPOSE: Runs save-time structural invariants on a quest and returns ONLY failed checks
 *
 * USAGE:
 * questSaveInvariantsTransformer({quest});
 * // Returns VerifyQuestCheck[] containing only the failed invariants. Empty array means quest passes.
 *
 * questSaveInvariantsTransformer({quest, currentStatus: 'seek_scope', nextStatus: 'in_progress'});
 * // ALSO runs the 'completeness' scope (whole-quest coverage checks: step contract
 * // references resolve, new contracts have creating step, observables are satisfied).
 * // Completeness fires on the transition INTO `in_progress` FROM a pathseeker-running status
 * // (`seek_scope`/`seek_synth`/`seek_walk`) — the moment PathSeeker finishes planning and
 * // promotes the quest to execution. This is the retryable gate: a failing check rejects the
 * // `modify-quest` status write with `failedChecks`, so PathSeeker fixes the flagged data and
 * // re-issues the transition. It does NOT fire on `blocked`/`paused → in_progress`, whose
 * // currentStatus is not pathseeker-running, so those resume transitions are never gated on
 * // half-assembled coverage. `questPostWalkHookBroker` re-runs the same scope as a backstop
 * // after PathSeeker signals complete. The merged failed-check array mirrors the single-array
 * // contract — callers do not need to know which scope produced which failure.
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '@dungeonmaster/shared/contracts';
import { isPathseekerRunningQuestStatusGuard } from '@dungeonmaster/shared/guards';
import { questValidateSpecTransformer } from '../quest-validate-spec/quest-validate-spec-transformer';

type Quest = ReturnType<typeof QuestStub>;

export const questSaveInvariantsTransformer = ({
  quest,
  currentStatus,
  nextStatus,
}: {
  quest: Quest;
  currentStatus?: QuestStatus;
  nextStatus?: QuestStatus;
}): VerifyQuestCheck[] => {
  const invariantChecks = questValidateSpecTransformer({ quest, scope: 'invariants' });
  const completenessChecks =
    currentStatus !== undefined &&
    isPathseekerRunningQuestStatusGuard({ status: currentStatus }) &&
    nextStatus === 'in_progress'
      ? questValidateSpecTransformer({ quest, scope: 'completeness' })
      : [];
  return [...invariantChecks, ...completenessChecks].filter((check) => !check.passed);
};
