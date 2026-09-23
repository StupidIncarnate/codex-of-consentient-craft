/**
 * PURPOSE: The retention knobs `prune` and `cleanup` both read — the two age-out windows and the
 * unit table `pruneOlderThanParseTransformer` reads `'7d'` through. Video gets its OWN window
 * because a screencast dwarfs every shot and transcript combined and ages out first and separately
 * (siegelense-tooling.md line 248); one shared window would either keep video for a week or take
 * shots after two days. Reach for this over `instanceLifecycleStatics`: that file's clocks all
 * measure a LIVE instance's boot, heartbeat and locks, while every value here measures how long
 * EVIDENCE survives after the instance is gone.
 *
 * USAGE:
 * pruneStatics.window.defaultOlderThan;
 * // Returns '7d' — the window cleanup ages every non-video asset out on
 *
 * pruneStatics.olderThan.unitMs.d;
 * // Returns 86400000
 */

export const pruneStatics = {
  window: {
    // "An instance's assets survive a configurable window, not forever" (line 244). The spec's own
    // worked `prune { olderThan: '7d' }` is what a caller types to reclaim on exactly this window
    // early, rather than waiting for a `cleanup` to reach it.
    defaultOlderThan: '7d',
    // Line 248, and the spec's own `prune { kind: 'video', olderThan: '2d' }` at line 2425.
    videoOlderThan: '2d',
  },
  olderThan: {
    // Ordered longest-first so a refusal lists them the way a person reads a duration.
    unitNames: ['d', 'h', 'm', 's'],
    unitMs: {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    },
  },
  assets: {
    // The one evidence extension `evidenceFileStatics` does not hold: `playwrightSessionAdapter`
    // writes a screencast through Playwright's own `recordVideo`, not through this package's shot
    // or transcript writers, so it lives here rather than there — `prune --kind video` is a real
    // extension match against that recording, not a branch waiting to be wired.
    videoExtension: '.webm',
  },
  size: {
    // Mebibytes, matching `machineReadBroker`'s own free-memory and free-disk readings, so a
    // `freedMB` and a `freeDiskMB` on the same screen carry the same unit.
    bytesPerMegabyte: 1_048_576,
  },
} as const;
