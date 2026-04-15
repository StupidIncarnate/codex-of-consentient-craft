/**
 * PURPOSE: Retrieves a quest by ID with optional stage filtering via questGetBroker
 *
 * USAGE:
 * const result = await QuestGetResponder({ questId: 'add-auth', stage: 'spec' });
 * // Returns GetQuestResult with quest data filtered by stage
 */

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { GetQuestResult } from '@dungeonmaster/shared/contracts';

export const QuestGetResponder = async ({
  questId,
  stage,
}: {
  questId: string;
  stage?: string;
}): Promise<GetQuestResult> => {
  const input = getQuestInputContract.parse({ questId, ...(stage && { stage }) });
  return questGetBroker({ input });
};
