/**
 * PURPOSE: Fetches the list of quests for a given guild from the API, along with the quest files the server could not read
 *
 * USAGE:
 * const {quests, skipped} = await questListBroker({guildId});
 * // Returns {quests: QuestListItem[], skipped: SkippedQuestFile[]}
 */
import { questListResultContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestListResult } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questListBroker = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<QuestListResult> => {
  const url = `${webConfigStatics.api.routes.quests}?guildId=${encodeURIComponent(guildId)}`;
  const response = await fetchJson({ url });

  return questListResultContract.parse(response);
};
