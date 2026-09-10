/**
 * PURPOSE: Defines when ward calls a file slow. One number per thing a check can actually measure —
 * reach for `testWarnMs` for anything jest reports, `lintRulesWarnMs` for eslint's rule work, and
 * `warnMs` only for a check that gives no per-file breakdown at all.
 *
 * USAGE:
 * slowFileThresholdStatics.threshold.testWarnMs;
 * // Returns: 1000 (1 second of actual test bodies)
 */
export const slowFileThresholdStatics = {
  threshold: {
    // Wall time — jest's `endTime - startTime`. It spans the package's one-time compile and its
    // module evaluation, both of which land on whichever suite reaches a module FIRST, so it says
    // where a file sat in the run rather than what it cost. Used only where nothing better exists.
    warnMs: 5000,
    // Summed assertion durations: the test bodies themselves. Measured across two packages on a
    // warm cache, one suite of 176 exceeded 1s and none exceeded 3s, so this names the outliers
    // rather than a third of the repo.
    testWarnMs: 1000,
    // Summed eslint rule time plus fix, with the TypeScript program build left out. Measured over
    // a whole-package lint of `web` and of `shared` on a quiet machine: medians of 14ms and 8.5ms,
    // 99th percentiles of 293ms and 109ms, and single worst files of 873ms and 596ms — nothing
    // reached a second. Held at the jest bar rather than dropped to the low hundreds because rule
    // time roughly doubles under CPU contention (one 40-file batch's worst file went 335ms to
    // 636ms at 3x oversubscription), and a flagged file FAILS the run.
    lintRulesWarnMs: 1000,
    // A browser spec navigates, waits for real paint and talks to a real server, so it cannot be
    // held to the jest bar. Playwright reports execution time per test and excludes browser boot,
    // so this is still test-body time and not startup. Calibrated on the five specs of one batch,
    // which summed 0.2s to 1.4s each — a small sample, and worth revisiting once a full sweep has
    // reported all 111.
    e2eTestWarnMs: 5000,
  },
} as const;
