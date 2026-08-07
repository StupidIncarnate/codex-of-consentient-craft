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
 * const mine = await orchestratorGetQaChecklistAdapter({ questId, track: 'flowrider' });
 * // Returns the runtime flows, each measured against flowriderSignoff
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { SignoffTrack } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQaChecklistAdapter = async ({
  questId,
  flowId,
  track,
}: {
  questId: string;
  flowId?: string;
  track?: SignoffTrack;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getQaChecklist>>> =>
  StartOrchestrator.getQaChecklist({
    questId,
    ...(flowId !== undefined && { flowId }),
    ...(track !== undefined && { track }),
  });
