/**
 * PURPOSE: Static definitions and formatting patterns for the `hold` step verb — frame counts,
 * intervals, and verdict string templates. Reach for this over inline numbers and strings so
 * defaults and verdict messages remain anchored to a single source of truth across contracts and brokers.
 *
 * USAGE:
 * holdStatics.defaults.frames;
 * // Returns 4
 *
 * holdStatics.defaults.everyMs;
 * // Returns 1500
 *
 * holdStatics.verdicts.nothingChanged;
 * // Returns 'NOTHING CHANGED across {duration}s'
 */

export const holdStatics = {
  defaults: {
    frames: 4,
    everyMs: 1500,
    minFrames: 2,
  },
  verdicts: {
    nothingChanged: 'NOTHING CHANGED across {duration}s',
    stillChanging: 'still changing at {duration}s',
  },
} as const;
