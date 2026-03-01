/**
 * PURPOSE: Verifies quest integrity by delegating to questVerifyBroker
 *
 * USAGE:
 * const result = await QuestVerifyResponder({ questId: 'add-auth' });
 * // Returns VerifyQuestResult with success status and checks array
 */

import { questVerifyBroker } from '../../../brokers/quest/verify/quest-verify-broker';
import { verifyQuestInputContract } from '../../../contracts/verify-quest-input/verify-quest-input-contract';
import type { VerifyQuestResult } from '../../../contracts/verify-quest-result/verify-quest-result-contract';

export const QuestVerifyResponder = async ({
  questId,
}: {
  questId: string;
}): Promise<VerifyQuestResult> => {
  const input = verifyQuestInputContract.parse({ questId });
  return questVerifyBroker({ input });
};
