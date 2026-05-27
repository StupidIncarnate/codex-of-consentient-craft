/**
 * PURPOSE: Tunables for smoketestInProcessDriverBroker — short-poll timing for in-process dispatch
 * and a safety cap on recursive iterations
 *
 * USAGE:
 * smoketestInProcessDriverStatics.defaultMaxDispatches;
 * // Returns: 100 — the maximum number of get-next-step iterations before the driver bails out
 */

export const smoketestInProcessDriverStatics = {
  defaultMaxDispatches: 100,
  shortPollTotalMs: 50,
  shortPollIntervalMs: 25,
} as const;
