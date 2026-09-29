/**
 * PURPOSE: Reads the current time as milliseconds since the epoch, at call time. Reach for this
 * over `Date.now()` so a test stages the clock through `nowProxy()` instead of spying on the global;
 * reach for `nowIso` when the caller wants the same instant as an ISO string.
 *
 * USAGE:
 * const startedAt = now();
 * // Returns the same number Date.now() does
 */

export const now = (): number => Date.now();
