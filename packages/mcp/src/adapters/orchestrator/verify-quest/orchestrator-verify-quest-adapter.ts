/**
 * PURPOSE: Adapter for StartOrchestrator.verifyQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorVerifyQuestAdapter({ questId, startPath });
 * // Returns: VerifyQuestResult or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { VerifyQuestResult } from '@dungeonmaster/orchestrator';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const orchestratorVerifyQuestAdapter = async ({
  questId,
  startPath,
}: {
  questId: string;
  startPath: FilePath;
}): Promise<VerifyQuestResult> => StartOrchestrator.verifyQuest({ questId, startPath });
