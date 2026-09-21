/**
 * PURPOSE: Adapter for StartOrchestrator.getQuestWork that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorGetQuestWorkAdapter({ questId, workItemId });
 * // Returns { view, planText } — exactly one of the two is non-null
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorGetQuestWorkAdapter = async ({
  questId,
  workItemId,
  operationItemId,
}: {
  questId: string;
  workItemId?: string;
  operationItemId?: string;
}): ReturnType<typeof StartOrchestrator.getQuestWork> =>
  StartOrchestrator.getQuestWork({
    questId,
    ...(workItemId !== undefined && { workItemId }),
    ...(operationItemId !== undefined && { operationItemId }),
  });
