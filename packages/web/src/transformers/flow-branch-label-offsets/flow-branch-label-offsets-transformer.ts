/**
 * PURPOSE: Computes a horizontal label offset (px) for each branch edge that leaves a decision node
 * alongside a sibling, so their labels sit clearly to the sides of the decision's vertical spine
 * instead of crowding it. React Flow paints each branch label at its edge's geometric midpoint; a
 * branch that runs straight down the spine (or reconverges further down) has its midpoint land on
 * or beside that spine, so the label reads as belonging to the central line. This transformer, for
 * every source with 2+ labeled branches, pushes each label at least `edgeLabel.spineClearance` off
 * the spine onto its side (labels already further out keep tracking their edge), stacking same-side
 * labels `edgeLabel.minSiblingSeparation` apart. It returns `edgeId -> offsetX` relative to the
 * edge's midpoint. Edges that are the only labeled branch of their source are omitted.
 *
 * USAGE:
 * flowBranchLabelOffsetsTransformer({ edges: flow.edges, positions });
 * // => { 'dec-to-left': -40, 'dec-to-down': 140 }
 */

import type { FlowEdge } from '@dungeonmaster/shared/contracts';

import type { ElkPositionMap } from '../../contracts/elk-position-map/elk-position-map-contract';
import { flowBranchLabelOffsetMapContract } from '../../contracts/flow-branch-label-offset-map/flow-branch-label-offset-map-contract';
import type { FlowBranchLabelOffsetMap } from '../../contracts/flow-branch-label-offset-map/flow-branch-label-offset-map-contract';
import { elkLayoutStatics } from '../../statics/elk-layout/elk-layout-statics';

export const flowBranchLabelOffsetsTransformer = ({
  edges,
  positions,
}: {
  edges: readonly FlowEdge[];
  positions: ElkPositionMap;
}): FlowBranchLabelOffsetMap => {
  const { spineClearance: clearance, minSiblingSeparation: minSep } = elkLayoutStatics.edgeLabel;

  const labeled = edges.filter((edge) => edge.label !== undefined);
  const sourceIds = [...new Set(labeled.map((edge) => edge.from))];

  const entries = sourceIds.flatMap((sourceId) => {
    const group = labeled.filter((edge) => edge.from === sourceId);
    if (group.length <= 1) {
      return [];
    }

    // natDist = signed horizontal distance from the source's spine (its own X) to the edge's
    // natural label midpoint. Sign picks the side; magnitude is how far the label naturally sits.
    const items = group.map((edge) => {
      const sourceX = positions[String(edge.from)]?.x ?? 0;
      const ends = [sourceX, positions[String(edge.to)]?.x ?? 0];
      const mid = ends.reduce((sum, x) => sum + x, 0) / ends.length;
      return { edge, natDist: mid - sourceX };
    });

    // A straight-down branch (natDist 0) has no side of its own, so it goes to whichever side is
    // lighter — pushing it clear of the spine opposite its sibling(s).
    let leftLoad = items.filter((i) => i.natDist < 0).length;
    let rightLoad = items.filter((i) => i.natDist > 0).length;
    const centerRightIds = new Set();
    items
      .filter((i) => i.natDist === 0)
      .sort((a, b) => (String(a.edge.id) < String(b.edge.id) ? -1 : 1))
      .forEach((i) => {
        if (leftLoad <= rightLoad) {
          leftLoad += 1;
        } else {
          rightLoad += 1;
          centerRightIds.add(String(i.edge.id));
        }
      });

    const sided = items.map((i) => {
      const centerSide = centerRightIds.has(String(i.edge.id)) ? 1 : -1;
      // Math.sign is ±1 for a real side and 0 (falsy) for a straight-down branch, which then falls
      // back to its assigned centerSide.
      return { edge: i.edge, natDist: i.natDist, side: Math.sign(i.natDist) || centerSide };
    });

    // On each side, stack labels outward from the spine: each at least `clearance` off the spine,
    // its natural distance if further, and at least `minSep` beyond the previous same-side label.
    // placed[k] = max(base[k], max over j<k of (base[j] + (k - j) * minSep)) — the greedy sweep in
    // closed form so no typed accumulator is needed.
    return [-1, 1].flatMap((side) => {
      const sideItems = sided
        .filter((i) => i.side === side)
        .sort((a, b) => {
          const byDistance = Math.abs(a.natDist) - Math.abs(b.natDist);
          if (byDistance !== 0) {
            return byDistance;
          }
          return String(a.edge.id) < String(b.edge.id) ? -1 : 1;
        });
      const bases = sideItems.map((i) => Math.max(Math.abs(i.natDist), clearance));
      const placed = bases.map((base, k) =>
        Math.max(base, ...bases.slice(0, k).map((b, j) => b + (k - j) * minSep)),
      );
      return sideItems.map((i, k) => {
        const distance = placed[k] ?? Math.max(Math.abs(i.natDist), clearance);
        return [String(i.edge.id), side * distance - i.natDist] as const;
      });
    });
  });

  return flowBranchLabelOffsetMapContract.parse(Object.fromEntries(entries));
};
