/**
 * PURPOSE: Defines the time-to-live for cached ward run results
 *
 * USAGE:
 * const ttl = ttlStatics.runResultTtl;
 * // Returns: 172800000 (2 days in milliseconds)
 *
 * IT OUTLIVES THE GAP BETWEEN A RED RUN AND THE SESSION SENT TO FIX IT. A spiritmender is dispatched
 * off a failed ward result and reads that run's detail back with `npm run ward -- detail <runId>`,
 * which `storagePruneBroker` had already deleted from `.ward/` on the next run. Measured: a ward
 * failed at 20:04:53, the repair session started at 21:14:06, and the evidence had expired nine
 * minutes earlier — so it worked blind, inferring scope from `git diff --name-only` with no way to
 * know whether that covered every file the run flagged.
 *
 * THE WINDOW IS BOUNDED BECAUSE THESE FILES ARE NOT SMALL. A run result is mostly the raw stdout of
 * every check in every package, kept verbatim so `ward detail` and `ward raw` can read it back:
 * measured at 96.4% of one 295.7 MB file, with 39 files over 50 MB accounting for 6.45 GB of a
 * single 7.75 GB `.ward/`. Retention buys evidence and costs gigabytes a day, so the window spans a
 * dispatch gap and no more. Lengthen it only against a measurement of what the extra days cost on
 * the repo doing the lengthening.
 */

export const ttlStatics = {
  runResultTtl: 172800000,
} as const;
