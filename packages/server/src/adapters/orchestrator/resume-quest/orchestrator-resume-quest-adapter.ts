/**
 * PURPOSE: Adapter for StartOrchestrator.resumeQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorResumeQuestAdapter({ questId });
 * // Returns: { resumed: boolean, restoredStatus: QuestStatus }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId, QuestStatus } from '@dungeonmaster/shared/contracts';

export const orchestratorResumeQuestAdapter = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ resumed: boolean; restoredStatus: QuestStatus }> =>
  StartOrchestrator.resumeQuest({ questId });
