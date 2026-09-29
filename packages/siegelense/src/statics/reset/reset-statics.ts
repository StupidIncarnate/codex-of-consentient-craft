/**
 * PURPOSE: Default NOT_cleared declarations per reset level ('page', 'state', 'instance') — what
 * each level deliberately leaves standing, reported on every reset reading.
 *
 * USAGE:
 * resetStatics.notCleared.page;
 * // Returns ['disk', 'server memory']
 */

export const resetStatics = {
  notCleared: {
    page: ['disk', 'server memory'],
    state: ['server memory', 'open websockets'],
    // `instance` restarts every server process of the lane and reloads the page, so server memory
    // and open websockets go with it; only the CLI's socket to the driver survives, and that is not
    // the app's state.
    instance: [],
  },
  storageSkipped: {
    // Appended to NOT_cleared (never one of the three lists above) when the page has no origin yet
    // (DEF-94: `about:blank`, a fresh instance's first step) — `localStorage`/`sessionStorage` throw
    // rather than clearing, so this says so instead of crashing the whole `reset` step.
    noOrigin: 'browser storage (page has no origin yet)',
  },
  // Where `instance` parks the page while the servers are down, so nothing on it retries them.
  blankPageUrl: 'about:blank',
} as const;
