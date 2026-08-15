/**
 * PURPOSE: Adapter for StartOrchestrator.runRiftcarver that wraps the orchestrator package. Reach
 * for this over orchestratorRunWardAdapter for the relay's other command role — the two are the
 * same shape because the MCP side of a command item is always "block on the orchestrator, hand the
 * result back", and which command runs is the dispatcher's decision, not this layer's.
 *
 * USAGE:
 * const result = await orchestratorRunRiftcarverAdapter({ questId, workItemId });
 * // Returns: QuestRunRiftcarverResult — { success, questId, workItemId, exitCode, riftcarverResultId, outcome, failedStep? }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestRunRiftcarverResult } from '@dungeonmaster/orchestrator';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

export const orchestratorRunRiftcarverAdapter = async ({
  questId,
  workItemId,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
}): Promise<QuestRunRiftcarverResult> => StartOrchestrator.runRiftcarver({ questId, workItemId });
