/**
 * PURPOSE: Renders a codeweaver operation item's SCOPE — its nodes, the observables it must satisfy
 * verbatim, the contracts it owns, and the seams it sits on — from the quest as it stands AT
 * DISPATCH, rather than from anything baked into the ledger
 *
 * USAGE:
 * codeweaverScopeBlockTransformer({ quest, operationItem });
 * // Returns ContentText[] lines to splice into the agent's Operation Context, empty when the item
 * // declares no package (nothing to scope)
 *
 * WHY THIS IS NOT ON THE OPERATION ITEM. The ledger stores only the cell key — one package, one flow
 * (or none, for a foundation item) — and the item's `text` is a label. Two things break if the scope
 * is written into that text at Start instead:
 *
 * 1. **The spec grows underneath the ledger.** Codeweaver holds additive spec authority and so do
 *    Flowrider and Siegemaster: they may add observables and nodes to an existing flow mid-quest. An
 *    observable added by the third session would be invisible to the seventh, whose text was written
 *    before it existed. Vague prose does not rot this way; a precise snapshot does.
 * 2. **The ledger render is budgeted.** `workItemToPromptTransformer` already elides completed items
 *    to stay under `mcpToolResultStatics.maxVerbatimChars`, because EVERY item's text prints in EVERY
 *    agent's ledger block. A dozen items each carrying verbatim observable text would blow that
 *    budget and start eliding the ledger the elision exists to protect.
 *
 * NODE MEMBERSHIP is "tags my package", the SAME rule the fan-out mints cells by. A glue node is
 * therefore in both sides' scopes, because a seam has two halves and each side builds its own. What
 * this file adds on top is the SEAM block: it reads the ledger to say which session owes the other
 * half and whether that session has already run, so "verify it exists" is only ever asked about
 * code that could already exist.
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText, OperationItem, Quest } from '@dungeonmaster/shared/contracts';

import { questContractSourceOwnerTransformer } from '../quest-contract-source-owner/quest-contract-source-owner-transformer';

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
  // The flow travels with the node because the seam block below asks a per-FLOW question of the
  // ledger — "is there a cell for the other side of this node, on this flow, and has it run?"
  const scopedNodes = scopedFlows.flatMap((flow) =>
    flow.nodes
      .filter((node) => node.packages.some((name) => String(name) === ownPackageText))
      .map((node) => ({ flow, node })),
  );
  const scopedNodeIds = new Set(scopedNodes.map(({ node }) => String(node.id)));

  const lines: ContentText[] = [];

  if (scopedNodes.length > 0) {
    lines.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        `Your nodes (rendered from the spec as it stands right now, not from the ledger): ${scopedNodes.map(({ node }) => `#${String(node.id)}`).join(', ')}`,
      ),
    );

    // An observable on a single-package node has its `package` resolved from that node at save time,
    // so this comparison holds for both shapes: a seam node states each side explicitly, a plain node
    // has already been filled in.
    const observables = scopedNodes.flatMap(({ node }) =>
      node.observables
        .filter((observable) => String(observable.package) === ownPackageText)
        .map((observable) => ({ node, observable })),
    );

    if (observables.length > 0) {
      lines.push(
        contentTextContract.parse(''),
        contentTextContract.parse('Must satisfy — these are YOUR acceptance targets, verbatim:'),
        ...observables.map(({ node, observable }) =>
          contentTextContract.parse(
            `  - ${String(observable.id)} [${observable.type}] on #${String(node.id)}: "${String(observable.description)}"`,
          ),
        ),
      );
    }
  }

  // Contracts route by PATH, never by node, because a foundation item has no node at all — and on
  // the quest that motivated this the whole `shared` scope was nine contracts against zero tagged
  // nodes. A flow cell still gets the contracts anchored to ITS nodes, so a contract is named to
  // the session that builds the thing it describes. Routing is per-PROPERTY as well as per-
  // contract: one contract can legitimately deliver into several packages, and each session is
  // shown only its own share of it.
  const contracts = quest.contracts.flatMap((contract) => {
    if (contract.status === 'existing') {
      return [];
    }
    if (operationItem.flowIds.length > 0 && !scopedNodeIds.has(String(contract.nodeId))) {
      return [];
    }
    const ownsTheFile =
      questContractSourceOwnerTransformer({
        contract,
        packagesAffected: quest.packagesAffected,
      }) === ownPackage;
    const properties = contract.properties.filter(
      (property) =>
        questContractSourceOwnerTransformer({
          contract,
          property,
          packagesAffected: quest.packagesAffected,
        }) === ownPackage,
    );
    // The file is this package's, or at least one property of it is. A package holding only
    // properties still gets the header, because the contract is where those lines live.
    return ownsTheFile || properties.length > 0 ? [{ contract, properties }] : [];
  });

  if (contracts.length > 0) {
    lines.push(
      contentTextContract.parse(''),
      contentTextContract.parse('Contracts you own — every property description is a requirement:'),
      ...contracts.flatMap(({ contract, properties }) => [
        contentTextContract.parse(
          `  - ${String(contract.name)} (${contract.kind}, ${contract.status}) [${String(contract.source)}]`,
        ),
        ...properties.map((property) =>
          contentTextContract.parse(
            property.source === undefined
              ? `      ${String(property.name)}: ${String(property.description)}`
              : `      ${String(property.name)} [${String(property.source)}]: ${String(property.description)}`,
          ),
        ),
      ]),
    );
  }

  const decisions = quest.designDecisions.filter((decision) =>
    decision.relatedNodeIds.some((nodeId) => scopedNodeIds.has(String(nodeId))),
  );

  if (decisions.length > 0) {
    lines.push(
      contentTextContract.parse(''),
      contentTextContract.parse('Design decisions constraining your nodes:'),
      ...decisions.map((decision) =>
        contentTextContract.parse(`  - ${String(decision.title)} — ${String(decision.rationale)}`),
      ),
    );
  }

  // SEAMS. A glue node tags more than one package, and every package it tags has its own cell for
  // this flow — so the other half is somebody's declared scope, not a gap. What the session needs
  // is WHOSE and WHETHER IT HAS RUN, and only the ledger answers that: the relay dispatches in
  // ledger order, so a sibling cell still `pending` is a session yet to come and one already
  // `complete` is code that can be opened right now. Telling a provider to "verify the consumer's
  // half exists" is unsatisfiable, and telling a consumer nothing about a provider that pivoted is
  // how a seam ships broken.
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

  if (seams.length > 0) {
    lines.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        'Seams — each line is a node you share with another package, and where that package’s half of it stands:',
      ),
      ...seams.flatMap(({ node, other, disposition }) => [
        contentTextContract.parse(`  - #${String(node.id)} with ${other} — ${disposition}`),
        ...node.observables
          .filter((observable) => String(observable.package) === other)
          .map((observable) =>
            contentTextContract.parse(
              `      attributed to ${other} — ${String(observable.id)}: "${String(observable.description)}"`,
            ),
          ),
      ]),
    );
  }

  return lines;
};
