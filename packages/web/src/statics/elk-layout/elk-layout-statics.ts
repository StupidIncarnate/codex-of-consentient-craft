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
  // Layout spacing handed to ELK (px). React Flow paints each branch-edge label centered on the
  // edge's geometric midpoint, so two sibling branches sit `nodeNode/2 + node.width/2` apart at
  // their label row. nodeNode is sized so that gap exceeds both an edge-label box
  // (`edgeLabel.maxWidth`) AND an assertion column (`observable.gap + observable.width`) so neither
  // branch labels nor assertion columns collide between same-layer siblings; nodeNodeBetweenLayers
  // gives a wrapped multi-line label vertical room between layers.
  //
  // edgeNode is the gap ELK keeps between a node and an edge routed past it. It is wide because a
  // reconverging "skip" edge (e.g. a decision's straight-down branch that rejoins below the node
  // its sibling feeds) is drawn by React Flow as a STRAIGHT line down the decision's spine, while
  // ELK only guarantees clearance for its own routed path. A tight edgeNode lets ELK park the
  // sibling branch node so its far edge pokes across that straight spine; the wide value pushes the
  // branch node fully into its own lane so the spine never cuts through the card.
  spacing: {
    nodeNode: 300,
    nodeNodeBetweenLayers: 140,
    edgeNode: 120,
    edgeEdge: 20,
  },
  // Wrapping branch-edge label box.
  //  - `maxWidth` bounds the box's width so its text wraps rather than running arbitrarily wide.
  //  - `skipLayerThreshold`/`skipLayerDrop` govern where a label anchors: a branch whose vertical
  //    span exceeds `skipLayerThreshold` (2× a between-layer gap) reconverges past an intervening
  //    layer, so its geometric midpoint would hide behind that layer's card; such a label is
  //    anchored `skipLayerDrop` px below the source instead — inside the first inter-layer gap
  //    (half of `spacing.nodeNodeBetweenLayers`), where no card can occlude it.
  //  - `spineClearance` is the minimum horizontal px between a branch label's center and the
  //    decision's own vertical spine. flowBranchLabelOffsetsTransformer pushes every branch label
  //    at least this far off the spine (onto its side) so a label never sits on the reconvergence
  //    line and read as belonging to it. It exceeds `maxWidth`/2 so even a full-width box clears.
  //    Labels whose natural midpoint is already further out keep tracking their edge.
  //  - `minSiblingSeparation` is the minimum horizontal px between the centers of two labels that
  //    land on the SAME side of the spine; they stack outward at this gap so they never overlap.
  edgeLabel: {
    maxWidth: 160,
    skipLayerDrop: 70,
    skipLayerThreshold: 280,
    spineClearance: 140,
    minSiblingSeparation: 180,
  },
  // A back-edge (loop) rejoins a node ABOVE its source — e.g. a per-file processing loop that jumps
  // from the tail of the pipeline back to "process next file". React Flow would draw it as a
  // straight line UP through the whole stack of intermediate nodes. Instead the custom edge bows it
  // out to the side by `loop.detour` px past the stack's spine (which sits at node center ± width/2)
  // so the loop reads as a clear arc around the pipeline rather than a line through every card.
  loop: {
    detour: 240,
  },
  // React Flow viewport zoom floor. fit-view clamps the fit zoom to >= minZoom; React Flow's
  // default 0.5 is too high for tall assertion-rich graphs — fit-view can't shrink the whole
  // graph into the collapsed (800px) canvas, so the diagram only appears once fullscreen enlarges
  // the canvas. A low floor lets fit-view frame the entire graph even when collapsed.
  viewport: {
    minZoom: 0.1,
  },
} as const;
