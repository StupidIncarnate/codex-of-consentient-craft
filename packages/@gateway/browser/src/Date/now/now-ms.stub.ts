/**
 * PURPOSE: A fixed instant, as milliseconds since the epoch, for a test that stages the clock
 * through `nowProxy().setupNow` and asserts a value derived from it.
 *
 * USAGE:
 * const ms = NowMsStub({ iso: '2024-01-01T00:00:00.000Z' });
 * // Returns 1704067200000
 */

export const NowMsStub = ({ iso = '2024-01-01T00:00:00.000Z' }: { iso?: string } = {}): number =>
  new Date(iso).getTime();
