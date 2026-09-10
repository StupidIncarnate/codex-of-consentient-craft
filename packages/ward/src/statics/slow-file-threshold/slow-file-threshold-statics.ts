/**
 * PURPOSE: Defines when ward calls a file slow. Two numbers, because the checks measure two
 * different things — reach for `testWarnMs` for anything jest reports, and `warnMs` only for a check
 * that gives no per-test durations at all.
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
    // A browser spec navigates, waits for real paint and talks to a real server, so it cannot be
    // held to the jest bar. Playwright reports execution time per test and excludes browser boot,
    // so this is still test-body time and not startup. Calibrated on the five specs of one batch,
    // which summed 0.2s to 1.4s each — a small sample, and worth revisiting once a full sweep has
    // reported all 111.
    e2eTestWarnMs: 5000,
  },
} as const;
