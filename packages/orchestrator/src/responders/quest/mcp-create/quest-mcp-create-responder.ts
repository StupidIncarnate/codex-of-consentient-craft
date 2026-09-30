/**
 * PURPOSE: Responder for the MCP create-quest tool — delegates to questMcpCreateBroker
 *
 * USAGE:
 * const result = await QuestMcpCreateResponder({ userRequest, sessionId });
 * // Returns: { questId, guildSlug }
 */

import { questMcpCreateResponderResultContract } from '../../../contracts/quest-mcp-create-responder-result/quest-mcp-create-responder-result-contract';
import type { QuestMcpCreateResponderResult } from '../../../contracts/quest-mcp-create-responder-result/quest-mcp-create-responder-result-contract';
import type { AddQuestInput, QuestType, Session } from '@dungeonmaster/shared/contracts';

import { questMcpCreateBroker } from '../../../brokers/quest/mcp-create/quest-mcp-create-broker';

export const QuestMcpCreateResponder = async ({
  userRequest,
  questType,
  sessionId,
}: {
  userRequest: AddQuestInput['userRequest'];
  questType?: QuestType;
  sessionId?: Session['id'];
}): Promise<QuestMcpCreateResponderResult> =>
  questMcpCreateResponderResultContract.parse(questMcpCreateBroker({
    userRequest,
    ...(questType !== undefined && { questType }),
    ...(sessionId !== undefined && { sessionId }),
  }));
