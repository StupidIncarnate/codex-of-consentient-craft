/**
 * PURPOSE: Fetches the current cross-guild quest execution queue from the API
 *
 * USAGE:
 * const entries = await questQueueBroker();
 * // Returns QuestQueueEntry[] ordered head-first
 */
import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { questQueueResultContract } from '../../../contracts/quest-queue-result/quest-queue-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questQueueBroker = async (): Promise<QuestQueueEntry[]> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.questsQueue,
  });

  return questQueueResultContract.parse(response).entries;
};
