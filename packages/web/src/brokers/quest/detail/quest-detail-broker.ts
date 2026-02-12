/**
 * PURPOSE: Fetches a single quest by its ID from the API
 *
 * USAGE:
 * const quest = await questDetailBroker({questId});
 * // Returns Quest object
 */
import { questContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questDetailBroker = async ({ questId }: { questId: QuestId }): Promise<Quest> => {
  const response = await fetchGetAdapter<unknown>({
    url: webConfigStatics.api.routes.questById.replace(':questId', questId),
  });

  return questContract.parse(response);
};
