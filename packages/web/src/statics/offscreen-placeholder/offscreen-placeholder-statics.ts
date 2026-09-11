/**
 * PURPOSE: The height a transcript entry reserves while the browser is still skipping it. Reach for
 * this rather than a number at the call site: the entry that is skipped has no size of its own, so
 * this figure is the only thing holding the scrollbar's length up, and a value that misses what the
 * entry really lays out to makes the transcript report a length it does not have.
 *
 * USAGE:
 * offscreenPlaceholderStatics.heights.chatMessage;
 * // 400 — what a message entry reserves before the browser has laid it out
 */

import { stickyHeaderStatics } from '../sticky-header/sticky-header-statics';

export const offscreenPlaceholderStatics = {
  heights: {
    // A collapsed row's box IS its own header, so the height that header pins at is the height the
    // row lays out to — and every row in a transcript is collapsed but the ones a reader opened.
    // Reading it from there rather than repeating 25 is what keeps the two agreeing.
    toolRow: stickyHeaderStatics.heights.toolRow,
    // The MEAN of a measured transcript's message heights, not the median. A message is prose of
    // any length, so no one number fits an individual — 285 messages in one abandoned quest ran a
    // median of 80px against a mean of 399px. The mean is the one that makes the SUM come out, and
    // the sum is what the scrollbar reports: at the median that transcript claimed 57,075px against
    // a real 144,626px, and at this value it claimed 148,275px.
    chatMessage: 400,
  },
} as const;
