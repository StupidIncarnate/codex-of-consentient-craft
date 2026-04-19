/**
 * PURPOSE: Adapter for StartOrchestrator.abandonQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorAbandonQuestAdapter({ questId });
 * // Returns: { abandoned: boolean }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorAbandonQuestAdapter = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ abandoned: boolean }> => StartOrchestrator.abandonQuest({ questId });
