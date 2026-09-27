/**
 * PURPOSE: HTTP-server-boot normalization of the Node dispatcher state — delegates to the
 * orchestrator adapter that rewrites a persisted 'node-playing' mode to 'paused'. Runs ONLY at
 * server boot so a restart never auto-plays; MCP children never call this.
 *
 * USAGE:
 * const state = await OrchestrationDispatchNormalizeBootResponder();
 * // Returns the effective DispatchState after normalization
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { DispatchState } from '@dungeonmaster/shared/contracts';

export const OrchestrationDispatchNormalizeBootResponder = async (): Promise<DispatchState> =>
  StartOrchestrator.normalizeDispatchBoot();
