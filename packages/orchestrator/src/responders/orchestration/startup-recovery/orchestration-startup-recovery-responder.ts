/**
 * PURPOSE: On server start, scans all guilds for active quests and launches orchestration loops for recovery
 *
 * USAGE:
 * const recoveredQuestIds = await OrchestrationStartupRecoveryResponder({ guildItems });
 * // Returns array of quest IDs that were recovered across all guilds
 */

import type { GuildListItem, QuestId } from '@dungeonmaster/shared/contracts';

import { RecoverGuildLayerResponder } from './recover-guild-layer-responder';

export const OrchestrationStartupRecoveryResponder = async ({
  guildItems,
}: {
  guildItems: GuildListItem[];
}): Promise<QuestId[]> => {
  const results = await Promise.all(
    guildItems.map(async (guildItem) => RecoverGuildLayerResponder({ guildItem })),
  );

  return results.flat();
};
