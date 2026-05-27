/**
 * PURPOSE: Adapter for StartOrchestrator.findQuestByWorkItemId that wraps the orchestrator package
 *
 * USAGE:
 * const questId = await orchestratorFindQuestByWorkItemIdAdapter({ workItemId });
 * // Returns: QuestId of the owning quest or null when no quest's workItems[] contains workItemId
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

export const orchestratorFindQuestByWorkItemIdAdapter = async ({
  workItemId,
}: {
  workItemId: QuestWorkItemId;
}): Promise<QuestId | null> => StartOrchestrator.findQuestByWorkItemId({ workItemId });
