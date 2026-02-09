/**
 * PURPOSE: Adapter for StartOrchestrator.modifyQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorModifyQuestAdapter({ questId, input, startPath });
 * // Returns: ModifyQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ModifyQuestInput, ModifyQuestResult } from '@dungeonmaster/orchestrator';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const orchestratorModifyQuestAdapter = async ({
  questId,
  input,
  startPath,
}: {
  questId: string;
  input: ModifyQuestInput;
  startPath: FilePath;
}): Promise<ModifyQuestResult> => StartOrchestrator.modifyQuest({ questId, input, startPath });
