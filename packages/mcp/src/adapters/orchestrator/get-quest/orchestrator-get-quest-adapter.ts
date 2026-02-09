/**
 * PURPOSE: Adapter for StartOrchestrator.getQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorGetQuestAdapter({ questId, startPath });
 * // Returns: GetQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQuestAdapter = async ({
  questId,
  startPath,
}: {
  questId: string;
  startPath: FilePath;
}): Promise<GetQuestResult> => StartOrchestrator.getQuest({ questId, startPath });
