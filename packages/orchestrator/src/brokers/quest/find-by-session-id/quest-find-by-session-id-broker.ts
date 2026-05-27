/**
 * PURPOSE: Resolves a sessionId to the QuestId whose chaoswhisperer workItem has that sessionId
 *
 * USAGE:
 * const questId = await questFindBySessionIdBroker({ sessionId });
 * // Returns: QuestId of the quest whose chaoswhisperer workItem.sessionId matches, or null
 *
 * WHEN-TO-USE: From the POST-AskUserQuestion hook to look up the quest the hook session is
 *   running in, so it can PATCH design decisions onto the right quest.
 * WHEN-NOT-TO-USE: Anywhere needing live workItem state — this only returns the questId.
 */

import type { QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';

export const questFindBySessionIdBroker = async ({
  sessionId,
}: {
  sessionId: SessionId;
}): Promise<QuestId | null> => {
  const guilds = await guildListBroker();
  const validGuilds = guilds.filter((g) => g.valid);

  const perGuildMatches = await Promise.all(
    validGuilds.map(async (guild) => {
      try {
        const quests = await questListBroker({ guildId: guild.id });
        for (const quest of quests) {
          if (
            quest.workItems.some((wi) => wi.role === 'chaoswhisperer' && wi.sessionId === sessionId)
          ) {
            return quest.id;
          }
        }
        return null;
      } catch {
        return null;
      }
    }),
  );

  for (const match of perGuildMatches) {
    if (match !== null) {
      return match;
    }
  }

  return null;
};
