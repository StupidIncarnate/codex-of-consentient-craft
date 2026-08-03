/**
 * PURPOSE: Adapter for StartOrchestrator.getBlightChecklist that wraps the orchestrator package
 *
 * USAGE:
 * const checklist = await orchestratorGetBlightChecklistAdapter({ questId });
 * // Returns the quest's whole-diff blight review checklist, rendered as text
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorGetBlightChecklistAdapter = async ({
  questId,
}: {
  questId: string;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getBlightChecklist>>> =>
  StartOrchestrator.getBlightChecklist({ questId });
