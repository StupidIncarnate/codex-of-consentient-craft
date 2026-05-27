/**
 * PURPOSE: Runs save-time structural invariants on a quest and returns ONLY failed checks
 *
 * USAGE:
 * questSaveInvariantsTransformer({quest});
 * // Returns VerifyQuestCheck[] containing only the failed invariants. Empty array means quest passes.
 *
 * questSaveInvariantsTransformer({quest, currentStatus: 'seek_walk', nextStatus: 'in_progress'});
 * // ALSO runs the 'completeness' scope (whole-quest coverage checks: step contract
 * // references resolve, new contracts have creating step, observables are satisfied).
 * // Completeness checks fire ONLY at the legacy seek_walk → in_progress transition.
 * // Under the `/dumpster-launch` flow, the `approved → in_progress` start-quest hop is
 * // performed BEFORE pathseeker-walk runs (steps/contracts/observables are populated by
 * // the `pathseeker-walk` work item, not by the status transition), so the completeness
 * // scope must NOT fire on that transition. Instead, `questPostWalkHookBroker` invokes
 * // the completeness scope explicitly after `pathseeker-walk` completes (see
 * // `packages/orchestrator/src/brokers/quest/post-walk-hook/quest-post-walk-hook-broker.ts`).
 * // The merged failed-check array mirrors the existing single-array contract — callers
 * // do not need to know which scope produced which failure.
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '@dungeonmaster/shared/contracts';
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
    currentStatus === 'seek_walk' && nextStatus === 'in_progress'
      ? questValidateSpecTransformer({ quest, scope: 'completeness' })
      : [];
  return [...invariantChecks, ...completenessChecks].filter((check) => !check.passed);
};
