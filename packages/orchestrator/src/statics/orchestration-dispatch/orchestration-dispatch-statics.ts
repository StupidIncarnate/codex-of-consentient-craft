/**
 * PURPOSE: Tuning knobs for the Node dispatch loop — in-process get-next-step poll timings and the
 * process-id prefix stamped on Node-spawned agent children.
 *
 * USAGE:
 * orchestrationDispatchStatics.loop.longPollTotalMs;
 * // Returns 2000 — how long one dispatch scan keeps polling before it reports idle
 */

export const orchestrationDispatchStatics = {
  loop: {
    longPollTotalMs: 2_000,
    longPollIntervalMs: 500,
  },
  processIdPrefix: 'node-dispatch',
} as const;
