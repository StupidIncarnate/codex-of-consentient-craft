/**
 * PURPOSE: Keeps the heartbeat's tick period in one place, because the emit broker and that broker's
 * proxy have to key on the SAME value — the proxy addresses its timer spy on this number, so a
 * second copy anywhere silently stops every tick case from reaching a registered callback. The
 * period is set against the web side's 30 000 ms silence threshold: three whole ticks fit inside it
 * with no remainder, so the badge goes OFFLINE only after three frames in a row are really missing.
 *
 * USAGE:
 * healthHeartbeatStatics.emitIntervalMs;
 * // Returns 10000
 */

export const healthHeartbeatStatics = {
  emitIntervalMs: 10_000,
} as const;
