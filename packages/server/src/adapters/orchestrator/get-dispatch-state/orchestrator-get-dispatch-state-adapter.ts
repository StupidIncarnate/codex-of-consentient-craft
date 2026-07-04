/**
 * PURPOSE: Adapter for StartOrchestrator.getDispatchState that wraps the orchestrator package —
 * returns the Node dispatcher's play/pause state
 *
 * USAGE:
 * const state = await orchestratorGetDispatchStateAdapter();
 * // Returns: DispatchState
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { DispatchState } from '@dungeonmaster/shared/contracts';

export const orchestratorGetDispatchStateAdapter = async (): Promise<DispatchState> =>
  StartOrchestrator.getDispatchState();
