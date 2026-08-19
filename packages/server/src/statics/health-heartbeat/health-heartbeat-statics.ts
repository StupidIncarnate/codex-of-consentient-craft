/**
 * PURPOSE: Names the cadence ServerInitResponder's health-updated broadcast timer runs on, so
 * that timer reads one named source instead of an inline literal. This is a server-side timer
 * constant only — it is NOT serialized onto the WS frame itself.
 *
 * USAGE:
 * healthHeartbeatStatics.broadcast.intervalMs;
 * // Returns 5000
 */

export const healthHeartbeatStatics = {
  broadcast: {
    intervalMs: 5000,
  },
} as const;
