/**
 * PURPOSE: Adapter for StartOrchestrator.normalizeDispatchBoot that wraps the orchestrator
 * package — rewrites a persisted node-playing dispatch mode to paused at HTTP-server boot
 *
 * USAGE:
 * const state = await orchestratorNormalizeDispatchBootAdapter();
 * // Returns: the effective DispatchState after normalization
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { DispatchState } from '@dungeonmaster/shared/contracts';

export const orchestratorNormalizeDispatchBootAdapter = async (): Promise<DispatchState> =>
  StartOrchestrator.normalizeDispatchBoot();
