/**
 * PURPOSE: Wraps StartOrchestrator.listQuests to provide I/O boundary for quest listing
 *
 * USAGE:
 * const quests = await orchestratorListQuestsAdapter({guildId});
 * // Returns QuestListItem[] from orchestrator
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildId, QuestListItem } from '@dungeonmaster/shared/contracts';

export const orchestratorListQuestsAdapter = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<QuestListItem[]> => StartOrchestrator.listQuests({ guildId });
