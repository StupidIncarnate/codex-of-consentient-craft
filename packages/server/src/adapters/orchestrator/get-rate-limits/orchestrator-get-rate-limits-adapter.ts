/**
 * PURPOSE: Adapter for StartOrchestrator.getRateLimits — returns the latest cached rate-limits snapshot or null
 *
 * USAGE:
 * const snapshot = orchestratorGetRateLimitsAdapter();
 * // Returns: RateLimitsSnapshot | null
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

export const orchestratorGetRateLimitsAdapter = (): RateLimitsSnapshot | null =>
  StartOrchestrator.getRateLimits();
