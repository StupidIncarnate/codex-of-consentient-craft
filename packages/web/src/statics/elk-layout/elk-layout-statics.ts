/**
 * PURPOSE: Defines immutable dimension values for ELK graph layout nodes. These MUST
 * approximate the real rendered FLOW_NODE card size — elk spaces rows/columns using these
 * dimensions, so an undersized height packs the layered rows closer than the cards are tall
 * and adjacent rows visually overlap once React Flow fit-view scales the graph into the canvas.
 * A node card renders a type icon + label + (optional) observable-count badge inside ~16px of
 * vertical padding, which is ~130px tall; height is sized above that so rows never collide.
 *
 * USAGE:
 * elkLayoutStatics.node.width;
 * // Returns 200
 *
 * elkLayoutStatics.node.height;
 * // Returns 140
 */

export const elkLayoutStatics = {
  node: {
    width: 200,
    height: 140,
  },
} as const;
