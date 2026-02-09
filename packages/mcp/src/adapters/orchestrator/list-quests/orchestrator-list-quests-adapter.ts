/**
 * PURPOSE: Adapter for StartOrchestrator.listQuests that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorListQuestsAdapter({ startPath });
 * // Returns: QuestListItem[] or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { FilePath, QuestListItem } from '@dungeonmaster/shared/contracts';

export const orchestratorListQuestsAdapter = async ({
  startPath,
}: {
  startPath: FilePath;
}): Promise<QuestListItem[]> => StartOrchestrator.listQuests({ startPath });
