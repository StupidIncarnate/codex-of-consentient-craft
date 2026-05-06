/**
 * PURPOSE: Tracks the active rate-limits watcher handle so the bootstrap responder is idempotent across module reloads
 *
 * USAGE:
 * rateLimitsBootstrapState.getHandle();
 * rateLimitsBootstrapState.setHandle({ handle });
 * rateLimitsBootstrapState.clear();
 */

const state: { handle: { stop: () => void } | null } = { handle: null };

export const rateLimitsBootstrapState = {
  getHandle: (): { stop: () => void } | null => state.handle,

  setHandle: ({ handle }: { handle: { stop: () => void } }): void => {
    state.handle = handle;
  },

  clear: (): void => {
    if (state.handle !== null) {
      state.handle.stop();
    }
    state.handle = null;
  },
};
