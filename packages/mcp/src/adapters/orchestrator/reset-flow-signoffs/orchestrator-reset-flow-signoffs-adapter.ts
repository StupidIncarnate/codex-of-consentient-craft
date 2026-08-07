/**
 * PURPOSE: Adapter for StartOrchestrator.resetFlowSignoffs that wraps the orchestrator package
 *
 * USAGE:
 * const result = await orchestratorResetFlowSignoffsAdapter({ questId, workItemId, flowId, reason });
 * // Returns what the reset cleared and where it was recorded, as text
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorResetFlowSignoffsAdapter = async ({
  questId,
  workItemId,
  flowId,
  reason,
}: {
  questId: string;
  workItemId: string;
  flowId: string;
  reason: string;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.resetFlowSignoffs>>> =>
  StartOrchestrator.resetFlowSignoffs({ questId, workItemId, flowId, reason });
