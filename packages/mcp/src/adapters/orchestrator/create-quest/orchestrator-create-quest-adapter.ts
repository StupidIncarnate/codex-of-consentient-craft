/**
 * PURPOSE: Adapter for StartOrchestrator.createQuestForMcp that wraps the orchestrator package
 *
 * USAGE:
 * const { questId, guildSlug } = await orchestratorCreateQuestAdapter();
 * // Returns: { questId, guildSlug } from the orchestrator's quest-mcp-create broker
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';

export const orchestratorCreateQuestAdapter = async (): Promise<{
  questId: QuestId;
  guildSlug: UrlSlug;
}> => StartOrchestrator.createQuestForMcp();
