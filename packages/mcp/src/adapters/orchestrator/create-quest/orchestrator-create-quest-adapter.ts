/**
 * PURPOSE: Adapter for StartOrchestrator.createQuestForMcp that wraps the orchestrator package
 *
 * USAGE:
 * const { questId, guildSlug } = await orchestratorCreateQuestAdapter({ userRequest });
 * // Returns: { questId, guildSlug } from the orchestrator's quest-mcp-create broker
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { CreateQuestInput } from '../../../contracts/create-quest-input/create-quest-input-contract';
import type { QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';

export const orchestratorCreateQuestAdapter = async ({
  userRequest,
}: {
  userRequest: CreateQuestInput['userRequest'];
}): Promise<{
  questId: QuestId;
  guildSlug: UrlSlug;
}> => StartOrchestrator.createQuestForMcp({ userRequest });
