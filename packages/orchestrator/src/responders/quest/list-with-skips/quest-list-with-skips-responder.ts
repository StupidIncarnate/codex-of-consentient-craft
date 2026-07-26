/**
 * PURPOSE: Lists a guild's quests together with the quest files that could not be loaded, so a short list is self-describing
 *
 * USAGE:
 * const result = await QuestListWithSkipsResponder({ guildId });
 * // Returns { quests: QuestListItem[] (most-recent-first), skipped: SkippedQuestFile[] }
 */

import { questListResultContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, QuestListResult, SkippedQuestFile } from '@dungeonmaster/shared/contracts';

import { questListBroker } from '../../../brokers/quest/list/quest-list-broker';
import { questsToListItemsTransformer } from '../../../transformers/quests-to-list-items/quests-to-list-items-transformer';

export const QuestListWithSkipsResponder = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<QuestListResult> => {
  const skipped: SkippedQuestFile[] = [];

  const quests = await questListBroker({
    guildId,
    onSkipped: ({ skipped: skippedFile }) => {
      skipped.push(skippedFile);
    },
  });

  return questListResultContract.parse({
    quests: questsToListItemsTransformer({ quests }),
    skipped,
  });
};
