/**
 * PURPOSE: Responder for the MCP create-quest tool — delegates to questMcpCreateBroker
 *
 * USAGE:
 * const result = await QuestMcpCreateResponder({ userRequest, sessionId });
 * // Returns: { questId, guildSlug }
 */

import type { AddQuestInput, QuestId, SessionId, UrlSlug } from '@dungeonmaster/shared/contracts';

import { questMcpCreateBroker } from '../../../brokers/quest/mcp-create/quest-mcp-create-broker';

export const QuestMcpCreateResponder = async ({
  userRequest,
  sessionId,
}: {
  userRequest: AddQuestInput['userRequest'];
  sessionId?: SessionId;
}): Promise<{
  questId: QuestId;
  guildSlug: UrlSlug;
}> => questMcpCreateBroker({ userRequest, ...(sessionId !== undefined && { sessionId }) });
