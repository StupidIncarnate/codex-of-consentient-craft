/**
 * PURPOSE: Adapter for StartOrchestrator.modifyQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorModifyQuestAdapter({ questId, input });
 * // Returns: ModifyQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ModifyQuestInput, ModifyQuestResult } from '@dungeonmaster/orchestrator';

export const orchestratorModifyQuestAdapter = async ({
  questId,
  input,
}: {
  questId: string;
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => StartOrchestrator.modifyQuest({ questId, input });
