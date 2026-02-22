/**
 * PURPOSE: Adapter for StartOrchestrator.startQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorStartQuestAdapter({ questId });
 * // Returns: ProcessId or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorStartQuestAdapter = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<ProcessId> => StartOrchestrator.startQuest({ questId });
