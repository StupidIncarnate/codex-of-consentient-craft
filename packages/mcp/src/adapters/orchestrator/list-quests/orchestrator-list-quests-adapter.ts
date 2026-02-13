/**
 * PURPOSE: Adapter for StartOrchestrator.listQuests that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorListQuestsAdapter({ projectId });
 * // Returns: QuestListItem[] or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { ProjectId, QuestListItem } from '@dungeonmaster/shared/contracts';

export const orchestratorListQuestsAdapter = async ({
  projectId,
}: {
  projectId: ProjectId;
}): Promise<QuestListItem[]> => StartOrchestrator.listQuests({ projectId });
