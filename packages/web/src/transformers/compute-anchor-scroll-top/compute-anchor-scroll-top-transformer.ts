/**
 * PURPOSE: Works out where a scrollport has to sit for one element inside it to occupy the same
 * screen position it held a moment ago — the arithmetic behind "the control you clicked stays where
 * you clicked it" when a disclosure opens or closes and changes the height of everything around it.
 *
 * It diffs the anchor's CURRENT offset against the remembered one rather than taking the height
 * that was added, and that is what makes it self-correcting: it lands on the same answer whatever
 * else moved the scrollport in between, including an auto-scroll that already jumped to the bottom.
 * A "how much taller did it get" version has to be told about every one of those, and is wrong the
 * first time something it was not told about moves.
 *
 * USAGE:
 * computeAnchorScrollTopTransformer({currentScrollTop: 400, anchorOffset: 260, heldOffset: 60, maxScrollTop: 900});
 * // Returns 600 — the anchor drifted 200px down the scrollport, so the scrollport follows it
 */

export const computeAnchorScrollTopTransformer = ({
  currentScrollTop,
  anchorOffset,
  heldOffset,
  maxScrollTop,
}: {
  currentScrollTop: number;
  anchorOffset: number;
  heldOffset: number;
  maxScrollTop: number;
}): number => {
  const target = currentScrollTop + (anchorOffset - heldOffset);
  const ceiling = Math.max(maxScrollTop, 0);

  return Math.min(Math.max(target, 0), ceiling);
};
