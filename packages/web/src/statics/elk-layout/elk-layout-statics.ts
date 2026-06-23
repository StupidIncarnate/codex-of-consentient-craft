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
 *
 * elkLayoutStatics.node.height;
 * // Returns 150
 */

export const elkLayoutStatics = {
  node: {
    width: 240,
    height: 150,
  },
  // Label line cap for the FLOW_NODE card. Four lines of the 12px monospace label plus the
  // type icon and observable badge stay within `node.height`, so the card never exceeds its
  // reserved box. Full label text is always available in the detail panel on click.
  labelMaxLines: 4,
  // Layout spacing handed to ELK (px). React Flow paints each branch-edge label centered on the
  // edge's geometric midpoint, so two sibling branches sit `nodeNode/2 + node.width/2` apart at
  // their label row. nodeNode is sized so that gap exceeds a bounded edge label (see
  // `edgeLabelMaxChars`) and the two branch labels never collide.
  spacing: {
    nodeNode: 160,
    nodeNodeBetweenLayers: 90,
    edgeNode: 30,
    edgeEdge: 20,
  },
  // Branch-edge labels are truncated to this many characters (with an ellipsis) so a long
  // condition can't paint past its neighbour; the edge's target node carries the full wording.
  edgeLabelMaxChars: 22,
} as const;
