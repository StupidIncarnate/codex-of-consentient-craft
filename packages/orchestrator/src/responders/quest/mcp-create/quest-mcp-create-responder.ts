/**
 * PURPOSE: Responder for the MCP create-quest tool — delegates to questMcpCreateBroker
 *
 * USAGE:
 * const result = await QuestMcpCreateResponder({ userRequest, sessionId });
 * // Returns: { questId, guildSlug }
 */

import type { AddQuestInput, QuestType, Quest, Session } from '@dungeonmaster/shared/contracts';

import { questMcpCreateBroker } from '../../../brokers/quest/mcp-create/quest-mcp-create-broker';

export const QuestMcpCreateResponder = async ({
  userRequest,
  questType,
  sessionId,
}: {
  userRequest: AddQuestInput['userRequest'];
  questType?: QuestType;
  sessionId?: Session['id'];
}): Promise<{
  questId: Quest['id'];
  guildSlug: string;
}> =>
  questMcpCreateBroker({
    userRequest,
    ...(questType !== undefined && { questType }),
    ...(sessionId !== undefined && { sessionId }),
  });
