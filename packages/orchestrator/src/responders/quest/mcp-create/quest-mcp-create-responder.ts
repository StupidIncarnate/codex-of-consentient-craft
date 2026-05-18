/**
 * PURPOSE: Responder for the MCP create-quest tool — delegates to questMcpCreateBroker
 *
 * USAGE:
 * const result = await QuestMcpCreateResponder();
 * // Returns: { questId, guildSlug }
 */

import type { QuestId, UrlSlug } from '@dungeonmaster/shared/contracts';

import { questMcpCreateBroker } from '../../../brokers/quest/mcp-create/quest-mcp-create-broker';

export const QuestMcpCreateResponder = async (): Promise<{
  questId: QuestId;
  guildSlug: UrlSlug;
}> => questMcpCreateBroker();
