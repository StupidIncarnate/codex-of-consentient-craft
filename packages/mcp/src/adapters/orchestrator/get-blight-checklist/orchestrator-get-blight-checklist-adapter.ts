/**
 * PURPOSE: Adapter for StartOrchestrator.getBlightChecklist that wraps the orchestrator package
 *
 * USAGE:
 * const checklist = await orchestratorGetBlightChecklistAdapter({ questId, scope: 'commit' });
 * // Returns the blight review checklist for that scope, rendered as text
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorGetBlightChecklistAdapter = async ({
  questId,
  scope,
}: {
  questId: string;
  scope?: 'quest' | 'commit' | 'working-tree' | 'unpushed';
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getBlightChecklist>>> =>
  StartOrchestrator.getBlightChecklist({ questId, ...(scope !== undefined && { scope }) });
