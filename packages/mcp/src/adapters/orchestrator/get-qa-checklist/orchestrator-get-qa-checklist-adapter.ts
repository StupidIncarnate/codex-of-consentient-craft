/**
 * PURPOSE: Adapter for StartOrchestrator.getQaChecklist that wraps the orchestrator package
 *
 * USAGE:
 * const checklist = await orchestratorGetQaChecklistAdapter({ questId });
 * // Returns every flow's QA checklist, rendered as text
 *
 * const one = await orchestratorGetQaChecklistAdapter({ questId, flowId });
 * // Returns just that flow's checklist
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorGetQaChecklistAdapter = async ({
  questId,
  flowId,
}: {
  questId: string;
  flowId?: string;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getQaChecklist>>> =>
  StartOrchestrator.getQaChecklist({ questId, ...(flowId !== undefined && { flowId }) });
