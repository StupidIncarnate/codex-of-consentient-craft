/**
 * PURPOSE: In-memory cache of the latest RateLimitsSnapshot read from disk by the watch broker
 *
 * USAGE:
 * rateLimitsState.set({ snapshot });
 * rateLimitsState.get();
 * // Returns: RateLimitsSnapshot | null. Set to null when no snapshot has arrived yet.
 */

import type { RateLimitsSnapshot } from '@dungeonmaster/shared/contracts';

const state: { snapshot: RateLimitsSnapshot | null } = {
  snapshot: null,
};

export const rateLimitsState = {
  get: (): RateLimitsSnapshot | null => state.snapshot,

  set: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }): void => {
    state.snapshot = snapshot;
  },

  clear: (): void => {
    state.snapshot = null;
  },
};
