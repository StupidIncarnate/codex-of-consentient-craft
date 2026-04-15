/**
 * PURPOSE: Adapter for StartOrchestrator.modifyQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorModifyQuestAdapter({ questId, input });
 * // Returns: ModifyQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ModifyQuestResult } from '@dungeonmaster/orchestrator';

import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

export const orchestratorModifyQuestAdapter = async ({
  questId,
  input,
}: {
  questId: string;
  input: ModifyQuestInput;
}): Promise<ModifyQuestResult> => StartOrchestrator.modifyQuest({ questId, input: input as never });
