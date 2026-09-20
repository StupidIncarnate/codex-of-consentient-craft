/**
 * PURPOSE: The thresholds a screenshot-comparison reading turns into a finding — how much
 * per-channel drift still counts as "blank" and the stride a blank scan samples at, the
 * percent-changed reading above which a diff is "almost certainly" a navigation or modal rather
 * than a local change, the YIQ luminance threshold pixelmatch itself is called with, and the upper
 * bound of one 8-bit colour channel a blank read samples. Reach for this over `resultsStatics` when
 * the value governs how a captured PAIR of screenshots is compared, not what a `results` query
 * returns.
 *
 * USAGE:
 * perceptionStatics.pixelChange.openThresholdPercent;
 * // Returns 30 — siegelense-tooling.md line 704's "large, 30%+" reading
 */

export const perceptionStatics = {
  blank: {
    // A capture the browser rendered as flat color still carries per-channel jitter from
    // compression and anti-aliasing; 4 absorbs that noise without also absorbing a real
    // near-blank screen.
    channelTolerance: 4,
    // Sampling every pixel on a full-page capture costs more than the reading is worth; 7 is
    // dense enough to catch a real foreground element while skipping most of a flat background.
    sampleStride: 7,
  },
  pixelChange: {
    // siegelense-tooling.md line 704's own reading: "large, 30%+ | a navigation, a modal, a
    // collapse | almost certainly wrong" — this is quoted evidence, not a taste call.
    openThresholdPercent: 30,
    percentSuffix: '%',
  },
  diff: {
    // pixelmatch's own default threshold for its YIQ luminance comparison.
    yiqThreshold: 0.1,
  },
  channel: {
    // The full range of one 8-bit RGB channel — colourChannelContract's own upper bound.
    maxValue: 255,
  },
} as const;
