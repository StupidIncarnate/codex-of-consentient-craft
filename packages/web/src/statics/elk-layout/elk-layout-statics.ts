/**
 * PURPOSE: Defines the immutable geometry of the flow diagram layout — the box every flow node
 * occupies in the ELK graph, the size of the assertion (observable) cards that branch off to the
 * right of each flow node, and the ELK spacing knobs. This is the single source of truth for flow
 * node size: the FLOW_NODE card is rendered to EXACTLY `node.width` (border-box) and its FULL label
 * wraps within it, so each rendered card fits inside the non-overlapping rectangle ELK reserves for
 * it.
 *
 * An assertion column is NOT an ELK child — it is painted at `node.width + observable.gap` from its
 * card — so ELK reserves its space along both axes indirectly, and each axis has its own mechanism:
 *   - HEIGHT: the owning node's ELK box is inflated to the column's full height (elkLayoutAdapter),
 *     so a column never reaches a lower layer.
 *   - WIDTH: `spacing.nodeNode` AND `spacing.edgeNode`, which must BOTH exceed the column's span.
 *     See the note on `spacing` — a same-layer neighbour is held off by one or the other depending
 *     on whether a routed edge passes between them, and getting only the first of the two right is
 *     what put assertion cards on top of node cards.
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
  // The FLOW_NODE card shows its FULL label (wrapped, never clamped) AND a wrapping row of package
  // chips, so its height varies with both. ELK must reserve each node's real height or stacked rows
  // overlap. Rather than measure the DOM, height is estimated: a deliberately LOW charsPerLine
  // (well under the ~29 a 240px monospace line actually fits) over-counts wrapped lines so the
  // reserved box is always >= the rendered card. The reserved card height is:
  //   chromeHeight + ceil(labelLength / charsPerLine) * lineHeight
  //     + badgeHeight + packageRowLines * packageRow.lineHeight + buffer
  labelEstimate: {
    charsPerLine: 18,
    lineHeight: 16,
    chromeHeight: 40,
    badgeHeight: 22,
    // The FLOW_NODE_PACKAGES chip row, reserved by the same over-counting trick as the label but in
    // chip units. Each chip costs its name's length plus `chipOverheadChars` for its padding and the
    // gap to its neighbour, and `charsPerLine` is set well under the ~35 characters a 240px card
    // really fits, so the inflated per-chip cost also absorbs what greedy wrapping wastes at the end
    // of a line. A seam node carries two or more chips here, which is precisely the case that
    // overlaps its lower neighbour if this term is left out.
    packageRow: {
      charsPerLine: 22,
      chipOverheadChars: 5,
      lineHeight: 22,
    },
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
  // chromeHeight covers the card padding plus the tag row, which carries the outcome-type tag AND
  // the resolved package chip — two tags on a 220px card wrap to a second line for the longer
  // names, so a full extra row is reserved rather than the one the single tag needed.
  observable: {
    width: 220,
    gap: 56,
    rowGap: 12,
    labelEstimate: {
      charsPerLine: 26,
      lineHeight: 15,
      chromeHeight: 52,
      buffer: 10,
    },
  },
  // Layout spacing handed to ELK (px).
  //
  // **`nodeNode` and `edgeNode` are BOTH horizontal clearance to the right of a card, and the
  // assertion column needs whichever one applies — so both must exceed `observable.gap +
  // observable.width` (276).** That is the whole width reservation: the column is not an ELK child,
  // so nothing but this pair keeps a neighbour out of it. Which one applies depends on what ELK put
  // next to the card IN ITS LAYER, and there are two possibilities, not one:
  //   - another card              -> `nodeNode`
  //   - a routed edge's dummy     -> `edgeNode`, TWICE (once either side of the zero-width dummy)
  // ELK layered breaks every multi-layer edge into a per-layer dummy, so any layer a long edge or a
  // back-edge passes through has one sitting between its cards — and a pair split that way is
  // spaced by `edgeNode`, never by `nodeNode`, however large `nodeNode` is. Measured on a real
  // 19-node quest flow: a back-edge dummy between two same-layer terminals put them `2 x edgeNode`
  // apart while `nodeNode` was 300, so anything under half the column span there paints the left
  // card's assertions across the right card, and raising `nodeNode` does not move either of them.
  // `elkLayoutStatics.test.ts` pins the min of the two against the column span.
  //
  // Per-node ELK options would express this better — the node genuinely occupies card + column —
  // but elkjs honours none of them: `org.eclipse.elk.margins`, `spacing.individual` and
  // `nodeSize.minimum` were each measured leaving the layout byte-identical. Reserving the column in
  // the node's WIDTH is the other alternative and is rejected for the reason it always was: ELK
  // centers a node in its layer, so a card-plus-column box zig-zags the spine against the cards that
  // have no column.
  //
  // nodeNodeBetweenLayers gives a wrapped multi-line label vertical room between layers; the column
  // needs nothing from it, because a column's HEIGHT is reserved on its own node's ELK box (see
  // elkLayoutAdapter) and so never leaves that node's layer. edgeEdge is the clearance ELK keeps
  // between two routed edges. Each edge is drawn along ELK's routed bend points (see
  // xyflowEdgeAdapter), so ELK's own clearances also keep the edges themselves off the cards.
  spacing: {
    nodeNode: 300,
    nodeNodeBetweenLayers: 140,
    edgeNode: 300,
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
  // React Flow viewport knobs. On load the diagram frames itself ON the entry node: the first step
  // (the single node every flow starts with) sits in the horizontal middle near the top at natural
  // card size, and the reviewer scrolls down for the rest — instead of the whole tall graph being
  // shrunk to fit and vertically centered (which reads as "zoomed way out, first node lost in the
  // middle"). The load zoom is sized to ONE step of the flow — the entry card's center out to the
  // right edge of its assertion column — so it does not shrink as the graph grows, and the entry's
  // own assertions never sit past the canvas edge, where a pan-only canvas puts them out of reach.
  //   - `minZoom` is the zoom floor for both the user's manual zoom-out and the load framing, so a
  //     very wide graph can still shrink into the canvas. React Flow's default 0.5 is too high for
  //     wide assertion-rich graphs.
  //   - `maxZoom` is what the load framing uses whenever the canvas can afford a whole step, so a
  //     panel with room renders its cards 1:1 rather than blown up or shrunk.
  //   - `topPadding` / `sidePadding` are the px gaps kept above the entry node and on each side.
  //   - `centerDivisor` halves spans/dimensions when centering the entry node (named so the layout
  //     math carries no bare `2`, mirroring `edgeLabel.midpointDivisor`).
  viewport: {
    minZoom: 0.1,
    maxZoom: 1,
    topPadding: 24,
    sidePadding: 24,
    centerDivisor: 2,
  },
} as const;
