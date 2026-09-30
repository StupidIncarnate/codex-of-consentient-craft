/**
 * PURPOSE: Returns the index of the most recent anchor unit in a renderable-unit list (chain rendered units flagged as anchors), falling back to the last unit when no anchor exists. Used by ChatEntryListWidget for tail-window collapse.
 *
 * USAGE:
 * findAnchorUnitTailIndexTransformer({ flags: [false, true, false, false] });
 * // Returns 1 — the last `true` index. visibleStart = result; everything before is hidden.
 */

export const findAnchorUnitTailIndexTransformer = ({ flags }: { flags: boolean[] }): number => {
  if (flags.length === 0) {
    return 0;
  }

  for (let i = flags.length - 1; i >= 0; i--) {
    if (flags[i] === true) {
      return i;
    }
  }

  return flags.length - 1;
};
