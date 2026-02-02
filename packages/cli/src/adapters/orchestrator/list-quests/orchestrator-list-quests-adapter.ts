/**
 * PURPOSE: Wraps StartOrchestrator.listQuests to provide I/O boundary for quest listing
 *
 * USAGE:
 * const quests = await orchestratorListQuestsAdapter({startPath});
 * // Returns QuestListItem[] from orchestrator
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { FilePath, QuestListItem } from '@dungeonmaster/shared/contracts';

export const orchestratorListQuestsAdapter = async ({
  startPath,
}: {
  startPath: FilePath;
}): Promise<QuestListItem[]> => StartOrchestrator.listQuests({ startPath });
