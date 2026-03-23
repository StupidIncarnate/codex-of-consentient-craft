/**
 * PURPOSE: Adapter for StartOrchestrator.pauseQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorPauseQuestAdapter({ questId });
 * // Returns: { paused: boolean }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorPauseQuestAdapter = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ paused: boolean }> => StartOrchestrator.pauseQuest({ questId });
