/**
 * PURPOSE: Adapter for StartOrchestrator.startQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorStartQuestAdapter({ questId, startPath });
 * // Returns: ProcessId or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { FilePath, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorStartQuestAdapter = async ({
  questId,
  startPath,
}: {
  questId: QuestId;
  startPath: FilePath;
}): Promise<ProcessId> => StartOrchestrator.startQuest({ questId, startPath });
