/**
 * PURPOSE: Fetches the current cross-guild quest execution queue from the API
 *
 * USAGE:
 * const entries = await questQueueBroker();
 * // Returns QuestQueueEntry[] ordered head-first
 */
import { questQueueEntryContract } from '@dungeonmaster/shared/contracts';
import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questQueueBroker = async (): Promise<QuestQueueEntry[]> => {
  const response = await fetchGetAdapter<{ entries: unknown[] }>({
    url: webConfigStatics.api.routes.questsQueue,
  });

  return questQueueEntryContract.array().parse(response.entries);
};
