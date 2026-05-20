/**
 * PURPOSE: Adapter for StartOrchestrator.createQuestForMcp that wraps the orchestrator package.
 * Accepts an optional sessionId (resolved by the calling responder via claudeCodeSessionResolveBroker)
 * and forwards it so the chaoswhisperer seed work item is stamped with the session that created the quest.
 *
 * USAGE:
 * const { questId, guildSlug } = await orchestratorCreateQuestAdapter({ userRequest, sessionId });
 * // Returns: { questId, guildSlug } from the orchestrator's quest-mcp-create broker
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId, SessionId, UrlSlug } from '@dungeonmaster/shared/contracts';
import type { CreateQuestInput } from '../../../contracts/create-quest-input/create-quest-input-contract';

export const orchestratorCreateQuestAdapter = async ({
  userRequest,
  sessionId,
}: {
  userRequest: CreateQuestInput['userRequest'];
  sessionId?: SessionId;
}): Promise<{
  questId: QuestId;
  guildSlug: UrlSlug;
}> =>
  StartOrchestrator.createQuestForMcp({
    userRequest,
    ...(sessionId !== undefined && { sessionId }),
  });
