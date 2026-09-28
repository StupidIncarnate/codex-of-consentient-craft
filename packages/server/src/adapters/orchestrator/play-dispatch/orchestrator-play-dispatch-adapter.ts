/**
 * PURPOSE: Adapter for StartOrchestrator.playDispatch that wraps the orchestrator package —
 * starts the Node dispatcher.
 *
 * USAGE:
 * const state = await orchestratorPlayDispatchAdapter();
 * // Returns: DispatchState
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { DispatchState } from '@dungeonmaster/shared/contracts';

export const orchestratorPlayDispatchAdapter = async (): Promise<DispatchState> =>
  StartOrchestrator.playDispatch();
