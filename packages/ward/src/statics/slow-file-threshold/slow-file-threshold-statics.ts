/**
 * PURPOSE: Defines when ward calls a file slow. One number per thing a check can actually measure —
 * reach for `testWarnMs` for a jest unit suite, `integrationTestWarnMs` for a jest integration
 * suite, `lintRulesWarnMs` for eslint's rule work, and `warnMs` only for a check that gives no
 * per-file breakdown at all.
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
    // The WORST SINGLE TEST in a unit suite, not the suite's sum — see `fileTimingContract` for
    // why a sum grades a file on how many tests it holds. Measured across the thirteen slowest
    // unit files in this repo: the worst single test anywhere was 413ms, and the files that used
    // to trip a summed bar hold 87, 96 and 153 tests at 18-20ms each. So a second of ONE test is
    // well clear of anything healthy here, and it is the bar that caught the real defect this was
    // calibrated against — one test sitting through a responder's real 3s retry budget.
    testWarnMs: 1000,
    // An integration test may spawn real processes or run package installers sequentially across
    // every workspace package in the monorepo, and under whole-repo concurrency with all packages
    // running at once, contended multi-installer suites clear in 8-9 seconds. Ten clears contended
    // multi-installer runs and still catches an integration test doing runaway work.
    integrationTestWarnMs: 10_000,
    // Summed eslint rule time plus fix. It does NOT exclude the cost of the TypeScript program:
    // the type-aware rules pull types lazily as they run, so whichever file first reaches a part
    // of the type graph is charged with checking it. That charge belongs to the batch, not to the
    // file, and it moves between runs. `dm-registry-broker.test.ts` is an 81-line file measured at
    // 25.8ms inside its own 338-file package run, 844ms as the only file in its batch, and 2920ms
    // during a whole-repo sweep — the same bytes all three times.
    //
    // CPU contention then scales the whole batch on top of that: those same 338 files summed
    // 5188ms of rule time alone and 18_137ms during the sweep.
    //
    // FOUR SECONDS, which clears the worst figure the two effects together have produced here
    // (2920ms) and sits far above the same contended sweep's 99th percentile (278ms across 2115
    // files). A flagged file FAILS the run, so this bar buys headroom rather than sensitivity: an
    // absolute per-file bar cannot tell a genuinely costly file from the one that happened to
    // absorb the type-check, and only a batch-relative gate could.
    lintRulesWarnMs: 4000,
    // A browser spec navigates, waits for real paint and talks to a real server, so it cannot be
    // held to the jest bar. Playwright reports execution time per test and excludes browser boot,
    // so this is still test-body time and not startup.
    //
    // Calibrated on the whole suite rather than the five specs of one batch. Across 110 specs and
    // 440 tests, the median spec's worst test runs 0.53s; the slowest measured anywhere is 7.9s,
    // in a spec that sends images deliberately sized past the upload cap so a progress bar can be
    // watched climbing from 0 to 100 — the transfer time IS what that test observes, so it is a
    // measurement rather than a cost to remove. Two more sit near 3.6s and 4.4s, each a delay the
    // test is asserting on.
    //
    // FIFTEEN SECONDS, which sits above the integration bar and headroom for browser specs.
    e2eTestWarnMs: 15_000,
  },
} as const;
