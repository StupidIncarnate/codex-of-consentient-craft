/**
 * PURPOSE: Adapter for StartOrchestrator.getQuestProjection that wraps the orchestrator package
 *
 * USAGE:
 * const projection = await orchestratorGetQuestProjectionAdapter({ questId });
 * // Returns: QuestProjection — every MINTED scope's real work items, continued forward through
 * // `agentFlowStatics`'s `routes.done` edge — or throws when the quest cannot be found
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestProjection } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQuestProjectionAdapter = async ({
  questId,
}: {
  questId: string;
}): Promise<QuestProjection> => StartOrchestrator.getQuestProjection({ questId });
