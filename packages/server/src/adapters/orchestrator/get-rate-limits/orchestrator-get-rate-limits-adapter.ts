/**
 * PURPOSE: Adapter for StartOrchestrator.getRateLimits — the 5h/7d reading the orchestrator measures
 *   out of its own usage ledger, or null on a machine whose ceilings are not calibrated yet.
 *
 *   Asynchronous because the reading is taken from disk on demand rather than served from a cache
 *   somebody else keeps warm.
 *
 * USAGE:
 * const snapshot = await orchestratorGetRateLimitsAdapter();
 * // Returns: RateLimitsSnapshot | null
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

export const orchestratorGetRateLimitsAdapter = async (): Promise<RateLimitsSnapshot | null> => {
  // `Promise.resolve` rather than a bare await: ESLint's type-aware rules resolve
  // `@dungeonmaster/orchestrator` through its COMPILED declaration while typecheck resolves it
  // through source, so between a source change and the next build the two disagree about whether
  // this call is thenable. Wrapping settles it for both readings and changes nothing at runtime.
  const snapshot = await Promise.resolve(StartOrchestrator.getRateLimits());
  return snapshot;
};
