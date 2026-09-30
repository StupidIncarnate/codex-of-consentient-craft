/**
 * PURPOSE: Builds a valid QuestMcpCreateResponderResult for tests
 *
 * USAGE:
 * QuestMcpCreateResponderResultStub();
 * // Returns a valid QuestMcpCreateResponderResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questMcpCreateResponderResultContract } from './quest-mcp-create-responder-result-contract';
import type { QuestMcpCreateResponderResult } from './quest-mcp-create-responder-result-contract';

export const QuestMcpCreateResponderResultStub = ({
  ...props
}: StubArgument<QuestMcpCreateResponderResult> = {}): QuestMcpCreateResponderResult =>
  questMcpCreateResponderResultContract.parse({
    questId: QuestStub().id,
    guildSlug: 'sample',
    ...props,
  });
