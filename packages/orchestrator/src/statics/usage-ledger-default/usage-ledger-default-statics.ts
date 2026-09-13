/**
 * PURPOSE: The ledger a machine starts from — nothing measured, nothing calibrated. Reach for this
 *   rather than building an empty object at each call site: a missing file and a corrupt one must
 *   resolve to the SAME state, and that state must be one the guardrail treats as "no reading",
 *   never as "zero spend", or a ledger that failed to parse would read as a completely idle week
 *   and clear a hold that should stand.
 *
 * USAGE:
 * usageLedgerDefaultStatics.empty;
 * // Returns the zero-state ledger, stamped at the epoch so its age is obvious
 */

export const usageLedgerDefaultStatics = {
  empty: {
    buckets: {},
    cursors: {},
    // Null, not zero. A zero ceiling would be a calibrated denominator of nothing; null is the
    // honest "never been refused, so nothing to compare against".
    ceilings: { fiveHour: null, sevenDay: null },
    updatedAt: '1970-01-01T00:00:00.000Z',
  },
} as const;
