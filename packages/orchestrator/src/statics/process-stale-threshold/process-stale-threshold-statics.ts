/**
 * PURPOSE: Default thresholds for the stale-process watchdog. `thresholdMs` is how long a registered process can be silent before the watcher emits a warning. `tickIntervalMs` is how often the watcher scans the registry. Values are exposed as overridable defaults on `processStaleWatchBroker`'s params.
 *
 * USAGE:
 * processStaleThresholdStatics.thresholdMs; // 60_000 — warn after 60s of silence
 * processStaleThresholdStatics.tickIntervalMs; // 30_000 — scan every 30s
 */

export const processStaleThresholdStatics = {
  thresholdMs: 60_000,
  tickIntervalMs: 30_000,
} as const;
