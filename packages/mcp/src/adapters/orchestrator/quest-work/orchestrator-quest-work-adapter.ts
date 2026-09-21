/**
 * PURPOSE: Adapter for StartOrchestrator.questWork that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorQuestWorkAdapter({ questId, workItemId, payload });
 * // Returns the applied QuestWorkResult, or throws — quest-work never returns a failure shape
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorQuestWorkAdapter = async ({
  questId,
  workItemId,
  payload,
}: {
  questId: string;
  workItemId: string;
  payload: unknown;
}): ReturnType<typeof StartOrchestrator.questWork> =>
  StartOrchestrator.questWork({ questId, workItemId, payload });
