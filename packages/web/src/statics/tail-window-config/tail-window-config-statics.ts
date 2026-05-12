/**
 * PURPOSE: Constants for the tail-window collapse behavior used by SubagentChainWidget and ChatEntryListWidget — how many render units stay visible when a chain is collapsed.
 *
 * USAGE:
 * tailWindowConfigStatics.maxVisibleWhenCollapsed
 * // 2 — the most recent message anchor + the most recent unit overall.
 */

export const tailWindowConfigStatics = {
  // When a chain has BOTH a message anchor (text/user/system) AND a later non-anchor unit
  // (e.g. a tool call), we keep TWO units visible: the anchor row and the most-recent row.
  // When the anchor IS the most-recent row (or no anchor exists), only ONE unit shows.
  maxVisibleWhenCollapsed: 2,
  minVisibleWhenCollapsed: 1,
} as const;
