/**
 * PURPOSE: Modifies a quest via questModifyBroker
 *
 * USAGE:
 * const result = await QuestModifyResponder({ questId: 'add-auth', input: {...} });
 * // Returns ModifyQuestResult with success status
 */

import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import type { ModifyQuestInput } from '../../../contracts/modify-quest-input/modify-quest-input-contract';
import type { ModifyQuestResult } from '../../../contracts/modify-quest-result/modify-quest-result-contract';

export const QuestModifyResponder = async ({
  questId,
  input,
}: {
  questId: string;
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => {
  const result = await questModifyBroker({ input: { ...input, questId } as ModifyQuestInput });

  return result;
};
