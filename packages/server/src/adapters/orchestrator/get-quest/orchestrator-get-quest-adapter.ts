/**
 * PURPOSE: Adapter for StartOrchestrator.getQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorGetQuestAdapter({ questId });
 * // Returns: GetQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';

export const orchestratorGetQuestAdapter = async ({
  questId,
  stage,
}: {
  questId: string;
  stage?: string;
}): Promise<GetQuestResult> => StartOrchestrator.getQuest({ questId, ...(stage && { stage }) });
