/**
 * PURPOSE: In-memory cache of the latest RateLimitsSnapshot read from disk by the watch broker
 *
 * USAGE:
 * rateLimitsState.set({ snapshot });
 * rateLimitsState.get();
 * // Returns: RateLimitsSnapshot | null. Set to null when no snapshot has arrived yet.
 */

import { rateLimitsStateContract } from '../../contracts/rate-limits-state/rate-limits-state-contract';
import type { RateLimitsState } from '../../contracts/rate-limits-state/rate-limits-state-contract';
import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

const state: RateLimitsState = rateLimitsStateContract.parse({
  snapshot: null,
});

export const rateLimitsState = {
  get: (): RateLimitsSnapshot | null => state.snapshot,

  set: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }): void => {
    state.snapshot = snapshot;
  },

  clear: (): void => {
    state.snapshot = null;
  },
};
