/**
 * PURPOSE: Resolves a workItemId to the QuestId whose `workItems[].id` matches it by walking every guild's quests. Caches hit results in an in-memory Map keyed by workItemId for the server process lifetime so repeated broadcaster lookups don't re-walk on every chat-output frame
 *
 * USAGE:
 * const questId = await questFindByWorkItemIdBroker({ workItemId });
 * // Returns: QuestId of the owning quest, or null when no quest's workItems[] contains workItemId
 *
 * Cache invalidation: hits are cached forever (work items never change quests). Misses are
 * NOT cached — a work item that doesn't exist yet may exist on a future call when its quest's
 * workItems[] grows via questModifyBroker. Callers tolerate `null` returns by skipping questId
 * tagging on the outgoing WS payload.
 *
 * WHEN-TO-USE: From the server's chat-output broadcaster to stamp questId on each WS payload.
 * WHEN-NOT-TO-USE: Anywhere needing live workItem state — this only returns the questId.
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';

const cache = new Map<QuestWorkItemId, QuestId>();

export const questFindByWorkItemIdBroker = async ({
  workItemId,
}: {
  workItemId: QuestWorkItemId;
}): Promise<QuestId | null> => {
  const cached = cache.get(workItemId);
  if (cached !== undefined) {
    return cached;
  }

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
      cache.set(workItemId, match);
      return match;
    }
  }

  return null;
};
