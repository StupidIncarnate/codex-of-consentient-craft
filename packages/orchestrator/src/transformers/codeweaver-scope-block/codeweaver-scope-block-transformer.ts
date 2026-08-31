/**
 * PURPOSE: Renders the two facts about a codeweaver cell that only the QUEST holds, and no flow
 * slice answers: the SEAMS it sits on — each node it shares with another package, and where that
 * package's half stands in the relay right now — and the SHARED HOMES it may move code into when a
 * change needs behaviour that lives in a sibling package. Reach for this rather than the flow slice
 * `get-quest({ questId, flowId, packageName })` returns: that render answers what the spec says,
 * while these two answer whose half the other side of a node is, and which declared package both
 * sides of a move can call.
 *
 * USAGE:
 * codeweaverScopeBlockTransformer({ quest, operationItem });
 * // Returns ContentText[] lines to splice into the agent's Operation Context, empty when the item
 * // declares no package and for each block the quest gives nothing to say
 *
 * WHY THE REST OF THE SCOPE IS NOT HERE. The nodes, the verbatim observables, the contracts and the
 * design decisions all live in the flow slice, one call per flow. Rendering them into the Operation
 * Context measured 43,660 characters for the `web` item of a real quest — 61,501 with its prompt
 * around it, against `mcpToolResultStatics.maxVerbatimChars` (50,000) — and an over-budget prompt is
 * spilled to a file, so the session starts holding a path instead of its instructions. Two tool
 * results are two separate budgets; one is one.
 *
 * NODE MEMBERSHIP is "tags my package", the SAME rule the fan-out mints cells by. A glue node is
 * therefore in both sides' scopes, because a seam has two halves and each side builds its own.
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, OperationItem, Quest } from '@dungeonmaster/shared/contracts';

// The package KIND that answers "where does code two packages both call live". It is the whole of
// `packageBuildOrderStatics`' first tier, described there as the pure providers nothing in the
// workspace can be built against until they exist — which is exactly the property a shared home
// needs. The NAME cannot be written down anywhere: every repo picks its own (`shared`,
// `shared-core`, `shared-ui`), so the kind is what a prompt can be built on.
const SHARED_HOME_KIND = 'library';

export const codeweaverScopeBlockTransformer = ({
  quest,
  operationItem,
}: {
  quest: Quest;
  operationItem: OperationItem;
}): ContentText[] => {
  const [ownPackage] = operationItem.packageNames;
  if (ownPackage === undefined) {
    return [];
  }
  const ownPackageText = String(ownPackage);

  const scopedFlows = quest.flows.filter((flow) =>
    operationItem.flowIds.some((flowId) => String(flowId) === String(flow.id)),
  );
  // The flow travels with the node because the seam block asks a per-FLOW question of the ledger —
  // "is there a cell for the other side of this node, on this flow, and has it run?"
  const scopedNodes = scopedFlows.flatMap((flow) =>
    flow.nodes
      .filter((node) => node.packages.some((name) => String(name) === ownPackageText))
      .map((node) => ({ flow, node })),
  );

  // SEAMS. A glue node tags more than one package, and every package it tags has its own item
  // carrying this flow — so the other half is somebody's declared scope, not a gap. What the
  // session needs is WHOSE and WHETHER IT HAS RUN, and only the ledger answers that: the relay
  // dispatches in ledger order, so a sibling item still `pending` is a session yet to come and one
  // already `complete` is code that can be opened right now. Telling a provider to "verify the
  // consumer's half exists" is unsatisfiable, and telling a consumer nothing about a provider that
  // pivoted is how a seam ships broken.
  //
  // The FLOW narrows the sibling match, and with one item per (package, flow) cell that match is
  // exact: at most one sibling cell can answer for the other half. An item that does not carry this
  // flow does not render this node in its own scope either, so it genuinely owns no half here —
  // which is exactly what a node added to the flow after Start looks like, the ledger being derived
  // once and never re-derived.
  const seams = scopedNodes.flatMap(({ flow, node }) =>
    node.packages
      .filter((name) => String(name) !== ownPackageText)
      .map((other) => {
        const otherText = String(other);
        const siblings = quest.operations.filter(
          (candidate) =>
            candidate.role === 'codeweaver' &&
            candidate.packageNames.some((name) => String(name) === otherText) &&
            candidate.flowIds.some((flowId) => String(flowId) === String(flow.id)),
        );
        const unfinished = siblings.filter((candidate) => candidate.status !== 'complete');
        return {
          node,
          other: otherText,
          // No cell at all means nobody will ever build this half — the reachable case is a node
          // added to the flow AFTER Start, since the ledger is derived once and never re-derived.
          disposition:
            siblings.length === 0
              ? 'NO SESSION OWNS IT: the ledger holds no codeweaver cell for it on this flow, so this half is yours to build'
              : unfinished.length === 0
                ? 'ALREADY BUILT: verify each of these EXISTS in committed code before you plan, and repair it if it does not'
                : 'NOT BUILT YET: a later session owns these — build your half to the shape they need, and do NOT build theirs',
        };
      }),
  );

  const seamLines =
    seams.length === 0
      ? []
      : [
          contentTextContract.parse(''),
          contentTextContract.parse(
            'Seams — each line is a node you share with another package, and where that package’s half of it stands:',
          ),
          ...seams.map(({ node, other, disposition }) =>
            contentTextContract.parse(`  - #${String(node.id)} with ${other} — ${disposition}`),
          ),
        ];

  // SHARED HOMES. The seams above are about a node two packages SHARE; this is about code that has
  // to MOVE. A cell told to stay in one package, needing behaviour that lives in a sibling, has one
  // right answer — put it where both can call it — and two wrong ones it reaches for otherwise: copy
  // it, or import across a dependency edge that does not exist. Only the quest can name the
  // candidate, and `packagesAffected` is where it is named, because that list is the closed set
  // every package name on this quest is checked against.
  //
  // Matched on the entry's whole KIND SET, never on the `packageType` display label alone: that
  // field is the detector's first match and a package can honestly be more than one, so a shared
  // library fronted by anything else would be dropped by the single winning kind.
  const ownGraphEntry = quest.packageGraph.find((entry) => String(entry.id) === ownPackageText);
  const ownDependsOn = new Set(
    (ownGraphEntry?.dependsOn ?? []).map((dependency) => String(dependency)),
  );

  const sharedHomes = quest.packagesAffected
    .filter((entry) => {
      const kinds = entry.packageTypes.length > 0 ? entry.packageTypes : [entry.packageType];
      return (
        String(entry.name) !== ownPackageText &&
        // A package the quest DELETES is no home for anything: it is gone once this lands.
        entry.changeType !== 'delete' &&
        kinds.some((kind) => String(kind) === SHARED_HOME_KIND)
      );
    })
    .map((entry) => ({
      name: String(entry.name),
      // Whether the move also has to add a manifest dependency. Read off the derived graph rather
      // than the manifests, because the graph is the POST-quest answer and a `new` package's edges
      // exist nowhere else yet.
      reachable: ownDependsOn.has(String(entry.name)),
    }));

  // Reachable first: a home the package already depends on is the one whose move is a file and an
  // import rather than a file, an import and a package.json edit.
  const orderedSharedHomes = [...sharedHomes].sort((left, right) =>
    left.reachable === right.reachable
      ? left.name.localeCompare(right.name)
      : Number(right.reachable) - Number(left.reachable),
  );

  const sharedHomeLines =
    orderedSharedHomes.length === 0
      ? []
      : [
          contentTextContract.parse(''),
          contentTextContract.parse(
            `Shared homes — the ${SHARED_HOME_KIND}-kind packages this quest declares. Code your package and another BOTH need moves into one of these, rather than being copied into yours or reached across for:`,
          ),
          ...orderedSharedHomes.map(({ name, reachable }) =>
            contentTextContract.parse(
              `  - ${name} — ${
                reachable
                  ? `${ownPackageText} already depends on it`
                  : `${ownPackageText} does not depend on it yet, so the move adds that dependency too`
              }`,
            ),
          ),
        ];

  return [...seamLines, ...sharedHomeLines];
};
