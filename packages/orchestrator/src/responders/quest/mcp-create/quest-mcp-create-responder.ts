/**
 * PURPOSE: Responder for the MCP create-quest tool — delegates to questMcpCreateBroker
 *
 * USAGE:
 * const result = await QuestMcpCreateResponder({ userRequest });
 * // Returns: { questId, guildSlug }
 */

import type { AddQuestInput, QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';

import { questMcpCreateBroker } from '../../../brokers/quest/mcp-create/quest-mcp-create-broker';

export const QuestMcpCreateResponder = async ({
  userRequest,
}: {
  userRequest: AddQuestInput['userRequest'];
}): Promise<{
  questId: QuestId;
  guildSlug: UrlSlug;
}> => questMcpCreateBroker({ userRequest });
