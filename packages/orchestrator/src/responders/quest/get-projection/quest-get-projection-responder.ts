/**
 * PURPOSE: Validates a quest id and returns the likely remainder of its execution by delegating to
 * questGetProjectionBroker
 *
 * USAGE:
 * const projection = await QuestGetProjectionResponder({ questId: 'add-auth' });
 * // Returns QuestProjection — every MINTED scope's real work items, continued forward through
 * // `agentFlowStatics`'s `routes.done` edge
 *
 * IT RETURNS THE STRUCTURE, NOT TEXT, mirroring `QuestGetSummaryResponder` — the web renders it and
 * an MCP caller would parse it the same way, so neither should have to parse prose back apart.
 *
 * An unknown quest id propagates the broker's throw. A projection is a claim about a real quest's
 * real scopes, so there is no honest empty value to return when the quest cannot be found.
 */

import { questIdContract } from '@dungeonmaster/shared/contracts';
import type { QuestProjection } from '@dungeonmaster/shared/contracts';

import { questGetProjectionBroker } from '../../../brokers/quest/get-projection/quest-get-projection-broker';

export const QuestGetProjectionResponder = async ({
  questId,
}: {
  questId: string;
}): Promise<QuestProjection> =>
  questGetProjectionBroker({ questId: questIdContract.parse(questId) });
