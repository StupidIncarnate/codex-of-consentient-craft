/**
 * PURPOSE: Fetches the list of quests for a given guild from the API
 *
 * USAGE:
 * const quests = await questListBroker({guildId});
 * // Returns QuestListItem[]
 */
import { questListItemContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestListItem } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questListBroker = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<QuestListItem[]> => {
  const url = `${webConfigStatics.api.routes.quests}?guildId=${encodeURIComponent(guildId)}`;
  const response = await fetchGetAdapter<unknown[]>({ url });

  return questListItemContract.array().parse(response);
};
