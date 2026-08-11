/**
 * PURPOSE: Adapter for StartOrchestrator.mergeQuest that wraps the orchestrator package
 *
 * USAGE:
 * const { merging } = await orchestratorMergeQuestAdapter({ questId });
 * // Returns: { merging: boolean } or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorMergeQuestAdapter = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ merging: boolean }> => StartOrchestrator.mergeQuest({ questId });
