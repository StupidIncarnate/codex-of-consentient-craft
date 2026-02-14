/**
 * PURPOSE: Adapter for StartOrchestrator.listQuests that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorListQuestsAdapter({ guildId });
 * // Returns: QuestListItem[] or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildId, QuestListItem } from '@dungeonmaster/shared/contracts';

export const orchestratorListQuestsAdapter = async ({
  guildId,
}: {
  guildId: GuildId;
}): Promise<QuestListItem[]> => StartOrchestrator.listQuests({ guildId });
