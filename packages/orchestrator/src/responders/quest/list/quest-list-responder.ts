/**
 * PURPOSE: Lists quests for a guild and transforms them into list items
 *
 * USAGE:
 * const items = await QuestListResponder({ guildId });
 * // Returns QuestListItem[] with id, title, status, stepProgress
 */

import type { GuildId, QuestListItem } from '@dungeonmaster/shared/contracts';

import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { questToListItemTransformer } from '../../../transformers/quest-to-list-item/quest-to-list-item-transformer';

export const QuestListResponder = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<QuestListItem[]> => {
  const quests = await questListBroker({ guildId });
  return quests.map((quest) => questToListItemTransformer({ quest }));
};
