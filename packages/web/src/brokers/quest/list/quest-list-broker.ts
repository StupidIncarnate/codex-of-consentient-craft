/**
 * PURPOSE: Fetches the list of all quests from the API
 *
 * USAGE:
 * const quests = await questListBroker();
 * // Returns QuestListItem[]
 */
import { questListItemContract } from '@dungeonmaster/shared/contracts';
import type { QuestListItem } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questListBroker = async (): Promise<QuestListItem[]> => {
  const response = await fetchGetAdapter<unknown[]>({ url: webConfigStatics.api.routes.quests });

  return questListItemContract.array().parse(response);
};
