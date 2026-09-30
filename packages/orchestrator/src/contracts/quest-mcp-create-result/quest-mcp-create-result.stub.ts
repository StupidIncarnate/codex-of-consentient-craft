/**
 * PURPOSE: Builds a valid QuestMcpCreateResult for tests
 *
 * USAGE:
 * QuestMcpCreateResultStub();
 * // Returns a valid QuestMcpCreateResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questMcpCreateResultContract } from './quest-mcp-create-result-contract';
import type { QuestMcpCreateResult } from './quest-mcp-create-result-contract';

export const QuestMcpCreateResultStub = ({
  ...props
}: StubArgument<QuestMcpCreateResult> = {}): QuestMcpCreateResult =>
  questMcpCreateResultContract.parse({ questId: QuestStub().id, guildSlug: 'sample', ...props });
