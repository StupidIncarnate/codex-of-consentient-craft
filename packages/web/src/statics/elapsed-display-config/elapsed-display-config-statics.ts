/**
 * PURPOSE: How often a running work-item row recomputes the elapsed figure it shows, and the spans
 * at which that figure changes units — from `<1m` to counting minutes, and from minutes to hours.
 *
 * USAGE:
 * elapsedDisplayConfigStatics.refresh.tickMs;
 * // 60_000 — how often a visible running row recomputes its elapsed figure
 */

export const elapsedDisplayConfigStatics = {
  refresh: { tickMs: 60_000 },
  // No seconds digit: the row refreshes once a minute, so a seconds digit would sit frozen for up
  // to 60 seconds and read as a stalled clock.
  thresholds: { minuteThresholdSeconds: 60, hourThresholdMinutes: 60 },
} as const;
