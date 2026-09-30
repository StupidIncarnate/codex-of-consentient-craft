/**
 * PURPOSE: Renders the signed change between two `ReadingCount`s that `compare` reports — always
 * signed, so a zero delta prints `'+0'` and is never mistaken for the unsigned count it was computed
 * from. Reach for this at the one edge where an index delta becomes the string `compare` hands back;
 * every upstream broker keeps holding the two raw `ReadingCount`s so they stay subtractable.
 *
 * USAGE:
 * countDeltaRenderTransformer({ before: 0, after: 2 });
 * // Returns '+2' as branded CountDelta
 */


export const countDeltaRenderTransformer = ({
  before,
  after,
}: {
  before: number;
  after: number;
}): string => {
  const delta = after - before;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta}`;
};
