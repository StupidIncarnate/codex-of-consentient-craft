/**
 * PURPOSE: Renders the SEAMS a codeweaver operation item sits on — each node it shares with another
 * package, and where that package's half of it stands in the relay right now. Reach for this rather
 * than the flow slice `get-quest({ questId, flowId, packageName })` returns: that render answers
 * what the spec says, and this one answers a question only the operations LEDGER holds — whose half
 * the other side of a node is, and whether that session has already run.
 *
 * USAGE:
 * codeweaverScopeBlockTransformer({ quest, operationItem });
 * // Returns ContentText[] lines to splice into the agent's Operation Context, empty when the item
 * // declares no package or shares no node with one
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

  if (seams.length === 0) {
    return [];
  }

  return [
    contentTextContract.parse(''),
    contentTextContract.parse(
      'Seams — each line is a node you share with another package, and where that package’s half of it stands:',
    ),
    ...seams.map(({ node, other, disposition }) =>
      contentTextContract.parse(`  - #${String(node.id)} with ${other} — ${disposition}`),
    ),
  ];
};
