/**
 * PURPOSE: Adapter for StartOrchestrator.loadQuest that wraps the orchestrator package
 *
 * USAGE:
 * const quest = await orchestratorLoadQuestAdapter({ questId });
 * // Returns: Quest object from the orchestrator
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorLoadQuestAdapter = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<Quest> => StartOrchestrator.loadQuest({ questId });
