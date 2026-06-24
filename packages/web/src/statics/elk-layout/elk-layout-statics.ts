/**
 * PURPOSE: Defines the immutable box every flow node occupies in the ELK layout. This is the
 * single source of truth for node size: the FLOW_NODE card is rendered to EXACTLY this width
 * (border-box) and bounded to this height (its label is line-clamped), so each rendered card
 * fits inside the non-overlapping rectangle ELK reserves for it. If the card were allowed to
 * grow to its natural content width, long-sentence labels would balloon far past this box and
 * adjacent cards (and their branch-edge labels) would overlap once fit-view scaled the graph in.
 *
 * USAGE:
 * elkLayoutStatics.node.width;
 * // Returns 240
 */

export const elkLayoutStatics = {
  node: {
    width: 240,
  },
  // The FLOW_NODE card shows its FULL label (wrapped, never clamped), so its height varies with
  // the label length. ELK must reserve each node's real height or stacked rows overlap. Rather
  // than measure the DOM, height is estimated from the label: a deliberately LOW charsPerLine
  // (well under the ~29 a 240px monospace line actually fits) over-counts wrapped lines so the
  // reserved box is always >= the rendered card. The reserved height is:
  //   chromeHeight + ceil(labelLength / charsPerLine) * lineHeight + (hasBadge ? badgeHeight : 0)
  //   + buffer
  labelEstimate: {
    charsPerLine: 18,
    lineHeight: 16,
    chromeHeight: 40,
    badgeHeight: 22,
    buffer: 12,
  },
  // Layout spacing handed to ELK (px). React Flow paints each branch-edge label centered on the
  // edge's geometric midpoint, so two sibling branches sit `nodeNode/2 + node.width/2` apart at
  // their label row. nodeNode is sized so that gap exceeds a label box (`edgeLabelMaxWidth`) so
  // the two branch labels never collide; nodeNodeBetweenLayers gives a wrapped multi-line label
  // vertical room between layers.
  spacing: {
    nodeNode: 180,
    nodeNodeBetweenLayers: 110,
    edgeNode: 30,
    edgeEdge: 20,
  },
  // Max width (px) of the wrapping branch-edge label box. The full label wraps to as many lines
  // as it needs within this width; bounding the width keeps two sibling labels — centered
  // `(node.width + nodeNode)/2` apart — from overlapping no matter how long the text is.
  edgeLabelMaxWidth: 160,
} as const;
