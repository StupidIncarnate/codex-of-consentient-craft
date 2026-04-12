/**
 * PURPOSE: Validates a quest spec structurally by delegating to questValidateSpecBroker
 *
 * USAGE:
 * const result = await QuestValidateSpecResponder({ questId: 'add-auth' });
 * // Returns VerifyQuestResult with success status and checks array
 */

import { questValidateSpecBroker } from '../../../brokers/quest/validate-spec/quest-validate-spec-broker';
import { validateSpecInputContract } from '../../../contracts/validate-spec-input/validate-spec-input-contract';
import type { VerifyQuestResult } from '../../../contracts/verify-quest-result/verify-quest-result-contract';

export const QuestValidateSpecResponder = async ({
  questId,
}: {
  questId: string;
}): Promise<VerifyQuestResult> => {
  const input = validateSpecInputContract.parse({ questId });
  return questValidateSpecBroker({ input });
};
