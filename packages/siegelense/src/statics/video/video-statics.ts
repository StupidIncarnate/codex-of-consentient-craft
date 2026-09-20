/**
 * PURPOSE: Static definitions and reading templates for the `video` step verb — actions
 * and reading output templates. Reach for this over inline literals so action definitions
 * and status reading messages remain anchored to a single source of truth across contracts, transformers, and brokers.
 *
 * USAGE:
 * videoStatics.actions;
 * // Returns ['start', 'stop']
 *
 * videoStatics.readings.started;
 * // Returns 'video recording started'
 *
 * videoStatics.readings.stopped;
 * // Returns 'video recording stopped — saved to {path}'
 */

export const videoStatics = {
  actions: ['start', 'stop'],
  readings: {
    started: 'video recording started',
    stopped: 'video recording stopped — saved to {path}',
  },
} as const;
