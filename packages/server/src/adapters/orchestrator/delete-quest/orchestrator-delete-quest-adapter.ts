/**
 * PURPOSE: Adapter for StartOrchestrator.deleteQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorDeleteQuestAdapter({ questId, guildId });
 * // Returns: { deleted: boolean }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorDeleteQuestAdapter = async ({
  questId,
  guildId,
}: {
  questId: QuestId;
  guildId: GuildId;
}): Promise<{ deleted: boolean }> => StartOrchestrator.deleteQuest({ questId, guildId });
