/**
 * PURPOSE: Retrieves a quest by ID with optional stage filtering, or a rendered one-flow slice,
 * via questGetBroker
 *
 * USAGE:
 * const result = await QuestGetResponder({ questId: 'add-auth', stage: 'spec' });
 * // Returns GetQuestResult with quest data filtered by stage
 *
 * const slice = await QuestGetResponder({ questId: 'add-auth', flowId: 'login', packageName: 'web' });
 * // Returns GetQuestResult carrying `flowSlice` — that flow rendered whole for web
 */

import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { GetQuestResult } from '@dungeonmaster/shared/contracts';

export const QuestGetResponder = async ({
  questId,
  stage,
  flowId,
  packageName,
}: {
  questId: string;
  stage?: string;
  flowId?: string;
  packageName?: string;
}): Promise<GetQuestResult> => {
  const input = getQuestInputContract.parse({
    questId,
    ...(stage && { stage }),
    ...(flowId && { flowId }),
    ...(packageName && { packageName }),
  });
  return questGetBroker({ input });
};
