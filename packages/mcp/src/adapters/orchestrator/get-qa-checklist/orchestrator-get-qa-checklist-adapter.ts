/**
 * PURPOSE: Adapter for StartOrchestrator.getQaChecklist that wraps the orchestrator package
 *
 * USAGE:
 * const checklist = await orchestratorGetQaChecklistAdapter({ questId });
 * // Returns every flow's QA checklist, rendered as text
 *
 * const one = await orchestratorGetQaChecklistAdapter({ questId, flowId });
 * // Returns just that flow's checklist
 *
 * const mine = await orchestratorGetQaChecklistAdapter({
 *   questId,
 *   track: 'groundstomper',
 *   operationItemId: 'a1b2…',
 * });
 * // Returns exactly the scope that operation item is measured over
 *
 * `operationItemId` is the whole scope: the track, the flows and the package slice are derived from
 * the item server-side, by the same transformer the signal-back completion gate uses. Every optional
 * key is spread conditionally because `exactOptionalPropertyTypes` makes an explicit `undefined` a
 * type error downstream, not a no-op.
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorGetQaChecklistAdapter = async ({
  questId,
  operationItemId,
  flowId,
}: {
  questId: string;
  operationItemId?: string;
  flowId?: string;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getQaChecklist>>> =>
  StartOrchestrator.getQaChecklist({
    questId,
    ...(operationItemId !== undefined && { operationItemId }),
    ...(flowId !== undefined && { flowId }),
  });
