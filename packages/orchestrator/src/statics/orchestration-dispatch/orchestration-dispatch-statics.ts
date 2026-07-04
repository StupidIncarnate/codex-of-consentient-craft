/**
 * PURPOSE: Tuning knobs for the Node dispatch loop and the dispatcher-exclusivity gate — MCP
 * heartbeat freshness window, in-process get-next-step poll timings, and the process-id prefix
 * stamped on Node-spawned agent children.
 *
 * USAGE:
 * orchestrationDispatchStatics.mcpHeartbeatTtlMs;
 * // Returns 300000 (5 minutes) — a /dumpster-launch get-next-step call younger than this blocks Node play
 */

export const orchestrationDispatchStatics = {
  mcpHeartbeatTtlMs: 300_000,
  loop: {
    longPollTotalMs: 2_000,
    longPollIntervalMs: 500,
  },
  processIdPrefix: 'node-dispatch',
  exclusivity: {
    mcpIdleReason:
      'Node dispatcher is playing — pause it on the /queue page before driving quests with /dumpster-launch.',
    heartbeatRefusalReason:
      'A /dumpster-launch loop polled get-next-step within the last 5 minutes — stop it (or wait for it to go quiet) before playing the Node dispatcher, or retry with force.',
    inFlightRefusalReason:
      'A /dumpster-launch-dispatched agent is still in flight — wait for it to finish before playing the Node dispatcher, or retry with force.',
  },
} as const;
