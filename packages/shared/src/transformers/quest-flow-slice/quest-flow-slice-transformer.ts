/**
 * PURPOSE: Renders ONE flow of a quest as the whole spec a session that owns that flow needs, and
 * nothing else. Reach for this over `questToTextDisplayTransformer` whenever the reader owns a
 * single flow (codeweaver, flowrider, siegemaster): a whole-quest render grows with the quest and
 * passes `mcpToolResultStatics.maxVerbatimChars` (50,000) on any quest of real size — one three-flow
 * quest was measured at 69,180 — and an over-budget MCP result is spilled to a file and answered
 * with an error stub, a silent dispatch failure where the session holds a path instead of its spec.
 *
 * USAGE:
 * questFlowSliceTransformer({ quest, flowId, packageName });
 * // Returns ContentText — the quest header, the OTHER flows as ids and names only, this flow whole,
 * // the cross-flow edges in both directions, its contracts, and its design decisions plus the
 * // quest-wide ones
 *
 * questFlowSliceTransformer({ quest, packageName });
 * // The foundation view: every contract that package owns, and which flows it tags nodes in
 *
 * CUTTING THE FLOWS THE READER DOES NOT OWN IS WHAT BUYS THE SAVING. Everything else here is
 * additive; two of three flows removed is two thirds of the graph, the observables and the
 * contracts. What replaces them is a list of ids and names, so a session still knows the rest of the
 * spine exists and can ask for it by name.
 *
 * QUEST-WIDE DESIGN DECISIONS ARE UNCONDITIONAL. A decision with no `relatedNodeIds` governs the
 * whole quest and is usually the user's own intake answer; every node-based filter written against
 * this data has dropped all of them, 9 of 33 on the quest this was measured on. They are the
 * cheapest section here and the one no reader can re-derive.
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';
import type { FlowId } from '../../contracts/flow-id/flow-id-contract';
import type { PackageName } from '../../contracts/package-name/package-name-contract';
import type { Quest } from '../../contracts/quest/quest-contract';
import { questFlowSliceLimitsStatics } from '../../statics/quest-flow-slice-limits/quest-flow-slice-limits-statics';
import { textDisplaySymbolsStatics } from '../../statics/text-display-symbols/text-display-symbols-statics';
import { flowGraphToTextTransformer } from '../flow-graph-to-text/flow-graph-to-text-transformer';
import { questContractPropertiesToTextTransformer } from '../quest-contract-properties-to-text/quest-contract-properties-to-text-transformer';
import { questContractSourceOwnerTransformer } from '../quest-contract-source-owner/quest-contract-source-owner-transformer';
import { questPackageEntriesToTextTransformer } from '../quest-package-entries-to-text/quest-package-entries-to-text-transformer';

const SYM = textDisplaySymbolsStatics;
const PROPERTY_START_DEPTH = 1;
const CROSS_FLOW_INBOUND_NOTE =
  'Another flow enters yours here. Treat the arriving node as GIVEN; do not re-prove it.';

export const questFlowSliceTransformer = ({
  quest,
  flowId,
  packageName,
}: {
  quest: Quest;
  // The flow to render whole. Omitted, the result is the foundation view — contracts plus which
  // flows the package tags nodes in — which is the only useful answer for an item that owns
  // contracts and tags no node anywhere.
  flowId?: FlowId | undefined;
  // The package whose half of the flow is the reader's. Omitted, every node is theirs and every
  // observable renders verbatim — the flowrider / siegemaster / reviewer view.
  packageName?: PackageName | undefined;
}): ContentText => {
  const flow =
    flowId === undefined
      ? undefined
      : quest.flows.find((candidate) => String(candidate.id) === String(flowId));
  const packageNameText = packageName === undefined ? undefined : String(packageName);

  const parts: ContentText[] = [
    contentTextContract.parse(`# Quest: ${String(quest.title)}`),
    contentTextContract.parse(
      `Quest ID: ${String(quest.id)} | Status: ${quest.status} | Type: ${quest.questType}`,
    ),
  ];

  if (quest.packagesAffected.length > 0) {
    parts.push(
      contentTextContract.parse(
        `Packages affected (whole quest): ${String(questPackageEntriesToTextTransformer({ entries: quest.packagesAffected }))}`,
      ),
    );
  }

  parts.push(
    contentTextContract.parse(''),
    contentTextContract.parse('Original user request (the intent behind the flows):'),
    contentTextContract.parse(String(quest.userRequest)),
  );

  if (flowId !== undefined && flow === undefined) {
    // Naming the flows that DO exist rather than only the miss: the caller reached here from a
    // ledger item or a prompt, so a bare "not found" leaves it unable to tell a typo from a flow
    // that was renamed under it.
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        `## No flow #${String(flowId)} on this quest. Its flows are: ${
          quest.flows.length === 0
            ? SYM.none
            : quest.flows.map((candidate) => `#${String(candidate.id)}`).join(', ')
        }`,
      ),
    );
    return contentTextContract.parse(parts.join('\n'));
  }

  // The same refusal the flow miss above gets, for the same reason and a sharper one. An unknown
  // package is an error NOWHERE downstream: every observable simply reads as somebody else's, so the
  // slice renders with no observable text and no `◀ YOURS` mark anywhere — which is
  // INDISTINGUISHABLE from a package that genuinely owns nothing on this flow. Measured on a real
  // quest: a caller that typed `orchastrator` for `orchestrator` was served a clean-looking render
  // of a flow whose nine observables it owned, every one of them collapsed into a count.
  //
  // The closed set is every package the quest names ANYWHERE — declared in `packagesAffected`,
  // tagged on a node, or carried by an observable — rather than `packagesAffected` alone. A hydrated
  // quest can tag a node with a package it never declared, and refusing a name that IS on the graph
  // would be worse than the silence this replaces.
  const knownPackages = [
    ...new Set([
      ...quest.packagesAffected.map((entry) => String(entry.name)),
      ...quest.flows.flatMap((candidate) =>
        candidate.nodes.flatMap((node) => [
          ...node.packages.map((name) => String(name)),
          ...node.observables.map((observable) => String(observable.package)),
        ]),
      ),
    ]),
  ];
  if (packageNameText !== undefined && !knownPackages.includes(packageNameText)) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        `## No package "${packageNameText}" on this quest. Its packages are: ${
          knownPackages.length === 0 ? SYM.none : knownPackages.join(', ')
        }`,
      ),
    );
    return contentTextContract.parse(parts.join('\n'));
  }

  // The rest of the spine, by name only. A session that cannot see a flow still has to know it is
  // there — a hand-off lands in one of these, and a defect it finds may belong to one.
  const otherFlows = quest.flows.filter((candidate) => candidate.id !== flow?.id);
  if (otherFlows.length > 0) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        flow === undefined
          ? '## Flows on this quest — fetch each one you own with get-quest({ questId, flowId })'
          : '## Other flows on this quest — ids and names only, NOT your scope',
      ),
      ...otherFlows.map((candidate) => {
        const taggedHere =
          packageNameText !== undefined &&
          candidate.nodes.some((node) =>
            node.packages.some((name) => String(name) === packageNameText),
          );
        return contentTextContract.parse(
          `#${String(candidate.id)} ${SYM.emDash} "${String(candidate.name)}" (${candidate.flowType})${
            taggedHere ? ` ${SYM.emDash} you tag nodes here` : ''
          }`,
        );
      }),
    );
  }

  if (flow !== undefined) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        (packageNameText === undefined
          ? SYM.flowSliceWholeFlowLegendLines
          : SYM.flowSliceLegendLines
        ).join('\n'),
      ),
      contentTextContract.parse(''),
      contentTextContract.parse(
        `## Flow: #${String(flow.id)} ${SYM.emDash} "${String(flow.name)}"`,
      ),
      contentTextContract.parse(`Type: ${flow.flowType}`),
      ...(flow.scope === undefined
        ? []
        : [contentTextContract.parse(`Scope: ${String(flow.scope)}`)]),
      contentTextContract.parse(`Entry: ${String(flow.entryPoint)}`),
      contentTextContract.parse(
        `Exits: ${flow.exitPoints.map((exitPoint) => String(exitPoint)).join(' | ')}`,
      ),
      ...(packageNameText === undefined
        ? [
            contentTextContract.parse(
              'The WHOLE flow is yours — every node, whatever package it lands in.',
            ),
          ]
        : [
            contentTextContract.parse(
              `Your package: ${packageNameText}. Its nodes carry ${SYM.ownedNode}; only YOUR observables are listed, and each node's tag set counts the rest (${SYM.observable}). The graph is NOT filtered — the nodes between yours are how yours connect.`,
            ),
          ]),
      contentTextContract.parse(''),
      ...flowGraphToTextTransformer({
        flow,
        ...(packageName !== undefined && { ownPackage: packageName }),
        otherFlows: quest.flows,
      }),
    );

    // INBOUND cross-flow edges. Nothing else surfaces these: a cross-flow edge is stored on the
    // flow that OWNS it, so the flow being entered has no record of the entry at all. Measured on a
    // real quest, one flow had one inbound edge and zero outbound — a session reading it would have
    // written its arrange block assuming the target node has exactly one entry route.
    const inboundEdges = quest.flows.flatMap((source) =>
      source.id === flow.id
        ? []
        : source.edges.flatMap((edge) => {
            const target = String(edge.to);
            if (!target.startsWith(`${String(flow.id)}:`)) {
              return [];
            }
            const sourceNode = source.nodes.find((node) => String(node.id) === String(edge.from));
            return sourceNode === undefined ? [] : [{ source, edge, sourceNode, target }];
          }),
    );

    if (inboundEdges.length > 0) {
      parts.push(
        contentTextContract.parse(''),
        contentTextContract.parse('### Edges arriving from another flow'),
        ...inboundEdges.flatMap((inbound) => [
          contentTextContract.parse(
            `${SYM.rightArrow}${inbound.edge.label === undefined ? '' : `"${String(inbound.edge.label)}" `}into [#${inbound.target.slice(`${String(flow.id)}:`.length)}]`,
          ),
          contentTextContract.parse(
            `${SYM.indent}source: [#${String(inbound.sourceNode.id)}] {${inbound.sourceNode.packages.map((name) => String(name)).join(', ')}} ${String(inbound.sourceNode.label)} (${inbound.sourceNode.type}) in flow #${String(inbound.source.id)} "${String(inbound.source.name)}"`,
          ),
          contentTextContract.parse(`${SYM.indent}${CROSS_FLOW_INBOUND_NOTE}`),
        ]),
      );
    }
  }

  // Contracts. With a flow, the ones anchored to a node ON it; without one, every contract the
  // package owns, which is the whole point of the foundation view. `packageName` then narrows by
  // PATH — the contract's own file, or an individual property's, resolved through the same
  // transformer the save-time coverage gate and the derived ledger use, so a contract one of them
  // routes to a package is never one this render drops.
  const flowNodeIds = new Set((flow?.nodes ?? []).map((node) => String(node.id)));
  const ownedContracts = quest.contracts.flatMap((contract) => {
    if (packageNameText === undefined) {
      return flow !== undefined && !flowNodeIds.has(String(contract.nodeId))
        ? []
        : [{ contract, properties: contract.properties }];
    }
    const ownsTheFile =
      String(
        questContractSourceOwnerTransformer({
          contract,
          packagesAffected: quest.packagesAffected,
        }),
      ) === packageNameText;
    const properties = contract.properties.filter(
      (property) =>
        String(
          questContractSourceOwnerTransformer({
            contract,
            property,
            packagesAffected: quest.packagesAffected,
          }),
        ) === packageNameText,
    );
    // The file is this package's, or at least one property of it is. A package holding only
    // properties still gets the header, because the contract is where those lines live.
    return ownsTheFile || properties.length > 0 ? [{ contract, properties }] : [];
  });

  // ONE CALL, NOT TWO. A contract routes to a package by PATH, so a package can own one anchored to
  // a node on a flow it tags NO node in — and the relay mints a cell per (package, flow) the package
  // tags, so no cell of that package would ever render it. That orphan is the whole reason
  // codeweaver made a second `{ questId, packageName }` call. Rendering it here collapses the pair.
  //
  // ONLY the orphans, never every off-flow contract. A contract anchored to a flow this package DOES
  // tag already has a cell of its own that shows it under the first heading — measured on a real
  // quest, including those put all four of `server`'s contracts in BOTH its cells, once as "build
  // this" and once as "do not". That is duplication wearing a distinction's clothes.
  //
  // AND THE WHOLE SECTION IS PACKAGED-VIEW-ONLY. "A contract you own that no flow of YOURS anchors"
  // is a statement about a package's slice, and the unpackaged reader owns the whole flow — so its
  // orphan set is empty by definition. Without that gate the set below is built by comparing every
  // node's packages against `undefined`, which matches nothing, leaving `taggedFlowNodeIds` empty
  // and the filter keeping every contract the first heading just printed. Measured on a real
  // three-flow quest: the flowrider / reviewer render carried all seven of its contracts twice,
  // 7,195 of 42,925 characters, the copy headed "NO flow of yours anchors".
  const taggedFlowNodeIds = new Set(
    packageNameText === undefined
      ? []
      : quest.flows
          .filter((candidate) =>
            candidate.nodes.some((node) =>
              node.packages.some((name) => String(name) === packageNameText),
            ),
          )
          .flatMap((candidate) => candidate.nodes.map((node) => String(node.id))),
  );
  const contractGroups = [
    {
      heading:
        flow === undefined
          ? '## Contracts you own — every property description is a requirement'
          : '## Contracts on this flow — every property description is a requirement',
      entries:
        flow === undefined
          ? ownedContracts
          : ownedContracts.filter(({ contract }) => flowNodeIds.has(String(contract.nodeId))),
    },
    {
      heading:
        '## Contracts you own that NO flow of yours anchors — honour them; no sibling session sees them',
      entries:
        flow === undefined || packageNameText === undefined
          ? []
          : ownedContracts.filter(
              ({ contract }) => !taggedFlowNodeIds.has(String(contract.nodeId)),
            ),
    },
  ];

  for (const group of contractGroups) {
    if (group.entries.length > 0) {
      parts.push(
        contentTextContract.parse(''),
        contentTextContract.parse(group.heading),
        ...group.entries.flatMap(({ contract, properties }) => [
          contentTextContract.parse(
            `#${String(contract.id)} ${SYM.emDash} ${String(contract.name)} (${contract.kind}, ${contract.status}) [${SYM.rightArrow} ${String(contract.source)}] on node #${String(contract.nodeId)}`,
          ),
          ...(properties.length === 0
            ? []
            : questContractPropertiesToTextTransformer({
                properties,
                depth: PROPERTY_START_DEPTH,
              })),
        ]),
      );
    }
  }

  // The decisions that govern what was RENDERED, never everything the package owns. A contract
  // anchored to a flow this package tags but is not reading now belongs to that OTHER cell and
  // renders in neither group above — pulling its node into this set would drag a sibling cell's
  // design decisions into this one, explaining a node this session was never shown.
  const renderedContracts = contractGroups.flatMap((group) => group.entries);

  const governingNodeIds = new Set([
    ...flowNodeIds,
    ...renderedContracts.map(({ contract }) => String(contract.nodeId)),
  ]);
  const scopedDecisions = quest.designDecisions.filter(
    (decision) =>
      decision.relatedNodeIds.length > 0 &&
      decision.relatedNodeIds.some((nodeId) => governingNodeIds.has(String(nodeId))),
  );
  const questWideDecisions = quest.designDecisions.filter(
    (decision) => decision.relatedNodeIds.length === 0,
  );

  if (scopedDecisions.length > 0) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse('## Design decisions governing these nodes'),
      ...scopedDecisions.flatMap((decision) => [
        contentTextContract.parse(`#${String(decision.id)}: "${String(decision.title)}"`),
        contentTextContract.parse(`${SYM.indent}Rationale: ${String(decision.rationale)}`),
        contentTextContract.parse(
          `${SYM.indent}Relates to: ${decision.relatedNodeIds.map((nodeId) => `#${String(nodeId)}`).join(', ')}`,
        ),
      ]),
    );
  }

  if (questWideDecisions.length > 0) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        '## Design decisions for the whole quest — no node named, so they bind every flow',
      ),
      ...questWideDecisions.flatMap((decision) => [
        contentTextContract.parse(`#${String(decision.id)}: "${String(decision.title)}"`),
        contentTextContract.parse(`${SYM.indent}Rationale: ${String(decision.rationale)}`),
      ]),
    );
  }

  // NO OFF-MAP PROBES HERE. They belong to `get-qa-checklist`, which the one role that owns them
  // already calls — siegemaster and its reviewer, whose track is the only one carrying `off-map` in
  // its `unitKinds`. That tool prints each family's full probe sentence to the sessions that sign
  // them, and omits the kind entirely from every other track's checklist, so rendering them here
  // would reach nobody who could act on one.
  //
  // The fifth reader is what made it worse than duplication. `codeweaver-reviewer` calls
  // `get-quest({ questId, flowId })` with no package — the same unpackaged shape — and calls
  // `get-qa-checklist` never. It was the one session shown these, and they are the one part of that
  // render provably belonging to a role that has not run yet.
  const body = parts.join('\n');

  if (body.length <= questFlowSliceLimitsStatics.maxRenderChars) {
    return contentTextContract.parse(body);
  }

  // The only bound that actually holds. Every section above is bounded by the SHAPE of the call, but
  // the prose inside it is author-written and no per-field cut is safe — an observable's description
  // and a decision's rationale ARE the requirement. Cut on a line boundary: half an id reads as a
  // rendering bug rather than as a limit.
  const cut = body.slice(0, questFlowSliceLimitsStatics.maxRenderChars);
  const kept = cut.slice(0, cut.lastIndexOf('\n') + 1);

  return contentTextContract.parse(
    `${kept}\n[TRUNCATED at the ${String(questFlowSliceLimitsStatics.maxRenderChars)}-character ceiling — ${String(body.length - kept.length)} character(s) were dropped from the END of this render, so the sections after this line are missing or cut short. Sections run flow graph, cross-flow edges, contracts, design decisions, off-map probes; read quest.json for whatever fell off.]`,
  );
};
