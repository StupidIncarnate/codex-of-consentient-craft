/**
 * PURPOSE: Adapter for StartOrchestrator.getSmoketestState — returns { active, events } for drawer restoration
 *
 * USAGE:
 * const state = orchestratorGetSmoketestStateAdapter();
 * // Returns: { active: ActiveSmoketestRun | null, events: readonly unknown[] }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorGetSmoketestStateAdapter = (): ReturnType<
  typeof StartOrchestrator.getSmoketestState
> => StartOrchestrator.getSmoketestState();
