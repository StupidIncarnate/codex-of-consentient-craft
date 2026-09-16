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

import { countDeltaContract } from '../../contracts/count-delta/count-delta-contract';
import type { CountDelta } from '../../contracts/count-delta/count-delta-contract';
import type { ReadingCount } from '../../contracts/reading-count/reading-count-contract';

export const countDeltaRenderTransformer = ({
  before,
  after,
}: {
  before: ReadingCount;
  after: ReadingCount;
}): CountDelta => {
  const delta = after - before;
  const sign = delta >= 0 ? '+' : '';
  return countDeltaContract.parse(`${sign}${delta}`);
};
