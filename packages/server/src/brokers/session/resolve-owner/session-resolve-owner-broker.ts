/**
 * PURPOSE: Resolves which quest (if any) owns a given session within a guild
 *
 * USAGE:
 * const result = await sessionResolveOwnerBroker({ guildId: GuildIdStub(), sessionId: SessionIdStub() });
 * // Returns: { questId: QuestIdStub() } or { questId: null }
 */

import { questContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, SessionId, QuestId, Quest } from '@dungeonmaster/shared/contracts';

import { orchestratorGetGuildAdapter } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { orchestratorListQuestsAdapter } from '../../../adapters/orchestrator/list-quests/orchestrator-list-quests-adapter';
import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';

export const sessionResolveOwnerBroker = async ({
  guildId,
  sessionId,
}: {
  guildId: GuildId;
  sessionId: SessionId;
}): Promise<{ questId: QuestId | null; quest?: Quest }> => {
  const guild = await orchestratorGetGuildAdapter({ guildId });

  const guildMatch = guild.chatSessions.find((s) => s.sessionId === sessionId);

  if (guildMatch) {
    return { questId: null };
  }

  const quests = await orchestratorListQuestsAdapter({ guildId });
  const questResults = await Promise.all(
    quests.map(async (q) => {
      const result = await orchestratorGetQuestAdapter({ questId: q.id });
      const questRaw: unknown = Reflect.get(result, 'quest');

      if (!questRaw || typeof questRaw !== 'object') {
        return null;
      }

      const quest = questContract.parse(questRaw);
      const match = quest.chatSessions.find((s) => s.sessionId === sessionId);
      return match ? { questId: q.id, quest } : null;
    }),
  );

  const matchingResult = questResults.find((r) => r !== null);

  if (matchingResult) {
    return matchingResult;
  }

  return { questId: null };
};
