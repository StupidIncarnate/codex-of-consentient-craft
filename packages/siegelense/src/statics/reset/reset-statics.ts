/**
 * PURPOSE: Default NOT_cleared declarations per reset level ('page', 'state', 'instance').
 *
 * USAGE:
 * resetStatics.notCleared.page;
 * // Returns ['disk', 'server memory']
 */

export const resetStatics = {
  notCleared: {
    page: ['disk', 'server memory'],
    state: ['server memory', 'open websockets'],
    // A reset step runs inside the same live `run` batch that dispatched it, against the same
    // driver connection — restarting the underlying server process (the only thing that clears
    // server memory or drops its open websockets) would sever that connection mid-batch. Only
    // `kill` then `start`, two separate CLI calls outside any batch, does that. `instance` rewinds
    // disk further than `state` (to boot, not just a named point) and always, but leaves the
    // process itself exactly as untouched as `state` does.
    instance: ['server memory', 'open websockets'],
  },
} as const;
