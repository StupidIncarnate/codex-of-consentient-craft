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
    instance: [],
  },
} as const;
