/**
 * PURPOSE: Runs save-time structural invariants on a quest and returns ONLY failed checks
 *
 * USAGE:
 * questSaveInvariantsTransformer({quest});
 * // Returns VerifyQuestCheck[] containing only the failed invariants. Empty array means quest passes.
 *
 * Structural ('invariants' scope) checks only — acceptance against the spec is verified at
 * runtime by ward + the verify roles looping to done, not by a static save-time gate. The
 * currentStatus/nextStatus params stay on the signature so callers gating future
 * transition-scoped checks don't ripple.
 */
import type { QuestStatus, QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '@dungeonmaster/shared/contracts';
import { questValidateSpecTransformer } from '../quest-validate-spec/quest-validate-spec-transformer';

type Quest = ReturnType<typeof QuestStub>;

export const questSaveInvariantsTransformer = ({
  quest,
}: {
  quest: Quest;
  currentStatus?: QuestStatus;
  nextStatus?: QuestStatus;
}): VerifyQuestCheck[] => {
  const invariantChecks = questValidateSpecTransformer({ quest, scope: 'invariants' });
  return invariantChecks.filter((check) => !check.passed);
};
