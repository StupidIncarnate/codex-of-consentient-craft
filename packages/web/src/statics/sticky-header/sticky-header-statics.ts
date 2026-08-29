/**
 * PURPOSE: The one place the three expandable headers agree on how tall each of them is. Reach for
 * this rather than a constant inside each widget: the levels nest, and each one pins at the SUM of
 * the heights above it, so a height that is recorded in the widget that owns it and guessed by the
 * widget below leaves a sliver of scrolling content showing between two pinned bars.
 *
 * USAGE:
 * stickyHeaderStatics.heights.subagentChain;
 * // 31 — what a sub-agent chain adds to the offset it hands its own tool rows
 */

export const stickyHeaderStatics = {
  // Measured in Chrome against a live execution panel, and each header re-declares its value as an
  // explicit `height` when it pins, so the offsets below it stay exact rather than inheriting
  // whatever the content happened to lay out to.
  heights: {
    executionRow: 23,
    subagentChain: 31,
    toolRow: 25,
  },
  // A pinned header has to paint over two different things: the body scrolling beneath it, and any
  // header nested inside it. The second is the one with a trap — an inner header sits LATER in the
  // DOM, so at `z-index: auto` it slides across an already-pinned outer header on its way up the
  // screen. Subtracting the pin offset orders them without any level having to know its own depth,
  // because the offset already grows with every level. The floor keeps a deeply nested header off
  // zero, where it would paint behind its own container's background and vanish while pinned.
  // The whole band stays below QuestQueueBarWidget's 1100: that bar pins at the top of the entire
  // app column rather than inside a panel, so a header that outranked it would slide over the app's
  // own chrome.
  zIndexBase: 100,
  zIndexFloor: 1,
} as const;
