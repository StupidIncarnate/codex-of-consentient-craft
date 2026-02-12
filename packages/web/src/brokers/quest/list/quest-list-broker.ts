/**
 * PURPOSE: Fetches the list of all quests from the API
 *
 * USAGE:
 * const quests = await questListBroker();
 * // Returns QuestListItem[]
 */
import type { QuestListItem } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questListBroker = async (): Promise<QuestListItem[]> =>
  fetchGetAdapter<QuestListItem[]>({ url: webConfigStatics.api.routes.quests });
