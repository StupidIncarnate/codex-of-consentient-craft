/**
 * PURPOSE: Adapter for StartOrchestrator.verifyQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorVerifyQuestAdapter({ questId });
 * // Returns: VerifyQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { VerifyQuestResult } from '@dungeonmaster/orchestrator';

export const orchestratorVerifyQuestAdapter = async ({
  questId,
}: {
  questId: string;
}): Promise<VerifyQuestResult> => StartOrchestrator.verifyQuest({ questId });
