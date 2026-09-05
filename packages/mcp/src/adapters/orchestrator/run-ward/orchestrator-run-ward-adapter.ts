/**
 * PURPOSE: Adapter for StartOrchestrator.runWard that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorRunWardAdapter({ questId, workItemId, mode: 'committed' });
 * // Returns: QuestRunWardResult — { success, exitCode, wardResultId, lastWardRunId? }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestRunWardResult } from '@dungeonmaster/orchestrator';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

export const orchestratorRunWardAdapter = async ({
  questId,
  workItemId,
  mode,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  mode: 'committed' | 'full';
}): Promise<QuestRunWardResult> => StartOrchestrator.runWard({ questId, workItemId, mode });
