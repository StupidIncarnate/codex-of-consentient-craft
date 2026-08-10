/**
 * PURPOSE: Owns the reverse lookup from a dispatched sub-agent's work item back to the quest that
 * dispatched it, for callers holding an id an emit carried rather than a session the CLI opened.
 * Reach for this over questFindBySessionIdBroker, which answers the same question from the other
 * direction and matches ONLY chat-role work items — a Task-dispatched relay role has no chat
 * sessionId to find it by. Every call re-walks the home, so a work item that has since left its
 * quest stops resolving to it.
 *
 * USAGE:
 * const questId = await questFindByWorkItemIdBroker({ workItemId });
 * // Returns: QuestId of the owning quest, or null when no quest's workItems[] contains workItemId
 *
 * WHEN-TO-USE: From the server's chat-output broadcaster to stamp questId on each WS payload.
 * WHEN-NOT-TO-USE: Anywhere needing live workItem state — this only returns the questId.
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';

export const questFindByWorkItemIdBroker = async ({
  workItemId,
}: {
  workItemId: QuestWorkItemId;
}): Promise<QuestId | null> => {
  const guilds = await guildListBroker();
  const validGuilds = guilds.filter((g) => g.valid);

  // Walk in parallel so a slow guild can't gate the rest. We can't early-return from a
  // Promise.all loop; instead, resolve each guild to its match (or null) and pick the
  // first non-null in source order.
  const perGuildMatches = await Promise.all(
    validGuilds.map(async (guild) => {
      try {
        const quests = await questListBroker({ guildId: guild.id });
        for (const quest of quests) {
          if (quest.workItems.some((wi) => wi.id === workItemId)) {
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
