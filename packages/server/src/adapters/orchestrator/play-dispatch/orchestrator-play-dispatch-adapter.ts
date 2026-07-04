/**
 * PURPOSE: Adapter for StartOrchestrator.playDispatch that wraps the orchestrator package —
 * attempts to start the Node dispatcher (the exclusivity gate may refuse)
 *
 * USAGE:
 * const response = await orchestratorPlayDispatchAdapter({ force: false });
 * // Returns: DispatchPlayResponse — { allowed, reason?, state }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { DispatchPlayResponse } from '@dungeonmaster/orchestrator';

export const orchestratorPlayDispatchAdapter = async ({
  force,
}: {
  force?: boolean;
}): Promise<DispatchPlayResponse> =>
  StartOrchestrator.playDispatch({ ...(force !== undefined && { force }) });
