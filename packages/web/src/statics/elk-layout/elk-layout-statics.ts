/**
 * PURPOSE: Defines the immutable geometry of the flow diagram layout — the box every flow node
 * occupies in the ELK graph, the size of the assertion (observable) cards that branch off to the
 * right of each flow node, and the ELK spacing knobs. This is the single source of truth for flow
 * node size: the FLOW_NODE card is rendered to EXACTLY `node.width` (border-box) and its FULL label
 * wraps within it, so each rendered card fits inside the non-overlapping rectangle ELK reserves for
 * it. Assertion cards branch to the right at `node.width + observable.gap`; ELK reserves each flow
 * node enough height to clear its whole assertion column so a column never overlaps a lower node.
 *
 * USAGE:
 * elkLayoutStatics.node.width;
 * // Returns 240
 * elkLayoutStatics.observable.width;
 * // Returns 220
 */

export const elkLayoutStatics = {
  node: {
    width: 240,
  },
  // The FLOW_NODE card shows its FULL label (wrapped, never clamped), so its height varies with
  // the label length. ELK must reserve each node's real height or stacked rows overlap. Rather
  // than measure the DOM, height is estimated from the label: a deliberately LOW charsPerLine
  // (well under the ~29 a 240px monospace line actually fits) over-counts wrapped lines so the
  // reserved box is always >= the rendered card. The reserved card height is:
  //   chromeHeight + ceil(labelLength / charsPerLine) * lineHeight + badgeHeight + buffer
  labelEstimate: {
    charsPerLine: 18,
    lineHeight: 16,
    chromeHeight: 40,
    badgeHeight: 22,
    buffer: 12,
  },
  // Assertion (observable) cards branch off to the RIGHT of each flow node, stacked into a column,
  // always visible (no click needed). `width` is the fixed card width its description wraps within;
  // `gap` is the horizontal distance from the flow card's right edge to the column; `rowGap` is the
  // vertical space between stacked cards. labelEstimate mirrors the flow-node trick: a low
  // charsPerLine over-counts wrapped lines so each card's estimated height is an upper bound. The
  // estimated card height is: chromeHeight + ceil(descriptionLength / charsPerLine) * lineHeight
  // + buffer; the column height is the sum of card heights plus rowGaps. ELK reserves
  // max(flowCardHeight, columnHeight) for the node so the column never overlaps a lower node.
  observable: {
    width: 220,
    gap: 56,
    rowGap: 12,
    labelEstimate: {
      charsPerLine: 26,
      lineHeight: 15,
      chromeHeight: 30,
      buffer: 10,
    },
  },
  // Layout spacing handed to ELK (px). nodeNode spreads same-layer siblings apart; it exceeds both
  // an edge-label box (`edgeLabel.maxWidth`) AND an assertion column (`observable.gap +
  // observable.width`) so neither collides between same-layer siblings. nodeNodeBetweenLayers gives
  // a wrapped multi-line label vertical room between layers. edgeNode/edgeEdge are the clearances
  // ELK keeps when it ROUTES an edge past a node / alongside another edge — each edge is drawn along
  // ELK's routed bend points (see xyflowEdgeAdapter), so ELK's own clearance keeps edges off cards.
  spacing: {
    nodeNode: 300,
    nodeNodeBetweenLayers: 140,
    edgeNode: 90,
    edgeEdge: 20,
  },
  // Wrapping branch-edge label box: `maxWidth` bounds the box's width so its text wraps rather than
  // running arbitrarily wide. The label rides its edge's ELK-routed path (see xyflowEdgeAdapter), so
  // it needs no manual off-spine offset — the routing already carries each branch to its own side.
  // `midpointDivisor` picks the route's middle segment for the label anchor: floor((points-1) / 2).
  edgeLabel: {
    maxWidth: 160,
    midpointDivisor: 2,
  },
  // A back-edge (loop) attaches to the RIGHT-side handles and is drawn as a clean rectangular arc
  // out to the side: `detour` px right of the card's right edge, up, and back in. Dashed so it
  // reads as a return path, not part of the downward flow.
  loop: {
    detour: 60,
  },
  // React Flow viewport zoom floor. fit-view clamps the fit zoom to >= minZoom; React Flow's
  // default 0.5 is too high for tall assertion-rich graphs — fit-view can't shrink the whole
  // graph into the collapsed (800px) canvas, so the diagram only appears once fullscreen enlarges
  // the canvas. A low floor lets fit-view frame the entire graph even when collapsed.
  viewport: {
    minZoom: 0.1,
  },
} as const;
