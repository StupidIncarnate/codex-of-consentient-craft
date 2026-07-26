/**
 * PURPOSE: Lists quests for a guild, ordered most-recent-first, and transforms them into list items
 *
 * USAGE:
 * const items = await QuestListResponder({ guildId });
 * // Returns QuestListItem[] with id, title, status, stepProgress — sorted by updatedAt ?? createdAt descending
 */

import type { GuildId, QuestListItem } from '@dungeonmaster/shared/contracts';

import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { questsToListItemsTransformer } from '../../../transformers/quests-to-list-items/quests-to-list-items-transformer';

export const QuestListResponder = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<QuestListItem[]> => {
  const quests = await questListBroker({ guildId });
  return questsToListItemsTransformer({ quests });
};
