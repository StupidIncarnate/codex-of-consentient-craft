/**
 * PURPOSE: Returns the index of the most recent anchor unit in a renderable-unit list (chain rendered units flagged as anchors), falling back to the last unit when no anchor exists. Used by ChatEntryListWidget for tail-window collapse.
 *
 * USAGE:
 * findAnchorUnitTailIndexTransformer({ flags: [false, true, false, false] });
 * // Returns 1 — the last `true` index. visibleStart = result; everything before is hidden.
 */

import { tailStartIndexContract } from '../../contracts/tail-start-index/tail-start-index-contract';
import type { TailStartIndex } from '../../contracts/tail-start-index/tail-start-index-contract';

export const findAnchorUnitTailIndexTransformer = ({
  flags,
}: {
  flags: boolean[];
}): TailStartIndex => {
  if (flags.length === 0) {
    return tailStartIndexContract.parse(0);
  }

  for (let i = flags.length - 1; i >= 0; i--) {
    if (flags[i] === true) {
      return tailStartIndexContract.parse(i);
    }
  }

  return tailStartIndexContract.parse(flags.length - 1);
};
