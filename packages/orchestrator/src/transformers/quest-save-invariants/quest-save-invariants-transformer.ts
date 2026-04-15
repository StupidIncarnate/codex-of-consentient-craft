/**
 * PURPOSE: Runs save-time structural invariants on a quest and returns ONLY failed checks
 *
 * USAGE:
 * questSaveInvariantsTransformer({quest});
 * // Returns VerifyQuestCheck[] containing only the failed invariants. Empty array means quest passes.
 */
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import type { VerifyQuestCheck } from '../../contracts/verify-quest-check/verify-quest-check-contract';
import { questValidateSpecTransformer } from '../quest-validate-spec/quest-validate-spec-transformer';

type Quest = ReturnType<typeof QuestStub>;

export const questSaveInvariantsTransformer = ({ quest }: { quest: Quest }): VerifyQuestCheck[] => {
  const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });
  return checks.filter((check) => !check.passed);
};
