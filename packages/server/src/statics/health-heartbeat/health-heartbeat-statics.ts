/**
 * PURPOSE: Defines the period between server-emitted health-status heartbeat frames
 *
 * USAGE:
 * healthHeartbeatStatics.emit.intervalMs;
 * // Returns 10000
 */

export const healthHeartbeatStatics = {
  emit: {
    intervalMs: 10000,
  },
} as const;
