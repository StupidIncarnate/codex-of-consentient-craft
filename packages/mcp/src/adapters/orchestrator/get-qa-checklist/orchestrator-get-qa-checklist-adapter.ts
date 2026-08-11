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
 *   packageNames: ['web'],
 * });
 * // Returns the runtime flows, each measured over the groundstomper denominator narrowed to `web`
 *
 * `track` is the DENOMINATOR enum, of which there are three, rather than the sign-off FIELD enum, of
 * which there are two — Groundstomper writes `flowriderSignoff` and is still measured on its own.
 * Every optional key is spread conditionally because `exactOptionalPropertyTypes` makes an explicit
 * `undefined` a type error downstream, not a no-op.
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { SignoffDenominatorTrack } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQaChecklistAdapter = async ({
  questId,
  flowId,
  track,
  packageNames,
}: {
  questId: string;
  flowId?: string;
  track?: SignoffDenominatorTrack;
  packageNames?: string[];
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getQaChecklist>>> =>
  StartOrchestrator.getQaChecklist({
    questId,
    ...(flowId !== undefined && { flowId }),
    ...(track !== undefined && { track }),
    ...(packageNames !== undefined && { packageNames }),
  });
