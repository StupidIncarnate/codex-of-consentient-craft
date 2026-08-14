/**
 * PURPOSE: Answers the question no single pinned header can answer alone — which of two of them
 * paints on top. Reach for this rather than giving each widget a fixed rank by its type: sub-agent
 * chains nest inside themselves, so "chain outranks tool row" leaves an outer chain and the chain
 * inside it tied, and the inner one wins on DOM order. The pin offset is the only value that already
 * separates them, so the rank is derived from it.
 *
 * USAGE:
 * stickyHeaderZIndexTransformer({ stickyTop: cssPixelsContract.parse(23) });
 * // Returns 77 — one band under the header pinned at 0 that this one stacks beneath
 */

import type { CssPixels } from '@dungeonmaster/shared/contracts';

import type { StickyZIndex } from '../../contracts/sticky-z-index/sticky-z-index-contract';
import { stickyZIndexContract } from '../../contracts/sticky-z-index/sticky-z-index-contract';
import { stickyHeaderStatics } from '../../statics/sticky-header/sticky-header-statics';

export const stickyHeaderZIndexTransformer = ({
  stickyTop,
}: {
  stickyTop: CssPixels;
}): StickyZIndex =>
  stickyZIndexContract.parse(
    Math.max(stickyHeaderStatics.zIndexFloor, stickyHeaderStatics.zIndexBase - Number(stickyTop)),
  );
