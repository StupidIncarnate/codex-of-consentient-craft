/**
 * PURPOSE: Runs save-time structural invariants on a quest and returns ONLY failed checks
 *
 * USAGE:
 * questSaveInvariantsTransformer({quest});
 * // Returns VerifyQuestCheck[] containing only the failed invariants. Empty array means quest passes.
 *
 * questSaveInvariantsTransformer({quest, nextStatus: 'in_progress'});
 * // ALSO runs the 'completeness' scope (whole-quest coverage checks: step contract
 * // references resolve, new contracts have creating step, observables are satisfied).
 * // Completeness checks fire ONLY at the seek_plan → in_progress transition; during
 * // earlier seek_synth slice-by-slice commits the plan is half-assembled and these
 * // checks would reject legitimate intermediate writes. The merged failed-check array
 * // mirrors the existing single-array contract — callers do not need to know which
 * // scope produced which failure.
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '@dungeonmaster/shared/contracts';
import { questValidateSpecTransformer } from '../quest-validate-spec/quest-validate-spec-transformer';

type Quest = ReturnType<typeof QuestStub>;

export const questSaveInvariantsTransformer = ({
  quest,
  nextStatus,
}: {
  quest: Quest;
  nextStatus?: QuestStatus;
}): VerifyQuestCheck[] => {
  const invariantChecks = questValidateSpecTransformer({ quest, scope: 'invariants' });
  const completenessChecks =
    nextStatus === 'in_progress'
      ? questValidateSpecTransformer({ quest, scope: 'completeness' })
      : [];
  return [...invariantChecks, ...completenessChecks].filter((check) => !check.passed);
};
