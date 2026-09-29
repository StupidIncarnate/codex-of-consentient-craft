/**
 * PURPOSE: The current instant as an ISO-8601 string, the browser's `new Date().toISOString()`.
 * The instant comes from `Date.now()`, read at call time, so the one clock `nowProxy` and
 * `nowIsoProxy` stage drives both this and `now`, and no test spies on `Date.prototype.toISOString`.
 *
 * USAGE:
 * const timestamp = nowIso();
 * // Returns e.g. '2024-01-01T00:00:00.000Z'
 */

export const nowIso = (): string => new Date(Date.now()).toISOString();
