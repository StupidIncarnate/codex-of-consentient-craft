/**
 * PURPOSE: Wraps StartOrchestrator.listQuests to provide I/O boundary for quest listing
 *
 * USAGE:
 * const quests = await orchestratorListQuestsAdapter({projectId});
 * // Returns QuestListItem[] from orchestrator
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProjectId, QuestListItem } from '@dungeonmaster/shared/contracts';

export const orchestratorListQuestsAdapter = async ({
  projectId,
}: {
  projectId: ProjectId;
}): Promise<QuestListItem[]> => StartOrchestrator.listQuests({ projectId });
