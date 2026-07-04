/**
 * PURPOSE: Adapter for StartOrchestrator.pauseDispatch that wraps the orchestrator package —
 * gracefully pauses the Node dispatcher (in-flight children finish; nothing new dispatches)
 *
 * USAGE:
 * const state = await orchestratorPauseDispatchAdapter();
 * // Returns: DispatchState with mode 'paused'
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { DispatchState } from '@dungeonmaster/shared/contracts';

export const orchestratorPauseDispatchAdapter = async (): Promise<DispatchState> =>
  StartOrchestrator.pauseDispatch();
