/**
 * PURPOSE: Singleton store for the stale-process watchdog's stop handle so the bootstrap responder is idempotent across module re-imports (e.g. recovery flows that re-enter start-orchestrator). Mirrors the `rateLimitsBootstrapState` pattern.
 *
 * USAGE:
 * processStaleWatchBootstrapState.getHandle();
 * processStaleWatchBootstrapState.setHandle({ handle: { stop: () => undefined } });
 */

const state = {
  handle: null as { stop: () => void } | null,
};

export const processStaleWatchBootstrapState = {
  getHandle: (): { stop: () => void } | null => state.handle,
  setHandle: ({ handle }: { handle: { stop: () => void } }): void => {
    state.handle = handle;
  },
  clear: (): void => {
    state.handle = null;
  },
} as const;
