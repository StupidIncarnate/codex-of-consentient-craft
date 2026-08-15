/**
 * PURPOSE: Puts the implementation ledger in dependency order — a package's builder runs after the
 * packages it imports — without disturbing anything else on it. Only `codeweaver` items move, and
 * they move only among the positions codeweaver items already occupy, so an intake item's place in
 * the ledger is untouched. Reach for this at Start, once `quest.packageGraph` exists; before that
 * the graph is empty, every item ranks equal, and the authored order survives intact.
 *
 * Safe as a pure reorder because nothing reads a ledger position: `questAdvanceBroker` takes the
 * FIRST pending item, and a pt chain keys on role plus base text rather than on an index.
 *
 * USAGE:
 * operationsCodeweaverOrderTransformer({ operations: quest.operations, packageGraph: quest.packageGraph });
 * // Returns the same items, codeweaver ones re-sorted dependencies-first with ties in authored order
 */

import type { OperationItem, Quest } from '@dungeonmaster/shared/contracts';
import { packageBuildOrderStatics } from '@dungeonmaster/shared/statics';

export const operationsCodeweaverOrderTransformer = ({
  operations,
  packageGraph,
}: {
  operations: OperationItem[];
  packageGraph: Quest['packageGraph'];
}): OperationItem[] => {
  const depthByPackage = new Map(packageGraph.map((entry) => [String(entry.id), entry.depth]));

  // The KIND tier outranks the manifest depth, for the reason `packageBuildOrderStatics` documents:
  // depth is inverted across an HTTP seam, and in this repo it puts `web` ahead of the `server`
  // whose routes it calls. Read off `packageGraph[].packageType`, which is the detector's single
  // winning LABEL — the derived ledger ranks on the whole kind SET instead, and the two can differ
  // for a package that is honestly two kinds. That only matters here, on a HAND-AUTHORED ledger,
  // which no feature quest produces any more; a derived ledger arrives already ordered and never
  // reaches this sort.
  const tierByKind = new Map(
    packageBuildOrderStatics.tiers.flatMap((tier, tierIndex) =>
      tier.map((kind) => [kind, tierIndex] as const),
    ),
  );
  const unrankedTier = packageBuildOrderStatics.tiers.length;
  const tierByPackage = new Map(
    packageGraph.map(
      (entry) => [String(entry.id), tierByKind.get(entry.packageType) ?? unrankedTier] as const,
    ),
  );

  // An item declaring no package, or naming one the graph does not carry, ranks at infinity and
  // sorts last. When EVERY item ranks there — a quest with no graph stamped yet — they all tie and
  // the stable tiebreak returns the authored order unchanged, which is what makes this safe to run
  // over any ledger.
  const ranked = operations.flatMap((item, order) =>
    item.role === 'codeweaver'
      ? [
          {
            item,
            order,
            tier: Math.min(
              ...item.packageNames.map(
                (name) => tierByPackage.get(String(name)) ?? Number.POSITIVE_INFINITY,
              ),
              Number.POSITIVE_INFINITY,
            ),
            depth: Math.min(
              ...item.packageNames.map(
                (name) => depthByPackage.get(String(name)) ?? Number.POSITIVE_INFINITY,
              ),
              Number.POSITIVE_INFINITY,
            ),
          },
        ]
      : [],
  );

  // Compared for equality before subtracting: two infinities subtract to NaN, and a NaN comparator
  // makes the sort's result implementation-defined. An item declaring no package, or naming one the
  // graph does not carry, ranks at infinity on BOTH keys and sorts last; when every item ranks there
  // they all tie and the stable `order` tiebreak returns the authored order unchanged, which is what
  // makes this safe to run over any ledger.
  const reordered = [...ranked].sort((left, right) => {
    if (left.tier !== right.tier) {
      return left.tier - right.tier;
    }
    return left.depth === right.depth ? left.order - right.order : left.depth - right.depth;
  });

  const replacementByPosition = new Map(
    ranked.map((entry, index) => [entry.order, reordered[index]?.item ?? entry.item]),
  );

  return operations.map((item, index) => replacementByPosition.get(index) ?? item);
};
