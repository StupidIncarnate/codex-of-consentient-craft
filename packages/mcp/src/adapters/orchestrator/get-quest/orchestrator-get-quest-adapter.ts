/**
 * PURPOSE: Adapter for StartOrchestrator.getQuest that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorGetQuestAdapter({ questId, startPath });
 * // Returns: GetQuestResult or throws error
 *
 * const filtered = await orchestratorGetQuestAdapter({ questId, sections: ['requirements'], startPath });
 * // Returns: GetQuestResult with only the specified sections populated
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GetQuestResult } from '@dungeonmaster/orchestrator';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQuestAdapter = async ({
  questId,
  sections,
  startPath,
}: {
  questId: string;
  sections?: string[];
  startPath: FilePath;
}): Promise<GetQuestResult> =>
  StartOrchestrator.getQuest({ questId, ...(sections && { sections }), startPath });
