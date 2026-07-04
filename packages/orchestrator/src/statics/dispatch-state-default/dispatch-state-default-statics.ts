/**
 * PURPOSE: The safe-default dispatch state used when dispatch-state.json is missing or corrupt —
 * paused with the epoch timestamp (meaning "never updated"), so the Node dispatcher never
 * auto-plays from an unreadable state.
 *
 * USAGE:
 * dispatchStateContract.parse(dispatchStateDefaultStatics.paused);
 * // Returns { mode: 'paused', updatedAt: '1970-01-01T00:00:00.000Z' }
 */

export const dispatchStateDefaultStatics = {
  paused: {
    mode: 'paused',
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
} as const;
