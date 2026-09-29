/**
 * PURPOSE: Tracks the active rate-limits watcher handle so the bootstrap responder is idempotent across module reloads
 *
 * USAGE:
 * rateLimitsBootstrapState.getHandle();
 * rateLimitsBootstrapState.setHandle({ handle });
 * rateLimitsBootstrapState.clear();
 */

import type { RateLimitsWatchHandle } from '../../contracts/rate-limits-watch-handle/rate-limits-watch-handle-contract';

const state: { handle: RateLimitsWatchHandle | null } = { handle: null };

export const rateLimitsBootstrapState = {
  getHandle: (): RateLimitsWatchHandle | null => state.handle,

  setHandle: ({ handle }: { handle: RateLimitsWatchHandle }): void => {
    state.handle = handle;
  },

  clear: (): void => {
    if (state.handle !== null) {
      state.handle.stop();
    }
    state.handle = null;
  },
};
