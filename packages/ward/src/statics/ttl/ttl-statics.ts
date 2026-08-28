/**
 * PURPOSE: Defines the time-to-live for cached ward run results
 *
 * USAGE:
 * const ttl = ttlStatics.runResultTtl;
 * // Returns: 604800000 (7 days in milliseconds)
 *
 * IT OUTLIVES THE GAP BETWEEN A RED RUN AND THE SESSION SENT TO FIX IT. A spiritmender is dispatched
 * off a failed ward result and reads that run's detail back with `npm run ward -- detail <runId>`,
 * which `storagePruneBroker` had already deleted from `.ward/` on the next run. Measured: a ward
 * failed at 20:04:53, the repair session started at 21:14:06, and the evidence had expired nine
 * minutes earlier — so it worked blind, inferring scope from `git diff --name-only` with no way to
 * know whether that covered every file the run flagged. The dispatch queue sets that delay, a quest
 * can sit in it across days, and nothing bounds it.
 *
 * THESE FILES ARE SMALL AND THE DIRECTORY IS GITIGNORED, so a longer window costs disk nobody is
 * counting. Expiring evidence a session was dispatched to read costs a whole repair pass.
 */

export const ttlStatics = {
  runResultTtl: 604800000,
} as const;
