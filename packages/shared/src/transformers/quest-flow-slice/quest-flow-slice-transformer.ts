/**
 * PURPOSE: Renders ONE flow of a quest as the whole spec a session that owns that flow needs, and
 * nothing else. Reach for this over `questToTextDisplayTransformer` whenever the reader owns a
 * single flow (codeweaver, flowrider, siegemaster): the whole-quest render of a real three-flow
 * quest measures 69,180 characters against `mcpToolResultStatics.maxVerbatimChars` (50,000), and an
 * over-budget MCP result is spilled to a file and answered with an error stub — a silent dispatch
 * failure where the session holds a path instead of its spec.
 *
 * USAGE:
 * questFlowSliceTransformer({ quest, flowId, packageName });
 * // Returns ContentText — the quest header, the OTHER flows as ids and names only, this flow whole,
 * // the cross-flow edges in both directions, its contracts, its design decisions and the quest-wide
 * // ones, and (with no packageName) the off-map probe families
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
import { qaOffMapProbeStatics } from '../../statics/qa-off-map-probe/qa-off-map-probe-statics';
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
  // The package whose half of the flow is the reader's. Omitted, every node is theirs (the
  // flowrider / siegemaster view) and the off-map probe families render too — those have no
  // codeweaver column on `flowOffMapSignoffContract`, so they belong to nobody a package names.
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
      contentTextContract.parse(SYM.flowSliceLegendLines.join('\n')),
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
              `Your package: ${packageNameText}. Its nodes carry ${SYM.ownedNode}; another package's observables are collapsed to a count. The graph is NOT filtered — the nodes between yours are how yours connect.`,
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
            `${SYM.indent}source: [#${String(inbound.sourceNode.id)}] ${String(inbound.sourceNode.label)} (${inbound.sourceNode.type}) {${inbound.sourceNode.packages.map((name) => String(name)).join(', ')}} in flow #${String(inbound.source.id)} "${String(inbound.source.name)}"`,
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
  const contracts = quest.contracts.flatMap((contract) => {
    if (flow !== undefined && !flowNodeIds.has(String(contract.nodeId))) {
      return [];
    }
    if (packageNameText === undefined) {
      return [{ contract, properties: contract.properties }];
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

  if (contracts.length > 0) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        flow === undefined
          ? '## Contracts you own — every property description is a requirement'
          : '## Contracts on this flow — every property description is a requirement',
      ),
      ...contracts.flatMap(({ contract, properties }) => [
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

  const governingNodeIds = new Set([
    ...flowNodeIds,
    ...contracts.map(({ contract }) => String(contract.nodeId)),
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

  // Off-map probes are a WHOLE-FLOW obligation, so they render only for the reader who owns the
  // whole flow. `flowOffMapSignoffContract` has no codeweaver column at all — these are breakage
  // classes a graph structurally cannot draw, so no unit test written beside the code reaches them
  // — and printing them into a per-package slice would name work that track can never sign.
  if (flow !== undefined && packageNameText === undefined) {
    parts.push(
      contentTextContract.parse(''),
      contentTextContract.parse(
        '## Off-map probe families — breakage classes this graph cannot draw, one obligation each',
      ),
      ...Object.entries(qaOffMapProbeStatics.byFamily).map(([family, probe]) =>
        contentTextContract.parse(`${family}: ${probe}`),
      ),
    );
  }

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
